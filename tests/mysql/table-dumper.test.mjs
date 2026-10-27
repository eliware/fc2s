import { EventEmitter } from "node:events";
import {
  getFile,
  makeDirectory,
  mockEffects,
  removeTree,
} from "../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { dumpTable } = await import("../../src/mysql/table-dumper.mjs");

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

test("dumpTable uses fallback error when stderr is empty", async () => {
  await expect(
    dumpTable({ host: "h", port: 3306, user: "u", password: "p" }, "db", "t", "x", {
      spawn: () => child({ code: 3 }),
      pipeline: async () => {},
      createWriteStream: () => ({}),
    }),
  ).rejects.toThrow("mysqldump failed: 3");
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
