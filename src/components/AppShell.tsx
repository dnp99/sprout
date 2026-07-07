"use client";

import { AuthFlow } from "@/components/auth/AuthFlow";
import { MobileApp } from "@/components/mobile/MobileApp";
import { WebApp } from "@/components/web/WebApp";
import { useStore } from "@/state/store";

/**
 * Root frame. Until the auth/onboarding flow finishes it shows the auth
 * experience (full-screen on phones, split-screen on desktop). Once done, the
 * same data renders as the mobile app below `lg` and the web dashboard at `lg+`.
 */
export function AppShell() {
  const { flowStep, loaded, loadError, refresh } = useStore();

  // Initial auth check in flight — show the splash, not the login gate, so a
  // signed-in refresh doesn't flash the login screen before landing on the app.
  if (flowStep === "booting") {
    return <Splash />;
  }

  if (flowStep !== "done") {
    return <AuthGate />;
  }

  if (loadError) {
    return <ErrorScreen onRetry={refresh} />;
  }

  if (!loaded) {
    return <Splash />;
  }

  return (
    <>
      <div className="flex min-h-screen justify-center bg-bg lg:hidden">
        <MobileApp />
      </div>
      <div className="hidden lg:block">
        <WebApp />
      </div>
    </>
  );
}

/** Loading skeleton — shown during the initial auth check and while the
 *  signed-in user's data loads (the transactions fetch can take a beat). Mirrors
 *  the app frame so the hand-off to the real dashboard is smooth: a card grid on
 *  desktop, a stacked column on mobile. */
function Splash() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop: sidebar + content skeleton */}
      <div className="hidden min-h-screen lg:flex">
        <div className="w-[240px] flex-none border-r border-track/60 p-6">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-primary">
            🌱 <Bar className="h-5 w-24" />
          </div>
          <div className="mt-10 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Bar key={i} className="h-9 w-full" />
            ))}
          </div>
        </div>
        <div className="flex-1 p-8">
          <Bar className="h-8 w-56" />
          <div className="mt-6 grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Block key={i} className="h-28" />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Block className="h-64" />
            <Block className="h-64" />
          </div>
        </div>
      </div>

      {/* Mobile: centered app column */}
      <div className="mx-auto flex min-h-screen max-w-app flex-col gap-4 p-[22px] lg:hidden">
        <div className="flex items-center gap-2 text-xl font-extrabold text-primary">
          🌱 <Bar className="h-4 w-20" />
        </div>
        <Block className="mt-2 h-40" />
        <div className="grid grid-cols-2 gap-3">
          <Block className="h-24" />
          <Block className="h-24" />
        </div>
        <Block className="h-14" />
        <Block className="h-14" />
      </div>
    </div>
  );
}

/** A shimmering skeleton line. */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-track ${className}`} />;
}

/** A shimmering skeleton card. */
function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-[20px] bg-card ${className}`} />;
}

/** Shown when the user is signed in but their data couldn't be loaded (API/DB
 *  error). Offers a retry rather than rendering an empty or fake dashboard. */
function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-8 text-center">
      <div className="text-5xl">🌧️</div>
      <div className="mt-4 text-2xl font-extrabold text-ink">Couldn&rsquo;t load your data</div>
      <p className="mt-2 max-w-[340px] text-[14px] font-semibold text-muted">
        Something went wrong reaching Sprout. Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-2xl bg-primary px-6 py-3 text-[14px] font-extrabold text-white"
      >
        Try again
      </button>
    </div>
  );
}

function AuthGate() {
  return (
    <>
      {/* Mobile: full-screen cream */}
      <div className="flex min-h-screen flex-col bg-bg px-7 py-14 lg:hidden">
        <div className="text-2xl font-extrabold text-primary">🌱 Sprout</div>
        <div className="mt-4 flex flex-1 flex-col">
          <AuthFlow />
        </div>
      </div>

      {/* Desktop: split-screen promo + form */}
      <div className="hidden min-h-screen lg:flex">
        <div className="flex flex-[1.05] flex-col justify-center bg-primary px-14 py-14 text-white">
          <div className="text-3xl font-extrabold">🌱 Sprout</div>
          <div className="mt-7 text-[38px] font-extrabold leading-[1.15] tracking-tight">
            Money that
            <br />
            grows with you.
          </div>
          <div className="mt-4 max-w-[340px] text-[15px] font-semibold leading-relaxed opacity-90">
            Track spending, set goals, and budget with confidence — with a little joy along the way.
          </div>
          <div className="mt-8 flex gap-6 text-[13px] font-bold opacity-90">
            <span>📈 Smart insights</span>
            <span>🎯 Personal goals</span>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center bg-bg p-10">
          <div className="w-[380px]">
            <AuthFlow />
          </div>
        </div>
      </div>
    </>
  );
}
