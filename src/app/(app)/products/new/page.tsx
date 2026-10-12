"use client";
import { useT } from "@/components/I18nProvider";
import { ProductForm } from "@/components/ProductForm";
import { PageHeader } from "@/components/ui";

export default function NewProductPage() {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("product.new")} back="/products" />
      <ProductForm />
    </div>
  );
}
