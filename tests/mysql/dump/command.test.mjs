import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const dumpCommand = (await import("../../../src/mysql/dump/command.mjs")).default;

test("dumpCommand builds arguments and configures optional verified TLS", () => {
  const { command, args, options } = dumpCommand(
    { host: "host", port: 3306, user: "user", password: "secret", sslCa: "/ca.pem" },
    "database",
    "table",
    "/tmp/client.cnf",
  );
  expect(command).toBe("mariadb-dump");
  expect(args[0]).toBe("--defaults-file=/tmp/client.cnf");
  expect(args).not.toContain("secret");
  expect(args).toContain("--ssl-verify-server-cert");
  expect(args).toContain("/ca.pem");
  expect(options).toEqual({ stdio: ["pipe", "pipe", "pipe"] });
});

test("dumpCommand omits TLS options without a CA", () => {
  const args = dumpCommand({ host: "h", port: 1, user: "u" }, "d", "t", "/tmp/client.cnf").args;
  expect(args).not.toContain("--ssl-ca");
  expect(args).not.toContain("--ssl-verify-server-cert");
});

test("dumpCommand rejects unsafe table identifiers", () => {
  expect(() =>
    dumpCommand({ host: "h", port: 1, user: "u" }, "d", "bad-name", "/tmp/client.cnf"),
  ).toThrow("Unsafe identifier: bad-name");
});

test("dumpCommand rejects unsafe database identifiers", () => {
  expect(() =>
    dumpCommand({ host: "h", port: 1, user: "u" }, "bad-name", "table", "/tmp/client.cnf"),
  ).toThrow("Unsafe identifier: bad-name");
});
