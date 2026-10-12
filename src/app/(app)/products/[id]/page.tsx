"use client";
import { Suspense, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api, ApiError, useApi } from "@/lib/client";
import type { DictKey } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import type { CategoryDTO, ProductDTO, PublishingRecordDTO } from "@/types";
import { useT } from "@/components/I18nProvider";
import { PriceTags } from "@/components/PriceTags";
import { StatusBadge } from "@/components/StatusBadge";
import { RecordActions } from "@/components/RecordActions";
import { Alert, Button, Card, ConfirmDialog, LinkButton, Loading, PageHeader, Thumb, cx } from "@/components/ui";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ProductDetail />
    </Suspense>
  );
}

function ProductDetail() {
  const { t } = useT();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const saved = useSearchParams().get("saved") === "1";
  const { data, error, loading, reload } = useApi<{ product: ProductDTO; publishing: PublishingRecordDTO[] }>(
    `/api/products/${id}`,
  );
  const { data: cats } = useApi<{ items: CategoryDTO[] }>("/api/categories");
  const [active, setActive] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (loading && !data) return <Loading />;
  if (error || !data)
    return (
      <>
        <PageHeader title={t("product.details")} back="/products" />
        <Alert tone="error" onRetry={error?.status === 404 ? undefined : reload}>{error?.message || t("product.notFound")}</Alert>
      </>
    );

  const p = data.product;
  const catName = (cid: string | null) => cats?.items.find((c) => c._id === cid)?.name;

  async function remove() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      router.push("/products");
      router.refresh();
    } catch (e) {
      setDeleteError(e instanceof ApiError && e.message ? e.message : t("error.network"));
      setDeleting(false);
      setConfirming(false);
    }
  }

  const facts: [string, string][] = (
    [
      [t("product.condition"), t(`product.condition.${p.condition}` as DictKey)],
      [t("product.quantity"), String(p.quantity)],
      [t("product.sku"), p.sku],
      [t("product.brand"), p.brand],
      [t("product.model"), p.model],
      [t("product.category"), [catName(p.category), catName(p.subcategory)].filter(Boolean).join(" / ")],
    ] as [string, string][]
  ).filter(([, v]) => v);

  return (
    <div className="space-y-5">
      <PageHeader
        title={p.name}
        back="/products"
        actions={
          <>
            <LinkButton href={`/products/${id}/edit`} variant="secondary">{t("common.edit")}</LinkButton>
            <Button variant="ghost" className="text-coral hover:bg-coral-light" onClick={() => setConfirming(true)}>
              {t("common.delete")}
            </Button>
          </>
        }
      />
      {saved && <Alert tone="success">{t("product.saved")}</Alert>}
      {deleteError && <Alert tone="error">{deleteError}</Alert>}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-2">
          <Thumb src={p.images[active]?.url} alt={p.name} className="aspect-square w-full rounded-xl border border-line" />
          {p.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {p.images.map((img, i) => (
                <button
                  key={img.publicId}
                  onClick={() => setActive(i)}
                  aria-label={`${t("product.photos")} ${i + 1}`}
                  className={cx("rounded-lg ring-offset-2", i === active && "ring-2 ring-sea")}
                >
                  <Thumb src={img.url} alt="" className="h-16 w-16" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <PriceTags pricing={p.pricing} large />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            {facts.map(([k, v]) => (
              <div key={k}>
                <dt className="text-sm text-muted">{k}</dt>
                <dd className="font-bold break-words">{v}</dd>
              </div>
            ))}
          </dl>
          {p.description && <p className="whitespace-pre-line leading-relaxed">{p.description}</p>}
          {p.specifications.length > 0 && (
            <div>
              <h2 className="mb-2 font-bold">{t("product.specs")}</h2>
              <dl className="divide-y divide-line rounded-lg border border-line bg-white">
                {p.specifications.map((s, i) => (
                  <div key={i} className="flex justify-between gap-4 px-3 py-2">
                    <dt className="text-muted">{s.key}</dt>
                    <dd className="text-right font-bold">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <p className="text-sm text-muted">
            {t("product.created")}: {formatDate(p.createdAt)}. {t("product.updated")}: {formatDate(p.updatedAt)}.
          </p>
        </div>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">{t("product.publishing")}</h2>
          <LinkButton href={`/publish?product=${id}`}>{t("product.publishThis")}</LinkButton>
        </div>
        {data.publishing.length === 0 ? (
          <p className="text-muted">{t("product.notPublished")}</p>
        ) : (
          <ul className="divide-y divide-line">
            {data.publishing.map((r) => (
              <li key={r._id} className="space-y-2 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold">{t(`channel.${r.channel}` as DictKey)}</span>
                  <StatusBadge status={r.status} />
                </div>
                <RecordActions record={r} productId={p._id} onChanged={reload} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={confirming}
        title={t("product.deleteTitle")}
        message={t("product.deleteConfirm", { name: p.name })}
        confirmLabel={deleting ? t("common.deleting") : t("common.delete")}
        busy={deleting}
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
