export const MAX_GRID_IN_CHARACTERS = 5;

export function normalizeGridInInput(raw: string): string {
  let value = "";
  let hasSeparator = false;

  for (const character of raw) {
    if (value.length >= MAX_GRID_IN_CHARACTERS) break;

    if (/\d/.test(character)) {
      value += character;
      continue;
    }
    if (character === "-" && value === "") {
      value = character;
      continue;
    }
    if ((character === "." || character === "/") && !hasSeparator) {
      value += character;
      hasSeparator = true;
    }
  }

  return value;
}
