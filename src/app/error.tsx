"use client";
import { useT } from "@/components/I18nProvider";
import { Alert } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { t } = useT();
  return (
    <div className="mx-auto max-w-lg p-6">
      <Alert tone="error" onRetry={reset}>
        {t("error.generic")}
      </Alert>
    </div>
  );
}
