"use client";
import { GroupSplitSettings } from "./GroupSplitSettings";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
import { EmojiIconPickerButton } from "@/components/shared/EmojiIconPicker";
import { EntitySymbol } from "@/components/ui/EntitySymbol";
import { Field, Panel, inputClass, buttonClass, primaryClass } from "./ui";

/** Keep ownership, invitation and correction actions together with their audit history. */
export function GroupSettings({
  data,
  run,
  busy,
  onLeave,
}: {
  data: GroupSnapshot;
  run: (op: GroupOperation) => Promise<{ id?: string; token?: string } | null>;
  busy: boolean;
  onLeave: () => void;
}) {
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [name, setName] = useState(data.group.name),
    [error, setError] = useState(""),
    [invite, setInvite] = useState(""),
    [category, setCategory] = useState(""),
    [emoji, setEmoji] = useState("🏷️"),
    [color, setColor] = useState(data.categories[0]?.color ?? ""),
    [categoryId, setCategoryId] = useState<string | undefined>();
  const owner = data.group.role === "owner",
    archived = !!data.group.archivedAt;
  const act = async (op: GroupOperation) => {
    try {
      const result = await run(op);
      setError("");
      if (result?.token) setInvite(result.token);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
      return null;
    }
  };
  const confirmMember = (id: string) => {
    const member = data.members.find((m) => m.id === id);
    return window.confirm(
      t("removeConfirm", {
        name: member?.name ?? "",
        balance: formatMoney(data.balances[id] ?? 0, { locale }),
      }),
    );
  };
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {error && (
        <p role="alert" className="text-sm text-danger xl:col-span-2">
          {error}
        </p>
      )}
      <Panel>
        <h2 className="font-bold">{t("settings")}</h2>
        {owner && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void act({ type: "settings", name, archived });
            }}
          >
            <Field label={t("name")}>
              <input
                required
                maxLength={50}
                value={name}
                className={inputClass}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <button className={primaryClass} disabled={busy}>
              {t("save")}
            </button>
          </form>
        )}
        <p className="my-4 text-xs text-muted">{t("separate")}</p>
        <a className={buttonClass} href={`/api/groups/${data.group.id}/export`}>
          {t("export")}
        </a>
        {owner && (
          <button
            disabled={busy}
            className={`${buttonClass} ml-2`}
            onClick={() => {
              if (window.confirm(t(archived ? "reopenConfirm" : "archiveConfirm")))
                void act({ type: "settings", name: data.group.name, archived: !archived });
            }}
          >
            {t(archived ? "reopen" : "archive")}
          </button>
        )}
        {!owner && (
          <button
            className={`${buttonClass} ml-2 text-danger`}
            disabled={busy}
            onClick={async () => {
              if (confirmMember(data.group.memberId) && (await act({ type: "leave" }))) onLeave();
            }}
          >
            {t("leave")}
          </button>
        )}
      </Panel>
      <Panel>
        <h2 className="font-bold">{t("members")}</h2>
        <div className="mt-3 divide-y divide-edge">
          {data.members.map((m) => (
            <div key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div className="text-sm">
                <strong>{m.name}</strong>
                <p className="text-xs text-muted">
                  {t(m.role === "owner" ? "owner" : "member")}
                  {m.status !== "active" ? ` · ${t("formerMember")}` : ""}
                </p>
              </div>
              {owner && m.id !== data.group.memberId && m.userId && (
                <div className="flex flex-wrap gap-2">
                  {m.status === "active" ? (
                    <>
                      <button
                        className={buttonClass}
                        disabled={busy || archived}
                        onClick={() => {
                          if (confirmMember(m.id)) void act({ type: "remove", id: m.id });
                        }}
                      >
                        {t("remove")}
                      </button>
                      <button
                        className={buttonClass}
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(t("transferConfirm", { name: m.name })))
                            void act({ type: "transfer", id: m.id });
                        }}
                      >
                        {t("transfer")}
                      </button>
                    </>
                  ) : (
                    <button
                      className={buttonClass}
                      disabled={busy || archived}
                      onClick={() => void act({ type: "invite", reactivateMemberId: m.id })}
                    >
                      {t("reactivate")}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {owner && !archived && (
          <>
            <button
              className={`${primaryClass} mt-3`}
              disabled={busy}
              onClick={() => void act({ type: "invite", reactivateMemberId: null })}
            >
              {t("invite")}
            </button>
            {invite && (
              <div className="mt-3 space-y-2 rounded-[10px] bg-track p-3">
                <p className="text-xs text-muted">{t("inviteHint")}</p>
                <input
                  readOnly
                  aria-label={t("inviteCode")}
                  className={inputClass}
                  value={invite}
                />
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(`${window.location.origin}/groups?invite=${invite}`)
                      .catch(() => setError(t("copyFailed")));
                  }}
                >
                  {t("copyLink")}
                </button>
              </div>
            )}
            <div className="mt-3 space-y-2">
              {data.invites
                .filter((i) => !i.used && !i.revoked && new Date(i.expiresAt) > new Date())
                .map((i) => (
                  <div
                    key={i.id}
                    className="flex items-center justify-between gap-3 text-xs text-muted"
                  >
                    <span>
                      {t("expires")} {i.expiresAt.slice(0, 10)}
                    </span>
                    <button
                      className={buttonClass}
                      disabled={busy}
                      onClick={() => void act({ type: "revoke", id: i.id })}
                    >
                      {t("revoke")}
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}
      </Panel>
      <Panel>
        <h2 className="font-bold">{t("categories")}</h2>
        <div className="mt-3 space-y-2">
          {data.categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 text-sm">
              <EntitySymbol emoji={c.emoji} color={c.color} />
              <span className="flex-1">
                {c.name}
                {c.archived ? ` (${t("archived")})` : ""}
              </span>
              {owner && !archived && (
                <>
                  <button
                    className={buttonClass}
                    onClick={() => {
                      setCategoryId(c.id);
                      setCategory(c.name);
                      setEmoji(c.emoji);
                      setColor(c.color);
                    }}
                  >
                    {t("edit")}
                  </button>
                  <button
                    disabled={busy}
                    className={buttonClass}
                    onClick={() =>
                      void act({
                        type: "category",
                        id: c.id,
                        name: c.name,
                        emoji: c.emoji,
                        color: c.color,
                        archived: !c.archived,
                      })
                    }
                  >
                    {t(c.archived ? "restore" : "archive")}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
        {owner && !archived && (
          <form
            className="mt-4 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await act({
                  type: "category",
                  id: categoryId,
                  name: category,
                  emoji,
                  color,
                  archived: false,
                })
              ) {
                setCategory("");
                setCategoryId(undefined);
              }
            }}
          >
            <h3 className="text-sm font-semibold">
              {t(categoryId ? "editCategory" : "addCategory")}
            </h3>
            <Field label={t("name")}>
              <input
                className={inputClass}
                required
                maxLength={40}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <div className="flex items-center gap-3">
              <EmojiIconPickerButton
                value={emoji}
                onChange={setEmoji}
                title={t("icon")}
                ariaLabel={t("icon")}
              />
              <label className="text-xs text-muted">
                {t("color")}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="ml-2 h-11 w-11"
                />
              </label>
              <button className={primaryClass} disabled={busy}>
                {t("save")}
              </button>
              {categoryId && (
                <button
                  type="button"
                  className={buttonClass}
                  onClick={() => {
                    setCategoryId(undefined);
                    setCategory("");
                  }}
                >
                  {t("cancel")}
                </button>
              )}
            </div>
          </form>
        )}
      </Panel>
      <GroupSplitSettings data={data} run={run} busy={busy} />
      <Panel>
        <h2 className="font-bold">{t("activity")}</h2>
        <div className="mt-3 space-y-3">
          {data.activity.map((a) => (
            <div key={a.id} className="text-xs">
              <strong>
                {data.members.find((m) => m.id === a.actorId)?.name ?? t("formerMember")}
              </strong>{" "}
              · {t(`events.${a.action}`)}
              {a.reason && <p className="mt-1 text-muted">{a.reason}</p>}
              <p className="mt-1 text-muted">{new Date(a.createdAt).toLocaleString(locale)}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
