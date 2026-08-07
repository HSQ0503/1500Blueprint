export type VocabImportEntry = {
  word: string;
  definition: string;
  pos: string;
  example: string;
};

export type VocabImportResult = {
  entries: VocabImportEntry[];
  errors: string[];
};

export type BuiltVocabQuestion = VocabImportEntry & {
  options: string[];
  correctIndex: number;
};

const WORD_HEADERS = ["word", "term", "vocab", "vocabulary"];
const DEFINITION_HEADERS = ["definition", "meaning", "description"];
const POS_HEADERS = ["pos", "partofspeech", "part_of_speech", "part-of-speech"];
const EXAMPLE_HEADERS = ["example", "sentence", "examplesentence", "example_sentence"];

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[\s.-]+/g, "_");
}

function valueFor(record: Record<string, unknown>, aliases: readonly string[]): string {
  for (const [key, value] of Object.entries(record)) {
    if (aliases.includes(normalizeHeader(key))) return clean(value);
  }
  return "";
}

function parseDelimited(input: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === '"') {
      if (quoted && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim());
      field = "";
      if (row.some(Boolean)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function recordsFromDelimited(input: string, delimiter: string): Record<string, unknown>[] {
  const rows = parseDelimited(input, delimiter);
  if (rows.length === 0) return [];
  const first = rows[0].map(normalizeHeader);
  const hasHeader = first.some((header) =>
    [...WORD_HEADERS, ...DEFINITION_HEADERS].includes(header),
  );
  const headers = hasHeader ? first : ["word", "definition", "pos", "example"];
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map((row) =>
    Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])),
  );
}

function recordsFromJson(input: string): Record<string, unknown>[] {
  const parsed: unknown = JSON.parse(input);
  if (!Array.isArray(parsed)) throw new Error("JSON must contain an array of vocab records.");
  return parsed.map((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return { __invalid: `JSON item ${index + 1} must be an object.` };
    }
    return record as Record<string, unknown>;
  });
}

export function parseVocabImport(input: string, filename: string): VocabImportResult {
  const extension = filename.split(".").pop()?.toLowerCase();
  let records: Record<string, unknown>[];
  try {
    if (extension === "json") {
      records = recordsFromJson(input);
    } else if (extension === "tsv") {
      records = recordsFromDelimited(input, "\t");
    } else if (extension === "txt") {
      const delimiter = input.includes("\t") ? "\t" : input.includes("|") ? "|" : ",";
      records = recordsFromDelimited(input, delimiter);
    } else if (extension === "csv") {
      records = recordsFromDelimited(input, ",");
    } else {
      return { entries: [], errors: [`Unsupported file type: .${extension || "unknown"}`] };
    }
  } catch (error) {
    return { entries: [], errors: [error instanceof Error ? error.message : "Could not parse file."] };
  }

  const entries: VocabImportEntry[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  records.forEach((record, index) => {
    if (record.__invalid) {
      errors.push(String(record.__invalid));
      return;
    }
    const word = valueFor(record, WORD_HEADERS);
    const definition = valueFor(record, DEFINITION_HEADERS);
    const rowLabel = `Row ${index + 1}`;
    if (!word) {
      errors.push(`${rowLabel}: word is required.`);
      return;
    }
    if (!definition) {
      errors.push(`${rowLabel}: definition is required for ${word}.`);
      return;
    }
    const key = word.toLocaleLowerCase();
    if (seen.has(key)) {
      errors.push(`${rowLabel}: duplicate word ${word}.`);
      return;
    }
    seen.add(key);
    entries.push({
      word,
      definition,
      pos: valueFor(record, POS_HEADERS),
      example: valueFor(record, EXAMPLE_HEADERS),
    });
  });
  return { entries, errors };
}

export function buildVocabQuestions(
  entries: readonly VocabImportEntry[],
): BuiltVocabQuestion[] {
  const uniqueWords = [...new Set(entries.map((entry) => entry.word))];
  if (uniqueWords.length < 4) {
    throw new Error("At least four unique words are required to build answer choices.");
  }
  return entries.map((entry, index) => {
    const distractors: string[] = [];
    let offset = 1;
    while (distractors.length < 3) {
      const candidate = uniqueWords[(index + offset) % uniqueWords.length];
      if (candidate !== entry.word && !distractors.includes(candidate)) distractors.push(candidate);
      offset += 1;
    }
    const correctIndex = index % 4;
    const options = [...distractors];
    options.splice(correctIndex, 0, entry.word);
    return { ...entry, options, correctIndex };
  });
}
