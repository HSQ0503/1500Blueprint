import { supabaseAdmin } from "@/utils/supabase/admin";

export const MONTHLY_AI_SUBMISSION_LIMIT = 500;

export type AiSubmissionQuota = {
  allowed: boolean;
  used: number;
  limit: number;
  resetsAt: string;
};

export async function reserveAiSubmission(email: string): Promise<AiSubmissionQuota> {
  const { data, error } = await supabaseAdmin().rpc("consume_ai_submission", {
    p_email: email,
    p_limit: MONTHLY_AI_SUBMISSION_LIMIT,
  });
  if (error) throw error;

  const value = data as unknown;
  if (!value || typeof value !== "object") throw new Error("AI quota returned no result");

  const result = value as Record<string, unknown>;
  const used = Number(result.used);
  const limit = Number(result.limit);
  if (
    typeof result.allowed !== "boolean" ||
    !Number.isInteger(used) ||
    !Number.isInteger(limit) ||
    typeof result.resetsAt !== "string"
  ) {
    throw new Error("AI quota returned an invalid result");
  }

  return { allowed: result.allowed, used, limit, resetsAt: result.resetsAt };
}

export async function refundAiSubmission(email: string): Promise<void> {
  const { error } = await supabaseAdmin().rpc("refund_ai_submission", { p_email: email });
  if (error) throw error;
}
