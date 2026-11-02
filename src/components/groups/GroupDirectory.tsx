"use client";
import Link from "next/link";
import { ArrowRight, Plus, UserPlus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { GroupApiError, groupFetch } from "@/state/groups";
import {
  groupContextPath,
  contextSection,
  soleGroupDestination,
} from "@/lib/groups/context-navigation";
import { useSearchParams, useRouter } from "next/navigation";
import { primaryClass, buttonClass, inputClass, Field, Panel } from "./ui";

/** Preview and explicit acceptance make the scope of shared history clear before joining. */
export function GroupDirectory({ embedded = false }: { embedded?: boolean }) {
  const list = useStore((s) => s.groupList),
    load = useStore((s) => s.loadGroupList),
    t = useTranslations("groups"),
    router = useRouter();
  const search = useSearchParams();
  const section = contextSection("/groups", search.get("section"));
  const [loaded, setLoaded] = useState(false);
  const [action, setAction] = useState<"create" | "join" | null>(null);
  const pendingInvite = useRef(false);
  const invitationAction = useRef<HTMLButtonElement>(null);
  const focusedInvite = useRef(false);
  const pendingCreate = useRef<{ name: string; key: string } | null>(null);
  const [name, setName] = useState(""),
    [token, setToken] = useState(""),
    [preview, setPreview] = useState<{ id: string; name: string } | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    load()
      .then(() => setLoaded(true))
      .catch((e) => setError(e.message));
    let code = new URLSearchParams(window.location.search).get("invite");
    try {
      code = code ?? sessionStorage.getItem("sprout-group-invite");
      sessionStorage.removeItem("sprout-group-invite");
    } catch {}
    if (code) {
      pendingInvite.current = true;
      const invitation = code;
      queueMicrotask(() => setToken(invitation));
      window.history.replaceState(null, "", "/groups");
    }
  }, [load]);
  useEffect(() => {
    if (!loaded || embedded) return;
    const destination = soleGroupDestination(
      list,
      section,
      search.get("manage") === "1",
      pendingInvite.current || Boolean(token) || Boolean(search.get("invite")),
    );
    if (destination) router.replace(destination);
  }, [loaded, list, section, search, token, router, embedded]);

  useEffect(() => {
    if (token && pendingInvite.current && !focusedInvite.current) {
      focusedInvite.current = true;
      invitationAction.current?.focus();
    }
  }, [token]);

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
      {!embedded && (
        <div>
          <h1 className="text-[26px] font-bold">{t("title")}</h1>
          <p className="mt-2 text-sm text-muted">{t("separate")}</p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {!embedded && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((g, index) => (
            <Link
              key={g.id}
              data-group-surface={index % 3 === 2 ? "mint" : "peach"}
              href={groupContextPath(g.id, section)}
              className="rounded-[14px] border border-edge bg-card p-5 transition hover:border-primary"
            >
              <strong className="text-[15px] font-bold">{g.name}</strong>
              <p className="mt-2 text-xs text-muted">
                {g.archivedAt ? t("archived") : t(g.role === "owner" ? "owner" : "member")}
              </p>
            </Link>
          ))}
        </div>
      )}
      {!embedded && loaded && !list.length && <p className="text-sm text-muted">{t("noGroups")}</p>}
      {(embedded || (loaded && !list.length) || token) && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              aria-expanded={action === "create"}
              onClick={() => setAction(action === "create" ? null : "create")}
              className={buttonClass}
            >
              <Plus size={16} strokeWidth={2} />
              {t("create")}
            </button>
            <button
              type="button"
              disabled={busy}
              aria-expanded={action === "join" || (!!token && action !== "create")}
              onClick={() => setAction(action === "join" ? null : "join")}
              className={buttonClass}
            >
              <UserPlus size={16} strokeWidth={2} />
              {t("join")}
            </button>
          </div>
          <div className="space-y-4">
            {action === "create" && (
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
            )}
            {(action === "join" || (!!token && action !== "create")) && (
              <Panel>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void submit(preview ? "join" : "preview");
                  }}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus size={20} strokeWidth={2} className="text-primary" />
                    <h2 className="font-bold">{t("join")}</h2>
                  </div>
                  <p className="text-sm text-muted">{t("joinHint")}</p>
                  <Field label={t("inviteCode")}>
                    <input
                      required
                      autoComplete="off"
                      disabled={busy}
                      placeholder={t("invitePlaceholder")}
                      value={token}
                      onChange={(e) => {
                        setToken(e.target.value);
                        setPreview(null);
                      }}
                      className={inputClass}
                    />
                  </Field>
                  {preview && (
                    <div
                      role="status"
                      className="rounded-[10px] border border-primary bg-primary-soft p-4 text-sm"
                    >
                      <p className="text-xs font-medium text-muted">{t("joiningGroup")}</p>
                      <strong className="mt-1 block break-words text-lg">{preview.name}</strong>
                      <p className="mt-2">{t("historyDisclosure")}</p>
                    </div>
                  )}
                  <button
                    ref={invitationAction}
                    disabled={busy || !token.trim()}
                    className={`${primaryClass} w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
                  >
                    <UserPlus size={18} strokeWidth={2} />
                    {t(busy ? "inviteWorking" : preview ? "acceptInvite" : "reviewInvite")}
                    <ArrowRight size={18} strokeWidth={2} />
                  </button>
                </form>
              </Panel>
            )}
          </div>
        </>
      )}
    </div>
  );
}
