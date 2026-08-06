const MAX_GRID_IN_DIGITS = 4;

export function normalizeGridInInput(raw: string): string {
  let value = "";
  let digitCount = 0;
  let hasSeparator = false;

  for (const character of raw) {
    if (/\d/.test(character)) {
      if (digitCount < MAX_GRID_IN_DIGITS) {
        value += character;
        digitCount++;
      }
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
