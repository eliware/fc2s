const id = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function validateIdentifier(value) {
  if (!id.test(value)) throw new Error(`Unsafe identifier: ${value}`);
  return value;
}

export function identifier(value) {
  validateIdentifier(value);
  return `\`${value}\``;
}
