export type InstallOutcome = "accepted" | "dismissed";
export type InstallPlatform = "ios" | "mac-safari" | "browser";
export type PwaInstallState =
  | { status: "unavailable" }
  | { status: "installed" }
  | { status: "instructions" | "prompting" | "install-requested"; platform: InstallPlatform }
  | { status: "prompt-ready"; platform: InstallPlatform; install: () => Promise<InstallOutcome> };

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
}
type PwaWindow = Window & {
  __sproutPwaControllerReady?: boolean;
  __sproutPwaDeferred?: Event;
};
const unavailable: PwaInstallState = { status: "unavailable" };

/** Browser detection selects instructions only; native prompting always depends
 * on the actual browser event, never on a user-agent promise of support. */
export function installPlatform(navigator: Navigator): InstallPlatform {
  const ua = navigator.userAgent;
  if (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
    return "ios";
  if (
    /Macintosh|Mac OS X/.test(ua) &&
    /Safari/.test(ua) &&
    !/Chrome|Chromium|CriOS|Edg|OPR|Firefox|FxiOS/.test(ua)
  )
    return "mac-safari";
  return "browser";
}

/** One controller per document retains a one-use browser event across Settings
 * mounts and ledger navigation. It stores no account data or financial writes. */
export function createInstallController() {
  let state = unavailable;
  const listeners = new Set<() => void>();
  let active = false,
    installed = false,
    epoch = 0,
    lifetime = 0;
  let deferred: InstallPromptEvent | null = null;
  let inFlight: Promise<InstallOutcome> | null = null;
  const publish = (next: PwaInstallState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => state,
    getServerSnapshot: () => unavailable,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start(win: Window) {
      if (active) return () => {};
      active = true;
      const pwaWindow = win as PwaWindow;
      const lifecycle = ++lifetime;
      ++epoch;
      if (!win.isSecureContext) {
        pwaWindow.__sproutPwaControllerReady = false;
        pwaWindow.__sproutPwaDeferred = undefined;
        publish(unavailable);
        return () => {
          active = false;
          ++epoch;
        };
      }
      const media = win.matchMedia("(display-mode: standalone)");
      const platform = installPlatform(win.navigator);
      const standalone = () =>
        media.matches ||
        (win.navigator as Navigator & { standalone?: boolean }).standalone === true;
      const guidance = (): PwaInstallState => ({ status: "instructions", platform });
      const onInstalled = () => {
        ++epoch;
        installed = true;
        deferred = null;
        publish({ status: "installed" });
      };
      const onModeChange = () => {
        if (standalone()) onInstalled();
      };
      const onPrompt = (event: Event) => {
        if (installed || standalone()) return;
        event.preventDefault();
        const prompt = event as InstallPromptEvent;
        deferred = prompt;
        ++epoch;
        publish({
          status: "prompt-ready",
          platform,
          install: () => {
            if (inFlight) return inFlight;
            if (!active || deferred !== prompt || installed || standalone())
              return Promise.resolve("dismissed");
            deferred = null;
            const attempt = ++epoch;
            publish({ status: "prompting", platform });
            const pending = (async () => {
              try {
                await prompt.prompt();
                const { outcome } = await prompt.userChoice;
                // A newer prompt, installation or unmount always wins over an old
                // async outcome. Consumed events are never offered a second time.
                if (active && epoch === attempt)
                  publish(
                    outcome === "accepted" ? { status: "install-requested", platform } : guidance(),
                  );
                return outcome;
              } catch (error) {
                if (active && epoch === attempt) publish(guidance());
                throw error;
              }
            })();
            inFlight = pending;
            return pending.finally(() => {
              if (inFlight === pending) inFlight = null;
            });
          },
        });
      };
      pwaWindow.__sproutPwaControllerReady = true;
      win.addEventListener("beforeinstallprompt", onPrompt);
      win.addEventListener("appinstalled", onInstalled);
      media.addEventListener("change", onModeChange);
      const earlyPrompt = pwaWindow.__sproutPwaDeferred;
      pwaWindow.__sproutPwaDeferred = undefined;
      if (earlyPrompt) onPrompt(earlyPrompt);
      installed = standalone();
      if (installed) onInstalled();
      else if (!earlyPrompt) publish(guidance());
      return () => {
        // Ignore a late browser promise from this document's former lifetime.
        if (!active || lifetime !== lifecycle) return;
        active = false;
        installed = false;
        pwaWindow.__sproutPwaControllerReady = false;
        deferred = null;
        inFlight = null;
        ++epoch;
        win.removeEventListener("beforeinstallprompt", onPrompt);
        win.removeEventListener("appinstalled", onInstalled);
        media.removeEventListener("change", onModeChange);
        publish(unavailable);
      };
    },
  };
}

export const pwaInstall = createInstallController();
