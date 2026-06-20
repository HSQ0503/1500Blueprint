import Stripe from "stripe";
import { ACTIVE_STATUSES } from "./config";

// Lazily created so an empty key never throws at import/build time.
let client: Stripe | null = null;
function stripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_RESTRICTED_KEY;
    if (!key) throw new Error("STRIPE_RESTRICTED_KEY is not configured");
    client = new Stripe(key);
  }
  return client;
}

export type Membership = { active: boolean; plan: string | null };

// Is this email an active paying student? Finds the customer(s) by email, then
// looks for any subscription in an active/trialing status. Read-only — works
// with a restricted key scoped to Customers:read + Subscriptions:read.
export async function getMembership(email: string): Promise<Membership> {
  const lookup = email.trim();
  if (!lookup) return { active: false, plan: null };

  const customers = await stripe().customers.list({ email: lookup, limit: 100 });
  if (customers.data.length === 0) return { active: false, plan: null };

  // TEMPORARY (testing only): when MEMBERSHIP_REQUIRE_ACTIVE_SUB=false, any existing
  // Stripe customer counts as a member — no subscription required. Remove that env
  // var to restore the active-subscription gate before real students use this.
  if (process.env.MEMBERSHIP_REQUIRE_ACTIVE_SUB === "false") {
    return { active: true, plan: "testing" };
  }

  for (const customer of customers.data) {
    const subs = await stripe().subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 100,
    });
    const active = subs.data.find((s) =>
      (ACTIVE_STATUSES as readonly string[]).includes(s.status),
    );
    if (active) {
      const price = active.items.data[0]?.price;
      return { active: true, plan: price?.nickname ?? price?.id ?? null };
    }
  }
  return { active: false, plan: null };
}
