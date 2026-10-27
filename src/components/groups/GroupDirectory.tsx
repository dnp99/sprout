"use client";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { GroupApiError, groupFetch } from "@/state/groups";
import { groupContextPath, contextSection } from "@/lib/groups/context-navigation";
import { useSearchParams, useRouter } from "next/navigation";
import { buttonClass, primaryClass, inputClass, Field, Panel } from "./ui";

/** Preview and explicit acceptance make the scope of shared history clear before joining. */
export function GroupDirectory() {
  const list = useStore((s) => s.groupList),
    load = useStore((s) => s.loadGroupList),
    t = useTranslations("groups"),
    router = useRouter();
  const search = useSearchParams();
  const section = contextSection("/groups", search.get("section"));
  const pendingCreate = useRef<{ name: string; key: string } | null>(null);
  const [name, setName] = useState(""),
    [token, setToken] = useState(""),
    [preview, setPreview] = useState<{ id: string; name: string } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    load().catch((e) => setError(e.message));
    let code = new URLSearchParams(window.location.search).get("invite");
    try {
      code = code ?? sessionStorage.getItem("sprout-group-invite");
      sessionStorage.removeItem("sprout-group-invite");
    } catch {}
    if (code) {
      const invitation = code;
      queueMicrotask(() => setToken(invitation));
      window.history.replaceState(null, "", "/groups");
    }
  }, [load]);
  const submit = async (type: "create" | "preview" | "join") => {
    setBusy(true);
    setError("");
    try {
      if (type === "create" && pendingCreate.current?.name !== name)
        pendingCreate.current = { name, key: crypto.randomUUID() };
      let code = token.trim();
      if (code.includes("?")) {
        try {
          code = new URL(code).searchParams.get("invite") ?? code;
        } catch {}
      }
      const data = await groupFetch<{ id: string; name: string }>(
        "/api/groups",
        type === "create"
          ? { type, name, mutationId: pendingCreate.current?.key }
          : { type, token: code },
      );
      if (type === "create") pendingCreate.current = null;
      if (type === "preview") setPreview(data);
      else {
        await load();
        router.push(groupContextPath(data.id, section));
      }
    } catch (e) {
      if (e instanceof GroupApiError) pendingCreate.current = null;
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[26px] font-bold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("separate")}</p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((g) => (
          <Link
            key={g.id}
            href={groupContextPath(g.id, section)}
            className="rounded-[14px] border border-edge bg-card p-5 transition hover:border-primary"
          >
            <strong>{g.name}</strong>
            <p className="mt-2 text-xs text-muted">
              {g.archivedAt ? t("archived") : t(g.role === "owner" ? "owner" : "member")}
            </p>
          </Link>
        ))}
      </div>
      {!list.length && <p className="text-sm text-muted">{t("noGroups")}</p>}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Panel>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit("create");
            }}
          >
            <h2 className="font-bold">{t("create")}</h2>
            <Field label={t("name")}>
              <input
                required
                maxLength={50}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <p className="text-xs text-muted">{t("cadOnly")}</p>
            <button disabled={busy} className={primaryClass}>
              {t("create")}
            </button>
          </form>
        </Panel>
        <Panel>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(preview ? "join" : "preview");
            }}
          >
            <h2 className="font-bold">{t("join")}</h2>
            <Field label={t("inviteCode")}>
              <input
                required
                autoComplete="off"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setPreview(null);
                }}
                className={inputClass}
              />
            </Field>
            {preview && (
              <div className="rounded-[10px] bg-track p-3 text-sm">
                <strong>{preview.name}</strong>
                <p className="mt-2">{t("historyDisclosure")}</p>
              </div>
            )}
            <button disabled={busy} className={preview ? primaryClass : buttonClass}>
              {t(preview ? "join" : "preview")}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
