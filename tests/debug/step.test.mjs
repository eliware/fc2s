import step from "../../src/debug/step.mjs";

test("step returns the work result and preserves errors", async () => {
  await expect(step("work", async () => 42)).resolves.toBe(42);
  await expect(
    step("fail", async () => {
      throw new Error("failure");
    }),
  ).rejects.toThrow("failure");
});
