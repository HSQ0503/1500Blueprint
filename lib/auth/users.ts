import { supabaseAdmin } from "@/utils/supabase/admin";

// Upsert a member record on successful login (see record_login() in
// supabase/auth.sql). Non-blocking: a write failure is logged, never blocks login.
export async function recordLogin(email: string, plan: string | null): Promise<void> {
  try {
    const { error } = await supabaseAdmin().rpc("record_login", {
      p_email: email,
      p_plan: plan,
    });
    if (error) console.error("recordLogin failed:", error.message);
  } catch (e) {
    console.error("recordLogin threw:", (e as Error)?.message ?? e);
  }
}
