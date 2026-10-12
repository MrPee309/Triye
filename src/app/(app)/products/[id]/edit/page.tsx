"use client";
import { useParams } from "next/navigation";
import { useApi } from "@/lib/client";
import type { ProductDTO } from "@/types";
import { useT } from "@/components/I18nProvider";
import { ProductForm } from "@/components/ProductForm";
import { Alert, Loading, PageHeader } from "@/components/ui";

export default function EditProductPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const { data, error, loading, reload } = useApi<{ product: ProductDTO }>(`/api/products/${id}`);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("product.editTitle")} back={`/products/${id}`} />
      {loading ? (
        <Loading />
      ) : error || !data ? (
        <Alert tone="error" onRetry={error?.status === 404 ? undefined : reload}>
          {error?.message || t("product.notFound")}
        </Alert>
      ) : (
        <ProductForm product={data.product} />
      )}
    </div>
  );
}
