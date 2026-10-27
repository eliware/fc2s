const id = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function identifier(value) {
  if (!id.test(value)) throw new Error(`Unsafe identifier: ${value}`);
  return `\`${value}\``;
}
