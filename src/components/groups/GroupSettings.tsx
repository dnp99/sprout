"use client";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { InviteDelivery } from "./InviteDelivery";
import { GroupCategorySettings } from "./GroupCategorySettings";
import { EditedHighlightSetting } from "@/components/settings/EditedHighlightSetting";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { formatMoney } from "@/lib/format";
import type { GroupSnapshot } from "@/lib/groups/dto";
import type { GroupOperation } from "@/lib/groups/validation";
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
  const { confirm, confirmation } = useGroupConfirmation();
  const t = useTranslations("groups"),
    locale = useStore((s) => s.locale),
    [name, setName] = useState(data.group.name),
    [error, setError] = useState(""),
    [invite, setInvite] = useState("");
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
  const confirmMember = async (id: string) => {
    const member = data.members.find((m) => m.id === id);
    return await confirm(
      t("removeConfirm", {
        name: member?.name ?? "",
        balance: formatMoney(data.balances[id] ?? 0, { locale }),
      }),
    );
  };
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {confirmation}
      {error && (
        <p role="alert" className="text-sm text-danger xl:col-span-2">
          {error}
        </p>
      )}
      <Panel tone="peach">
        <h2 className="font-bold">{t("settings")}</h2>
        <EditedHighlightSetting />
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
            onClick={async () => {
              if (await confirm(t(archived ? "reopenConfirm" : "archiveConfirm")))
                void act({ type: "settings", name: data.group.name, archived: !archived });
            }}
          >
            {t(archived ? "reopen" : "archive")}
          </button>
        )}
        {
          <button
            className={`${buttonClass} ml-2 text-danger`}
            disabled={busy}
            onClick={async () => {
              if ((await confirmMember(data.group.memberId)) && (await act({ type: "leave" })))
                onLeave();
            }}
          >
            {t("leave")}
          </button>
        }
      </Panel>
      <Panel tone="butter">
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
                        onClick={async () => {
                          if (await confirmMember(m.id)) void act({ type: "remove", id: m.id });
                        }}
                      >
                        {t("remove")}
                      </button>
                      <button
                        className={buttonClass}
                        disabled={busy}
                        onClick={async () => {
                          if (await confirm(t("transferConfirm", { name: m.name })))
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
            {invite && <InviteDelivery key={invite} token={invite} groupName={data.group.name} />}
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
      <GroupCategorySettings data={data} run={run} busy={busy} />
      <Panel tone="peach">
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
