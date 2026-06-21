import type { ComponentType } from "react";
import type { DrillQuestion, DrillSlug, FieldEditorProps } from "@/lib/drills/types";

// Maps each drill slug to its per-drill editor pieces so the shell can wire any
// question generically. Each entry follows the registry contract: a Fields
// component (FieldEditorProps) and a read-only Preview ({ question }). Some
// drills ship both in one file; others split them — both forms are imported here.

import { Fields as GrammarFields } from "@/components/admin/editor/grammar/GrammarFields";
import { Preview as GrammarPreview } from "@/components/admin/editor/grammar/GrammarPreview";
import {
  Fields as ReadingFields,
  Preview as ReadingPreview,
} from "@/components/admin/editor/reading/ReadingFields";
import {
  Fields as TargetedMathFields,
  Preview as TargetedMathPreview,
} from "@/components/admin/editor/targeted-math/TargetedMathFields";
import {
  Fields as AiMathFields,
  Preview as AiMathPreview,
} from "@/components/admin/editor/ai-math/AiMathFields";
import { Fields as VocabFields } from "@/components/admin/editor/vocab/VocabFields";
import { Preview as VocabPreview } from "@/components/admin/editor/vocab/VocabPreview";
import { Fields as WordScanFields } from "@/components/admin/editor/word-scan/WordScanFields";
import { Preview as WordScanPreview } from "@/components/admin/editor/word-scan/WordScanPreview";
import {
  Fields as FlashcardsFields,
  Preview as FlashcardsPreview,
} from "@/components/admin/editor/flashcards/FlashcardsFields";

export const FIELD_EDITORS: Record<DrillSlug, ComponentType<FieldEditorProps>> = {
  grammar: GrammarFields,
  reading: ReadingFields,
  "targeted-math": TargetedMathFields,
  "ai-math": AiMathFields,
  vocab: VocabFields,
  "word-scan": WordScanFields,
  flashcards: FlashcardsFields,
};

export const PREVIEWS: Record<DrillSlug, ComponentType<{ question: DrillQuestion }>> = {
  grammar: GrammarPreview,
  reading: ReadingPreview,
  "targeted-math": TargetedMathPreview,
  "ai-math": AiMathPreview,
  vocab: VocabPreview,
  "word-scan": WordScanPreview,
  flashcards: FlashcardsPreview,
};
