import { jest } from "@jest/globals";
import log from "../src/debug.mjs";
import step from "../src/debug/step.mjs";

test("debug helpers run quietly by default", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  delete process.env.FC2S_VERBOSE;
  delete process.env.DEBUG;
  log("message");
  expect(spy).not.toHaveBeenCalled();
  await expect(step("work", async () => 42)).resolves.toBe(42);
  spy.mockRestore();
});
test("step preserves failures", async () => {
  await expect(
    step("fail", async () => {
      throw new Error("x");
    }),
  ).rejects.toThrow("x");
});

test("debug logs verbose strings and objects", () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.FC2S_VERBOSE = "1";
  log("text", "value");
  log("object", { ok: true });
  expect(spy).toHaveBeenCalledTimes(2);
  delete process.env.FC2S_VERBOSE;
  spy.mockRestore();
});

test("debug supports DEBUG selectors and logs failures", async () => {
  const spy = jest.spyOn(console, "error").mockImplementation(() => {});
  process.env.DEBUG = "fc2s";
  await expect(
    step("fail", async () => {
      throw new Error("boom");
    }),
  ).rejects.toThrow("boom");
  process.env.DEBUG = "*";
  delete process.env.DEBUG;
  spy.mockRestore();
});
