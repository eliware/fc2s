import createProgressMeter from "../../../src/files/transfer/progress.mjs";

test("progress meter forwards chunks and logs the total byte count", async () => {
  const logs = [];
  const response = new ReadableStream({
    start(controller) {
      controller.enqueue(Uint8Array.from([1, 2]));
      controller.enqueue(Uint8Array.from([3]));
      controller.close();
    },
  });
  const chunks = [];
  await response
    .pipeThrough(createProgressMeter("download.zip", (...args) => logs.push(args)))
    .pipeTo(
      new WritableStream({
        write(chunk) {
          chunks.push(...chunk);
        },
      }),
    );
  expect(chunks).toEqual([1, 2, 3]);
  expect(logs).toEqual([["downloaded", { file: "download.zip", bytes: 3 }]]);
});
