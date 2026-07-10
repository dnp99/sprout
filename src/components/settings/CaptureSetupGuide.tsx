"use client";

import { Download, Mic, X } from "lucide-react";

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
            Add <b>Get Contents of URL</b> and match the fields shown below.
          </Step>
          <Step n={5}>
            Name it something short, like <b>“Log expense.”</b>
          </Step>
        </Section>

        <ShortcutMockup endpoint={endpoint} />

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

/** A faithful-enough mock of the finished Shortcut, styled like the iOS
 *  Shortcuts app — always shows the live production endpoint and a token
 *  placeholder (no real token, no dev-only ngrok header), so it never goes stale. */
function ShortcutMockup({ endpoint }: { endpoint: string }) {
  return (
    <div className="mt-3 rounded-[12px] border border-edge bg-track/40 p-2.5">
      <div className="mb-2 text-[10px] font-bold uppercase tracking-[.05em] text-muted">
        What your shortcut should look like
      </div>

      <div className="flex items-center gap-2 rounded-[10px] border border-edge bg-card px-2.5 py-2">
        <IconTile color="#3c9cff">
          <Mic size={13} strokeWidth={2.4} className="text-white" />
        </IconTile>
        <span className="text-[12.5px] font-semibold text-ink">Dictate Text</span>
      </div>

      <div className="ml-[19px] h-2 w-px bg-edge" />

      <div className="rounded-[10px] border border-edge bg-card px-2.5 py-2">
        <div className="flex items-center gap-2">
          <IconTile color="#34c759">
            <Download size={13} strokeWidth={2.4} className="text-white" />
          </IconTile>
          <span className="text-[12.5px] font-semibold text-ink">Get Contents of URL</span>
        </div>
        <div className="mt-2 flex flex-col gap-1.5 border-t border-edge pt-2 text-[11px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted">URL</span>
            <span className="break-all font-mono text-[10.5px] text-primary">{endpoint}</span>
          </div>
          <MockRow label="Method">
            <b className="text-ink">POST</b>
          </MockRow>
          <MockRow label="Header">
            <span className="text-muted">
              <span className="text-ink">Authorization</span> = Bearer&nbsp;&lt;token&gt;
            </span>
          </MockRow>
          <MockRow label="Body · JSON">
            <span>
              <span className="text-ink">text</span> ={" "}
              <span className="rounded bg-[#3c9cff]/15 px-1 font-semibold text-[#3c9cff]">
                Dictated Text
              </span>
            </span>
          </MockRow>
        </div>
      </div>
    </div>
  );
}

function IconTile({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span
      className="flex h-6 w-6 flex-none items-center justify-center rounded-[7px]"
      style={{ background: color }}
    >
      {children}
    </span>
  );
}

function MockRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex-none text-muted">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}
