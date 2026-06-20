// Posts to the logout route, which clears the session cookie and redirects to
// /login. A plain form POST so it works without client JS.
export function SignOutButton({ className = "" }: { className?: string }) {
  return (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className={
          "rounded-card border border-navy/20 px-4 py-2 text-sm font-semibold text-navy/70 transition-colors hover:bg-navy/5 hover:text-navy " +
          className
        }
      >
        Sign out
      </button>
    </form>
  );
}
