export default function waitForExit(child, failureMessage = (code) => `command failed: ${code}`) {
  let errorOutput = "";
  child.stderr?.on("data", (chunk) => {
    errorOutput += chunk;
  });
  return new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("close", (code) => {
      if (code) reject(new Error(errorOutput || failureMessage(code)));
      else resolve();
    });
  });
}
