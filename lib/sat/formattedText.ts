export type FormattedTextSegment = {
  text: string;
  underlined: boolean;
};

// Practice-test content is stored as plain text. Support only the exact, safe
// <u>...</u> pair instead of rendering arbitrary HTML from the question bank.
export function parseUnderlineMarkup(value: string): FormattedTextSegment[] {
  const segments: FormattedTextSegment[] = [];
  const underlinePattern = /<u>([\s\S]*?)<\/u>/gi;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = underlinePattern.exec(value))) {
    if (match.index > lastIndex) {
      segments.push({ text: value.slice(lastIndex, match.index), underlined: false });
    }
    segments.push({ text: match[1], underlined: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    segments.push({ text: value.slice(lastIndex), underlined: false });
  }

  return segments.length > 0 ? segments : [{ text: value, underlined: false }];
}
