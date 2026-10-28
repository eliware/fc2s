import { mockEffects } from "../../../test-fixtures/mock-effects.mjs";

await mockEffects();
const { dumpCommand } = await import("../../../src/mysql/dump/command.mjs");

test("dumpCommand builds arguments and configures optional verified TLS", () => {
  const { command, args, options } = dumpCommand(
    { host: "host", port: 3306, user: "user", password: "secret", sslCa: "/ca.pem" },
    "database",
    "table",
  );
  expect(command).toBe("mysqldump");
  expect(args).toContain("--password");
  expect(args).not.toContain("secret");
  expect(args).toContain("--ssl-verify-server-cert");
  expect(args).toContain("/ca.pem");
  expect(options).toEqual({ stdio: ["pipe", "pipe", "pipe"] });
});

test("dumpCommand omits TLS options without a CA", () => {
  expect(dumpCommand({ host: "h", port: 1, user: "u" }, "d", "t").args).not.toContain("--ssl");
});

test("dumpCommand rejects unsafe table identifiers", () => {
  expect(() => dumpCommand({ host: "h", port: 1, user: "u" }, "d", "bad-name")).toThrow(
    "Unsafe identifier: bad-name",
  );
});
