import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in — 1500 SAT Blueprint",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getSession()) redirect("/practice-test");
  const { error } = await searchParams;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-navy px-6 text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-1/4 top-0 h-[140%] w-1/3 -rotate-12 bg-gradient-to-b from-brand/40 via-brand/10 to-transparent blur-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/0 via-navy/40 to-ink" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo className="text-white [&_.text-navy]:text-white" />
        </div>
        <div className="rounded-2xl bg-white/5 p-8 ring-1 ring-inset ring-white/10 backdrop-blur-sm">
          <LoginForm initialError={error} />
        </div>
        <p className="mt-6 text-center text-xs text-white/50">
          Access is for active 1500 SAT Blueprint members.
        </p>
      </div>
    </div>
  );
}
