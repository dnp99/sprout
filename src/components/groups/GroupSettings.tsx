"use client";
import { GroupActivityHistory } from "./GroupActivityHistory";
import { GroupDirectory } from "./GroupDirectory";
import { SettingsWorkspace } from "@/components/settings/SettingsWorkspace";
import { Settings, Users, Tags, History, Sparkles, Shield } from "lucide-react";
import { GroupRulesPanel } from "./GroupRulesPanel";
import { WhatsNewCard } from "@/components/settings/WhatsNew";
import { PwaInstallCard } from "@/components/settings/PwaInstallCard";
import { useGroupConfirmation } from "./useGroupConfirmation";
import { InviteDelivery } from "./InviteDelivery";
import { GroupCategorySettings } from "./GroupCategorySettings";
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
  const navigation = useTranslations("settingsNavigation");
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
    <div className="space-y-4">
      {confirmation}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <SettingsWorkspace
        busy={busy}
        sections={[
          {
            id: "details",
            label: navigation("details"),
            icon: Settings,
            content: (
              <Panel tone="peach">
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
              </Panel>
            ),
          },
          {
            id: "members",
            label: navigation("members"),
            icon: Users,
            content: (
              <Panel tone="butter">
                <h2 className="font-bold">{t("members")}</h2>
                <div className="mt-3 divide-y divide-edge">
                  {data.members.map((m) => (
                    <div
                      key={m.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
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
                                  void act({ type: "remove", id: m.id });
                                }}
                              >
                                {t("remove")}
                              </button>
                              <button
                                className={buttonClass}
                                disabled={busy}
                                onClick={async () => {
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
                      <InviteDelivery key={invite} token={invite} groupName={data.group.name} />
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
            ),
          },
          {
            id: "categories",
            label: navigation("categories"),
            icon: Tags,
            content: <GroupCategorySettings data={data} run={run} busy={busy} />,
          },
          {
            id: "rules",
            label: navigation("rules"),
            icon: Tags,
            content: <GroupRulesPanel data={data} run={run} busy={busy} />,
          },
          {
            id: "activity",
            label: navigation("activity"),
            icon: History,
            content: <GroupActivityHistory key={data.group.id} data={data} locale={locale} />,
          },
          {
            id: "app",
            label: navigation("appInfo"),
            icon: Sparkles,
            area: "app",
            content: (
              <>
                <PwaInstallCard />
                <WhatsNewCard />
              </>
            ),
          },
          {
            id: "management",
            label: navigation("management"),
            icon: Shield,
            area: "management",
            content: (
              <>
                <section className="rounded-[14px] border border-edge bg-card p-5">
                  <h2 className="font-semibold">{t("groupManagement")}</h2>
                  <p className="mt-2 text-sm text-muted">{t("groupManagementHint")}</p>
                  <div className="mt-5 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                    {owner && (
                      <button
                        disabled={busy}
                        className={buttonClass}
                        onClick={async () => {
                          if (archived || (await confirm(t("archiveConfirm"))))
                            void act({
                              type: "settings",
                              name: data.group.name,
                              archived: !archived,
                            });
                        }}
                      >
                        {t(archived ? "reopen" : "archive")}
                      </button>
                    )}
                    {
                      <button
                        className={`${buttonClass} border-danger text-danger`}
                        disabled={busy}
                        onClick={async () => {
                          if (
                            (await confirmMember(data.group.memberId)) &&
                            (await act({ type: "leave" }))
                          )
                            onLeave();
                        }}
                      >
                        {t("leave")}
                      </button>
                    }
                  </div>
                </section>
                <Panel>
                  <fieldset disabled={busy} className="min-w-0">
                    <GroupDirectory embedded />
                  </fieldset>
                </Panel>
              </>
            ),
          },
        ]}
      />
    </div>
  );
}
