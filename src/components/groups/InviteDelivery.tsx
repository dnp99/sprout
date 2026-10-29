"use client";

import { useState } from "react";
import { Copy, Link, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { buttonClass, Field, inputClass, primaryClass } from "./ui";

/** Keep raw codes local to the one-time invitation response. Sharing always
 * opens the device's chooser; unsupported devices can copy the link instead. */
export function InviteDelivery({ token, groupName }: { token: string; groupName: string }) {
  const t = useTranslations("groups");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);
  const link = () => `${window.location.origin}/groups?invite=${token}`;
  async function copy(value: string, message: string) {
    setError("");
    setStatus("");
    try {
      await navigator.clipboard.writeText(value);
      setStatus(message);
    } catch {
      setError(t("copyFailed"));
    }
  }
  async function share() {
    if (!navigator.share) return copy(link(), t("linkCopied"));
    setError("");
    setStatus("");
    setSharing(true);
    try {
      await navigator.share({ title: t("shareInviteTitle", { name: groupName }), url: link() });
    } catch (error) {
      // Closing the native chooser is not a failed invitation or a reason to copy silently.
      const cancelled =
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        error.name === "AbortError";
      if (!cancelled) setError(t("shareFailed"));
    } finally {
      setSharing(false);
    }
  }
  return (
    <div className="mt-3 space-y-3 rounded-[10px] border border-edge bg-track p-3">
      <p className="text-xs text-muted">{t("inviteHint")}</p>
      <Field label={t("inviteCodeOnly")}>
        <input
          readOnly
          value={token}
          className={`${inputClass} font-mono text-sm`}
          onFocus={(event) => event.target.select()}
        />
      </Field>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={primaryClass}
          disabled={sharing}
          onClick={() => void share()}
        >
          <Share2 size={16} strokeWidth={2} />
          {t("sendInviteLink")}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void copy(token, t("codeCopied"))}
        >
          <Copy size={16} strokeWidth={2} />
          {t("copyCode")}
        </button>
        <button
          type="button"
          className={buttonClass}
          onClick={() => void copy(link(), t("linkCopied"))}
        >
          <Link size={16} strokeWidth={2} />
          {t("copyLink")}
        </button>
      </div>
      {status && (
        <p role="status" className="text-sm text-ink">
          {status}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
