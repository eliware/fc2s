import { EventEmitter } from "node:events";
import {
  getFile,
  makeDirectory,
  mockEffects,
  putFile,
  removeTree,
} from "../test-fixtures/mock-effects.mjs";

await mockEffects();
const { db, dumpTable, run } = await import("../src/mysql.mjs");

function child({ output = "", error = "", code = 0 } = {}) {
  const p = new EventEmitter();
  p.stdin = { end: (input) => (p.input = input) };
  p.stdout = new EventEmitter();
  p.stderr = new EventEmitter();
  queueMicrotask(() => {
    if (output) p.stdout.emit("data", output);
    if (error) p.stderr.emit("data", error);
    p.emit("close", code);
  });
  return p;
}

test("db uses injected mysql client and stream factory", async () => {
  const connection = {};
  const createReadStream = (file) => file;
  const mysql = {
    createConnection: (options) => {
      connection.options = options;
      return connection;
    },
  };
  expect(
    db(
      { host: "h", port: 1, user: "u", password: "p", sslCa: "/ca.pem" },
      { mysql, createReadStream, readFileSync: () => "CA CERT" },
    ).options,
  ).toMatchObject({ host: "h", port: 1, user: "u", password: "p" });
  expect(connection.options.ssl).toEqual({
    ca: "CA CERT",
    rejectUnauthorized: true,
    verifyIdentity: true,
  });
  expect(connection.options.infileStreamFactory("x")).toBe("x");
});

test("db keeps TLS optional when no CA is configured", () => {
  const mysql = { createConnection: (options) => options };
  expect(db({ host: "h", port: 1, user: "u", password: "p" }, { mysql })).not.toHaveProperty("ssl");
});

test("run captures output and injected spawn failures", async () => {
  await expect(run("x", [], {}, { spawn: () => child({ output: "ok" }) })).resolves.toBe("ok");
  await expect(run("x", [], {}, { spawn: () => child({ error: "bad", code: 2 }) })).rejects.toThrow(
    "bad",
  );
  const failing = new EventEmitter();
  await expect(
    run(
      "x",
      [],
      {},
      {
        spawn: () => {
          queueMicrotask(() => failing.emit("error", new Error("spawn failed")));
          return failing;
        },
      },
    ),
  ).rejects.toThrow("spawn failed");
});

test("dumpTable uses injected process and pipeline", async () => {
  const calls = [];
  const stream = {};
  const spawn = (command, args, options) => {
    const process = child({ output: "SQL" });
    calls.push({ command, args, options, process });
    return process;
  };
  const pipeline = async (input, output) => {
    expect(input).toBeDefined();
    expect(output).toBe(stream);
  };
  await dumpTable(
    { host: "h", port: 3306, user: "u", password: "p", sslCa: "/ca.pem" },
    "db",
    "table",
    "x.sql",
    {
      spawn,
      pipeline,
      createWriteStream: () => stream,
    },
  );
  expect(calls[0].args).not.toContain("--password=p");
  expect(calls[0].args[0]).toBe("--no-defaults");
  expect(calls[0].args).toContain("--password");
  expect(calls[0].args).not.toContain("p");
  expect(calls[0].process.input).toBe("p\n");
  expect(calls[0].options.env.MYSQL_PWD).toBe("");
  expect(calls[0].options.env.MARIADB_PWD).toBe("");
  expect(calls[0].args).toContain("table");
  expect(calls[0].args).toContain("--ssl");
  expect(calls[0].args).toContain("--ssl-verify-server-cert");
  expect(calls[0].args).toContain("/ca.pem");
});

test("dumpTable keeps TLS optional when no CA is configured", async () => {
  let args;
  await dumpTable({ host: "h", port: 3306, user: "u", password: "p" }, "db", "table", "x.sql", {
    spawn: (command, receivedArgs) => {
      args = receivedArgs;
      return child();
    },
    pipeline: async () => {},
    createWriteStream: () => ({}),
  });
  expect(args).not.toContain("--ssl");
});

test("dumpTable reports injected command failure", async () => {
  await expect(
    dumpTable(
      { host: "h", port: 3306, user: "u", password: "p", sslCa: "/ca.pem" },
      "db",
      "t",
      "x",
      {
        spawn: () => child({ error: "dump failed", code: 3 }),
        pipeline: async () => {},
        createWriteStream: () => ({}),
      },
    ),
  ).rejects.toThrow("dump failed");
});

test("run uses fallback command error when stderr is empty", async () => {
  await expect(run("x", [], {}, { spawn: () => child({ code: 2 }) })).rejects.toThrow(
    "command failed: 2",
  );
});

test("run handles children without output streams", async () => {
  const p = new EventEmitter();
  queueMicrotask(() => p.emit("close", 0));
  await expect(run("x", [], {}, { spawn: () => p })).resolves.toBe("");
});

test("dumpTable uses fallback error when stderr is empty", async () => {
  await expect(
    dumpTable({ host: "h", port: 3306, user: "u", password: "p" }, "db", "t", "x", {
      spawn: () => child({ code: 3 }),
      pipeline: async () => {},
      createWriteStream: () => ({}),
    }),
  ).rejects.toThrow("mysqldump failed: 3");
});

test("db uses default read stream dependency", async () => {
  const mysql = { createConnection: (options) => options };
  putFile("/workspace/mysql-input", "input");
  const options = db(
    { host: "h", port: 1, user: "u", password: "p", sslCa: "/ca.pem" },
    { mysql, readFileSync: () => "CA" },
  );
  const stream = options.infileStreamFactory("/workspace/mysql-input");
  expect(stream).toBeDefined();
  stream.destroy();
});

test("run uses the default spawn implementation", async () => {
  await expect(run("fake-output", [])).resolves.toBe("ok");
});

test("dumpTable uses default pipeline and write stream", async () => {
  const { PassThrough } = await import("node:stream");
  const root = makeDirectory("mysql");
  const file = `${root}/dump.sql`;
  const output = new PassThrough();
  const spawn = () => {
    const p = child();
    p.stdout = output;
    queueMicrotask(() => {
      output.end("SQL");
      p.emit("close", 0);
    });
    return p;
  };
  await dumpTable(
    { host: "h", port: 3306, user: "u", password: "p", sslCa: "/ca.pem" },
    "db",
    "t",
    file,
    { spawn },
  );
  expect(getFile(file, "utf8")).toBe("SQL");
  removeTree(root);
});

test("db rejects with default mysql client when connection fails", async () => {
  await expect(
    db({ host: "127.0.0.1", port: 1, user: "invalid", password: "invalid" }),
  ).rejects.toBeDefined();
});

test("dumpTable selects default process dependencies", async () => {
  await expect(
    dumpTable(
      { host: "h", port: 1, user: "u", password: "p" },
      "db",
      "t",
      "/workspace/default-dump.sql",
    ),
  ).resolves.toBeUndefined();
});
