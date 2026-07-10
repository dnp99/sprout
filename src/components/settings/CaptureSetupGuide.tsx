"use client";

import { X } from "lucide-react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER;
const CODE = "rounded bg-track px-1 py-0.5 font-mono text-[11px] text-ink";

/** Step-by-step guide for wiring up voice/text capture (Siri Shortcut +
 *  WhatsApp), opened from the Connected apps panel. Uses a fixed overlay so it
 *  works on both the web and mobile surfaces. */
export function CaptureSetupGuide({
  endpoint,
  onClose,
}: {
  endpoint: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100dvh-2rem)] w-full max-w-[440px] overflow-y-auto rounded-[16px] border border-edge bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-bold text-ink">Set up voice &amp; text logging</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg text-muted transition hover:bg-track/60 hover:text-ink"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
          Log expenses without opening Sprout — dictate to Siri, or text WhatsApp.
        </p>

        <Section emoji="🗣️" title="Siri Shortcut (iPhone)">
          <Step n={1}>
            Create a token above (name it, tap <b>Create</b>, copy it).
          </Step>
          <Step n={2}>
            Open the <b>Shortcuts</b> app → new shortcut.
          </Step>
          <Step n={3}>
            Add <b>Dictate Text</b>.
          </Step>
          <Step n={4}>
            Add <b>Get Contents of URL</b>:
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-muted">
              <li>
                URL <code className={CODE}>{endpoint}</code>
              </li>
              <li>
                Method <b>POST</b>
              </li>
              <li>
                Header <code className={CODE}>Authorization</code> ={" "}
                <code className={CODE}>Bearer &lt;token&gt;</code>
              </li>
              <li>
                Request Body <b>JSON</b>: <code className={CODE}>text</code> = the{" "}
                <b>Dictated Text</b> variable
              </li>
            </ul>
          </Step>
          <Step n={5}>
            Name it something short, like <b>“Log expense.”</b>
          </Step>
        </Section>

        <p className="mt-2 pl-7 text-[11.5px] font-medium leading-relaxed text-muted">
          <b className="text-ink">Hands-free:</b> say <i>“Hey Siri, log expense,”</i> then when it
          starts listening, speak the amount — <i>“coffee five dollars.”</i> (Custom shortcuts can’t
          take the amount in the trigger phrase, so it’s two quick steps.) Tip: set the Dictate Text
          action’s <i>Stop&nbsp;Listening</i> to <i>After&nbsp;Pause</i>.
        </p>

        <Section emoji="💬" title="WhatsApp">
          <Step n={1}>
            Tap <b>Connect WhatsApp</b> above to get a one-time code.
          </Step>
          <Step n={2}>
            On WhatsApp, text <code className={CODE}>link YOUR-CODE</code> to{" "}
            {WHATSAPP_NUMBER ? <b>{WHATSAPP_NUMBER}</b> : "the Sprout WhatsApp number"}.
          </Step>
          <Step n={3}>
            Text an expense like <code className={CODE}>coffee 4.50</code>. Reply{" "}
            <code className={CODE}>U</code> to undo.
          </Step>
        </Section>

        <p className="mt-5 text-[11.5px] font-medium leading-relaxed text-muted">
          Numbers can be words too — “McDonald’s five dollars” works. Every capture is written
          instantly; the reply is your receipt.
        </p>
      </div>
    </div>
  );
}

function Section({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5">
      <div className="text-[13.5px] font-bold text-ink">
        {emoji} {title}
      </div>
      <ol className="mt-2 flex flex-col gap-2">{children}</ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-[12.5px] font-medium leading-relaxed text-ink">
      <span className="mt-px flex h-5 w-5 flex-none items-center justify-center rounded-full bg-primary-soft text-[10.5px] font-bold text-primary">
        {n}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  );
}
