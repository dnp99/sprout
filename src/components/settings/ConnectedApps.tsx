"use client";

import { Check, Copy, KeyRound, MessageCircle, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useFormatters } from "@/i18n/useFormatters";
import {
  createApiTokenReq,
  createWhatsappLinkReq,
  disconnectWhatsappReq,
  fetchApiTokens,
  fetchWhatsappStatus,
  revokeApiTokenReq,
  type ApiTokenSummary,
  type CreatedApiToken,
  type WhatsappLink,
  type WhatsappStatus,
} from "@/lib/api";
import { CaptureSetupGuide } from "./CaptureSetupGuide";

/** Settings → Connected apps (plan 008). Create/revoke bearer tokens for the
 *  Siri Shortcut or any script that posts to the ingest API. The raw token is
 *  shown exactly once, right after creation. Shared by web + mobile Settings. */
export function ConnectedApps() {
  const t = useTranslations("settingsPage.connected");
  const fmt = useFormatters();
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [link, setLink] = useState<WhatsappLink | null>(null);
  const [linking, setLinking] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [whatsapp, setWhatsapp] = useState<WhatsappStatus | null>(null);

  useEffect(() => {
    fetchApiTokens()
      .then(setTokens)
      .catch(() => setError(t("errLoad")))
      .finally(() => setLoading(false));
    // Best-effort — the connect flow still works if this fails.
    fetchWhatsappStatus()
      .then(setWhatsapp)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetch once on mount
  }, []);

  async function disconnectWhatsapp() {
    try {
      await disconnectWhatsappReq();
      setWhatsapp({ connected: false });
      setLink(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errDisconnect"));
    }
  }

  async function create() {
    const trimmed = name.trim();
    if (!trimmed || creating) return;
    setCreating(true);
    setError("");
    try {
      const token = await createApiTokenReq(trimmed);
      setCreated(token);
      setCopied(false);
      setName("");
      setTokens(await fetchApiTokens());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errCreate"));
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    try {
      await revokeApiTokenReq(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError(t("errRevoke"));
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
    } catch {
      setError(t("errCopy"));
    }
  }

  async function connectWhatsapp() {
    if (linking) return;
    setLinking(true);
    setError("");
    try {
      setLink(await createWhatsappLinkReq());
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errLink"));
    } finally {
      setLinking(false);
    }
  }

  const endpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/ingest/text`
      : "/api/ingest/text";

  return (
    <div className="rounded-[14px] border border-edge p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <KeyRound size={16} strokeWidth={2} className="text-primary" />
          <h3 className="text-[15px] font-bold text-ink">{t("title")}</h3>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide(true)}
          className="-mr-2 flex min-h-11 flex-none items-center px-2 text-[12px] font-semibold text-primary"
        >
          {t("howTo")}
        </button>
      </div>

      {showGuide && <CaptureSetupGuide endpoint={endpoint} onClose={() => setShowGuide(false)} />}
      <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
        {t.rich("intro", {
          endpoint,
          example: '{"text":"coffee 4.50"}',
          code: (chunks) => (
            <code className="rounded bg-track px-1 py-0.5 text-[11px] text-ink">{chunks}</code>
          ),
        })}
      </p>

      {/* Just-created token — shown ONCE. */}
      {created && (
        <div className="mt-4 rounded-[12px] border border-soft-border bg-primary-soft p-3">
          <div className="text-[11px] font-bold uppercase tracking-[.05em] text-primary">
            {t("copyOnce")}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[8px] bg-card px-2.5 py-2 font-mono text-[12px] text-ink">
              {created.token}
            </code>
            <button
              type="button"
              onClick={copy}
              className="flex flex-none items-center gap-1.5 rounded-[8px] bg-primary px-3 py-2 text-[12px] font-semibold text-onprimary"
            >
              {copied ? <Check size={13} strokeWidth={2.5} /> : <Copy size={13} strokeWidth={2} />}
              {copied ? t("copied") : t("copy")}
            </button>
          </div>
        </div>
      )}

      {/* Create form. */}
      <div className="mt-4 flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void create();
          }}
          placeholder={t("tokenPlaceholder")}
          maxLength={60}
          className="h-10 min-w-0 flex-1 rounded-[10px] border border-edge bg-card px-3 text-[13px] font-medium text-ink outline-none placeholder:text-subtle focus:border-soft-border"
        />
        <button
          type="button"
          onClick={() => void create()}
          disabled={!name.trim() || creating}
          className="flex h-10 flex-none items-center gap-1.5 rounded-[10px] bg-primary px-3.5 text-[12.5px] font-semibold text-onprimary disabled:opacity-50"
        >
          <Plus size={14} strokeWidth={2.6} />
          {creating ? t("creating") : t("create")}
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] font-medium text-primary">{error}</p>}

      {/* Active tokens. */}
      <div className="mt-4 flex flex-col">
        {loading ? (
          <p className="py-2 text-[12.5px] text-muted">{t("loading")}</p>
        ) : tokens.length === 0 ? (
          <p className="py-2 text-[12.5px] text-muted">{t("noTokens")}</p>
        ) : (
          tokens.map((token) => (
            <div
              key={token.id}
              className="flex items-center justify-between gap-3 border-t border-edge py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-ink">{token.name}</div>
                <div className="text-[11.5px] font-medium text-muted">
                  <span className="font-mono">{token.tokenPrefix}…</span>
                  {" · "}
                  {token.lastUsedAt
                    ? t("lastUsed", { date: fmt.shortDate(new Date(token.lastUsedAt)) })
                    : t("neverUsed")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void revoke(token.id)}
                className="flex min-h-11 flex-none items-center gap-1 rounded-[8px] border border-edge px-3 text-[11.5px] font-semibold text-primary transition hover:border-soft-border"
              >
                <Trash2 size={13} strokeWidth={2} /> {t("revoke")}
              </button>
            </div>
          ))
        )}
      </div>

      {/* WhatsApp linking. */}
      <div className="mt-5 border-t border-edge pt-4">
        <div className="flex items-center gap-2">
          <MessageCircle size={15} strokeWidth={2} className="text-green" />
          <span className="text-[13.5px] font-bold text-ink">{t("whatsapp")}</span>
        </div>
        {whatsapp?.connected ? (
          /* Already linked — show the connected phone + last used, and unlink. */
          <div className="mt-2 flex items-center gap-3 rounded-[12px] border border-edge px-3.5 py-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-green/15 text-green">
              <Check size={14} strokeWidth={2.6} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] font-semibold text-ink">
                {t("connectedPhone", { phone: whatsapp.phoneMasked ?? "" })}
              </div>
              <div className="text-[11.5px] font-medium text-muted">
                {whatsapp.lastUsedAt
                  ? t("lastUsedCap", { date: fmt.shortDate(new Date(whatsapp.lastUsedAt)) })
                  : t("noExpensesYet")}
              </div>
            </div>
            <button
              type="button"
              onClick={() => void disconnectWhatsapp()}
              className="flex-none rounded-[8px] border border-edge px-3 py-1.5 text-[11.5px] font-semibold text-primary transition hover:border-soft-border"
            >
              {t("disconnect")}
            </button>
          </div>
        ) : link ? (
          <div className="mt-2 rounded-[12px] border border-soft-border bg-primary-soft p-3">
            <div className="text-[12px] font-medium text-ink">
              {t.rich(link.number ? "linkWithNumber" : "linkNoNumber", {
                code: (chunks) => (
                  <code className="rounded bg-card px-1 py-0.5 font-mono text-[12px] text-primary">
                    {chunks}
                  </code>
                ),
                b: (chunks) => <span className="font-semibold">{chunks}</span>,
                linkCode: link.code,
                number: link.number ?? "",
              })}
            </div>
          </div>
        ) : (
          <>
            <p className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">
              {t("whatsappIntro")}
            </p>
            <button
              type="button"
              onClick={() => void connectWhatsapp()}
              disabled={linking}
              className="mt-2 flex items-center gap-1.5 rounded-[10px] border border-edge px-3.5 py-2 text-[12.5px] font-semibold text-ink transition hover:border-soft-border disabled:opacity-50"
            >
              <MessageCircle size={14} strokeWidth={2} />
              {linking ? t("generating") : t("connectWhatsapp")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
