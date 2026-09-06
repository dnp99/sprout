"use client";

import { useEffect, useState } from "react";

export type InstallOutcome = "accepted" | "dismissed";
export type PwaInstallState =
  | { status: "installed" }
  | { status: "prompt-ready"; install: () => Promise<InstallOutcome> }
  | { status: "ios-instructions" }
  | { status: "browser-instructions" }
  | { status: "unavailable" };

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: InstallOutcome }>;
}

function isIos(): boolean {
  const userAgent = window.navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1)
  );
}

function isStandalone(): boolean {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

/** Detect installation capabilities without prompting automatically. */
export function usePwaInstall(): PwaInstallState {
  const [state, setState] = useState<PwaInstallState>({ status: "unavailable" });

  useEffect(() => {
    if (!window.isSecureContext) return;

    let deferred: BeforeInstallPromptEvent | null = null;
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferred = event as BeforeInstallPromptEvent;
      setState({
        status: "prompt-ready",
        install: async () => {
          if (!deferred) return "dismissed";
          const promptEvent = deferred;
          deferred = null;
          await promptEvent.prompt();
          return (await promptEvent.userChoice).outcome;
        },
      });
    };
    const onInstalled = () => {
      deferred = null;
      setState({ status: "installed" });
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const initialStateTimer = window.setTimeout(() => {
      if (isStandalone()) {
        setState({ status: "installed" });
      } else if (isIos()) {
        setState({ status: "ios-instructions" });
      } else if (!deferred) {
        setState({ status: "browser-instructions" });
      }
    }, 0);
    return () => {
      window.clearTimeout(initialStateTimer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return state;
}
