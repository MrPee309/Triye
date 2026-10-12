"use client";
import Link from "next/link";
import { useApi } from "@/lib/client";
import { PUBLISH_STATUSES, type PublishStatus } from "@/lib/channels/types";
import type { DictKey } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { PublishingRecordDTO } from "@/types";
import { useT } from "@/components/I18nProvider";
import { useUser } from "@/components/UserProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { Alert, Card, EmptyState, LinkButton, Loading, Thumb } from "@/components/ui";

type Stats = {
  products: number;
  outOfStock: number;
  statusCounts: Record<PublishStatus, number>;
  recent: PublishingRecordDTO[];
};

export default function DashboardPage() {
  const { t } = useT();
  const user = useUser();
  const { data, error, loading, reload } = useApi<Stats>("/api/dashboard");

  if (loading) return <Loading />;
  if (error || !data) return <Alert tone="error" onRetry={reload}>{error?.message || t("error.generic")}</Alert>;

  const waiting = data.statusCounts.manual_action_required + data.statusCounts.failed;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dash.greeting", { name: user.name.split(" ")[0] })}</h1>
        <div className="flex gap-2">
          <LinkButton href="/publish" variant="secondary">{t("nav.publish")}</LinkButton>
        </div>
      </header>

      {data.products === 0 ? (
        <EmptyState
          message={t("dash.empty")}
          action={<LinkButton href="/products/new" variant="accent">+ {t("dash.addFirst")}</LinkButton>}
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/products" className="rounded-xl border border-line bg-white p-4 hover:border-sea">
              <p className="text-4xl font-bold tabular-nums text-sea">{data.products}</p>
              <p className="mt-1 text-muted">{t("dash.products")}</p>
            </Link>
            <div className="rounded-xl border border-line bg-white p-4">
              <p className={`text-4xl font-bold tabular-nums ${data.outOfStock ? "text-coral" : "text-ink"}`}>
                {data.outOfStock}
              </p>
              <p className="mt-1 text-muted">{t("dash.outOfStock")}</p>
            </div>
          </div>

          {waiting > 0 && (
            <Link
              href="/history?status=manual_action_required"
              className="flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 border-mango bg-mango-light px-4 py-3 font-bold"
            >
              {t("dash.needsAction", { count: waiting })}
              <span aria-hidden>›</span>
            </Link>
          )}

          <Card>
            <h2 className="mb-3 text-lg font-bold">{t("dash.publishing")}</h2>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {PUBLISH_STATUSES.map((s) => (
                <li key={s}>
                  <Link
                    href={`/history?status=${s}`}
                    className="flex min-h-12 items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 hover:border-sea"
                  >
                    <span className="text-sm">{t(`status.${s}` as DictKey)}</span>
                    <span className="text-xl font-bold tabular-nums">{data.statusCounts[s]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {data.recent.length > 0 && (
            <Card>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("dash.recent")}</h2>
                <Link href="/history" className="font-bold text-sea">{t("dash.seeHistory")}</Link>
              </div>
              <ul className="divide-y divide-line">
                {data.recent.map((r) => {
                  const p = typeof r.product === "string" ? null : r.product;
                  return (
                    <li key={r._id} className="flex items-center gap-3 py-3">
                      <Thumb src={p?.images?.[0]?.url} alt="" className="h-11 w-11" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold">{p?.name ?? "—"}</p>
                        <p className="text-sm text-muted">
                          {t(`channel.${r.channel}` as DictKey)}, {formatDate(r.lastAttemptAt ?? r.updatedAt)}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
