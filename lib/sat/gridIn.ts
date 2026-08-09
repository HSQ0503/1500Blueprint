export const MAX_GRID_IN_CHARACTERS = 5;
export const MAX_GRID_IN_INPUT_LENGTH = MAX_GRID_IN_CHARACTERS + 1;

export function normalizeGridInInput(raw: string): string {
  let value = "";
  let hasSeparator = false;

  for (const character of raw) {
    const answerLength = value.startsWith("-") ? value.length - 1 : value.length;
    if (answerLength >= MAX_GRID_IN_CHARACTERS) break;

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
