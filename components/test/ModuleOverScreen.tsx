// Brief interstitial shown between modules (mirrors Bluebook's "This Module Is Over").
export function ModuleOverScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-exam-bg px-6 font-exam-sans">
      <div className="-mt-24 text-center">
        <h1 className="text-[28px] font-medium text-exam-blue">This Module Is Over</h1>
        <p className="mt-6 text-[16px] text-exam-ink">All your work has been saved.</p>
        <p className="mt-3 text-[16px] text-exam-ink">
          You&rsquo;ll move on automatically in just a moment.
        </p>
        <p className="mt-3 text-[16px] text-exam-ink">
          Do not refresh this page or quit the app.
        </p>
        <div className="mt-10 flex justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-exam-ink/20 border-t-exam-ink" />
        </div>
      </div>
    </main>
  );
}
