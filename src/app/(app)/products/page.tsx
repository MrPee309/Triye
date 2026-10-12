"use client";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApi } from "@/lib/client";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import type { DictKey } from "@/lib/i18n";
import type { CategoryDTO, Paginated, ProductDTO } from "@/types";
import { useT } from "@/components/I18nProvider";
import { PriceTags } from "@/components/PriceTags";
import { Alert, Button, EmptyState, Input, LinkButton, Loading, PageHeader, Pagination, Select, Thumb, cx } from "@/components/ui";

export default function ProductsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Catalog />
    </Suspense>
  );
}

function Catalog() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  const setParam = (updates: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) (v ? next.set(k, v) : next.delete(k));
    if (!("page" in updates)) next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  // Debounced search
  useEffect(() => {
    const id = setTimeout(() => {
      if ((params.get("q") ?? "") !== q.trim()) setParam({ q: q.trim() });
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const query = new URLSearchParams(params.toString());
  query.set("limit", "20");
  const { data, error, loading, reload } = useApi<Paginated<ProductDTO>>(`/api/products?${query.toString()}`);
  const { data: cats } = useApi<{ items: CategoryDTO[] }>("/api/categories");
  const catName = (id: string | null) => cats?.items.find((c) => c._id === id)?.name;
  const hasFilters = ["q", "category", "condition", "currency"].some((k) => params.get(k));

  return (
    <div>
      <PageHeader
        title={t("nav.catalog")}
        actions={<LinkButton href="/products/new" variant="accent" className="hidden md:inline-flex">+ {t("nav.add")}</LinkButton>}
      />

      <div className="mb-5 space-y-3">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("catalog.searchPlaceholder")}
          aria-label={t("common.search")}
        />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Select aria-label={t("product.category")} value={params.get("category") ?? ""} onChange={(e) => setParam({ category: e.target.value })}>
            <option value="">{t("product.category")}: {t("common.all")}</option>
            {cats?.items.filter((c) => !c.parent).map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
          <Select aria-label={t("product.condition")} value={params.get("condition") ?? ""} onChange={(e) => setParam({ condition: e.target.value })}>
            <option value="">{t("product.condition")}: {t("common.all")}</option>
            {(["new", "used", "refurbished"] as const).map((c) => (
              <option key={c} value={c}>{t(`product.condition.${c}` as DictKey)}</option>
            ))}
          </Select>
          <Select aria-label={t("product.pricing")} value={params.get("currency") ?? ""} onChange={(e) => setParam({ currency: e.target.value })}>
            <option value="">{t("catalog.anyCurrency")}</option>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{t("catalog.hasCurrency", { currency: c })}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading && !data ? (
        <Loading />
      ) : error ? (
        <Alert tone="error" onRetry={reload}>{error.message || t("error.generic")}</Alert>
      ) : !data || data.items.length === 0 ? (
        hasFilters ? (
          <EmptyState
            message={t("catalog.empty")}
            action={<Button variant="secondary" onClick={() => { setQ(""); router.replace(pathname); }}>{t("catalog.clearFilters")}</Button>}
          />
        ) : (
          <EmptyState message={t("dash.empty")} action={<LinkButton href="/products/new" variant="accent">+ {t("dash.addFirst")}</LinkButton>} />
        )
      ) : (
        <>
          <p className="mb-2 text-sm text-muted">{t("catalog.count", { count: data.total })}</p>
          <ul className={cx("grid gap-2 lg:grid-cols-2", loading && "opacity-60")}>
            {data.items.map((p) => (
              <li key={p._id}>
                <Link href={`/products/${p._id}`} className="flex gap-3 rounded-xl border border-line bg-white p-3 hover:border-sea">
                  <Thumb src={p.images[0]?.url} alt="" className="h-20 w-20" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold leading-snug line-clamp-2">{p.name}</p>
                    <PriceTags pricing={p.pricing} />
                    <p className="text-sm text-muted">
                      {t(`product.condition.${p.condition}` as DictKey)}
                      {", "}
                      <span className={p.quantity === 0 ? "font-bold text-coral" : undefined}>
                        {p.quantity === 0 ? t("dash.outOfStock") : t("product.inStock", { count: p.quantity })}
                      </span>
                      {catName(p.category) ? `, ${catName(p.category)}` : ""}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={data.page} pages={data.pages} onPage={(pg) => setParam({ page: String(pg) })} />
        </>
      )}
    </div>
  );
}
