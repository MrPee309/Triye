"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/client";
import { CHANNEL_IDS, PUBLISH_STATUSES } from "@/lib/channels/types";
import type { DictKey } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { Paginated, PublishingRecordDTO } from "@/types";
import { useT } from "@/components/I18nProvider";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordActions } from "@/components/RecordActions";
import { Alert, EmptyState, Loading, PageHeader, Pagination, Select, Thumb } from "@/components/ui";

export default function HistoryPage() {
  return (
    <Suspense fallback={<Loading />}>
      <History />
    </Suspense>
  );
}

function History() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) (v ? next.set(k, v) : next.delete(k));
    if (!("page" in updates)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const { data, error, loading, reload } = useApi<Paginated<PublishingRecordDTO>>(`/api/publishing?${params.toString()}`);

  return (
    <div>
      <PageHeader title={t("nav.history")} back="/publish" />
      <div className="mb-5 grid gap-2 sm:grid-cols-2">
        <Select aria-label={t("history.allStatuses")} value={params.get("status") ?? ""} onChange={(e) => setParam({ status: e.target.value })}>
          <option value="">{t("history.allStatuses")}</option>
          {PUBLISH_STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status.${s}` as DictKey)}</option>
          ))}
        </Select>
        <Select aria-label={t("history.allChannels")} value={params.get("channel") ?? ""} onChange={(e) => setParam({ channel: e.target.value })}>
          <option value="">{t("history.allChannels")}</option>
          {CHANNEL_IDS.map((c) => (
            <option key={c} value={c}>{t(`channel.${c}` as DictKey)}</option>
          ))}
        </Select>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <Alert tone="error" onRetry={reload}>{error.message || t("error.generic")}</Alert>
      ) : !data || data.items.length === 0 ? (
        <EmptyState message={t("history.empty")} />
      ) : (
        <>
          <ul className="space-y-3">
            {data.items.map((r) => {
              const p = typeof r.product === "string" ? null : r.product;
              const productId = p?._id ?? String(r.product);
              return (
                <li key={r._id} className="space-y-3 rounded-xl border border-line bg-white p-4">
                  <div className="flex items-start gap-3">
                    <Thumb src={p?.images?.[0]?.url} alt="" className="h-14 w-14" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/products/${productId}`} className="block truncate font-bold hover:text-sea">
                        {p?.name ?? "—"}
                      </Link>
                      <p className="text-sm text-muted">{t(`channel.${r.channel}` as DictKey)}</p>
                      <p className="text-sm text-muted">
                        {r.publishedAt && r.status === "published"
                          ? `${t("history.publishedAt")}: ${formatDate(r.publishedAt)}`
                          : `${t("history.lastAttempt")}: ${formatDate(r.lastAttemptAt ?? r.updatedAt)}`}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <RecordActions record={r} productId={productId} onChanged={reload} />
                </li>
              );
            })}
          </ul>
          <Pagination page={data.page} pages={data.pages} onPage={(pg) => setParam({ page: String(pg) })} />
        </>
      )}
    </div>
  );
}
