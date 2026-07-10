"use client";

import { Check, Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createApiTokenReq,
  fetchApiTokens,
  revokeApiTokenReq,
  type ApiTokenSummary,
  type CreatedApiToken,
} from "@/lib/api";

/** Settings → Connected apps (plan 008). Create/revoke bearer tokens for the
 *  Siri Shortcut or any script that posts to the ingest API. The raw token is
 *  shown exactly once, right after creation. Shared by web + mobile Settings. */
export function ConnectedApps() {
  const [tokens, setTokens] = useState<ApiTokenSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<CreatedApiToken | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchApiTokens()
      .then(setTokens)
      .catch(() => setError("Couldn't load tokens."))
      .finally(() => setLoading(false));
  }, []);

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
      setError(e instanceof Error ? e.message : "Couldn't create token.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke(id: string) {
    try {
      await revokeApiTokenReq(id);
      setTokens((prev) => prev.filter((t) => t.id !== id));
    } catch {
      setError("Couldn't revoke token.");
    }
  }

  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.token);
      setCopied(true);
    } catch {
      setError("Couldn't copy — select the token and copy it manually.");
    }
  }

  const endpoint =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/ingest/text`
      : "/api/ingest/text";

  return (
    <div className="rounded-[14px] border border-edge p-5">
      <div className="flex items-center gap-2">
        <KeyRound size={16} strokeWidth={2} className="text-primary" />
        <h3 className="text-[15px] font-bold text-ink">Connected apps</h3>
      </div>
      <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
        Log expenses from a Siri Shortcut or any script. Create a token, then POST to{" "}
        <code className="rounded bg-track px-1 py-0.5 text-[11px] text-ink">{endpoint}</code> with
        an{" "}
        <code className="rounded bg-track px-1 py-0.5 text-[11px] text-ink">
          Authorization: Bearer
        </code>{" "}
        header and a body like{" "}
        <code className="rounded bg-track px-1 py-0.5 text-[11px] text-ink">{`{"text":"coffee 4.50"}`}</code>
        .
      </p>

      {/* Just-created token — shown ONCE. */}
      {created && (
        <div className="mt-4 rounded-[12px] border border-soft-border bg-primary-soft p-3">
          <div className="text-[11px] font-bold uppercase tracking-[.05em] text-primary">
            Copy your token now — you won&rsquo;t see it again
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
              {copied ? "Copied" : "Copy"}
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
          placeholder="Token name (e.g. My iPhone)"
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
          {creating ? "Creating…" : "Create"}
        </button>
      </div>
      {error && <p className="mt-2 text-[12px] font-medium text-primary">{error}</p>}

      {/* Active tokens. */}
      <div className="mt-4 flex flex-col">
        {loading ? (
          <p className="py-2 text-[12.5px] text-muted">Loading…</p>
        ) : tokens.length === 0 ? (
          <p className="py-2 text-[12.5px] text-muted">No tokens yet.</p>
        ) : (
          tokens.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 border-t border-edge py-2.5 first:border-t-0"
            >
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-ink">{t.name}</div>
                <div className="text-[11.5px] font-medium text-muted">
                  <span className="font-mono">{t.tokenPrefix}…</span>
                  {" · "}
                  {t.lastUsedAt ? `last used ${formatDay(t.lastUsedAt)}` : "never used"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void revoke(t.id)}
                className="flex flex-none items-center gap-1 rounded-[8px] border border-edge px-2.5 py-1.5 text-[11.5px] font-semibold text-primary transition hover:border-soft-border"
              >
                <Trash2 size={13} strokeWidth={2} /> Revoke
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
