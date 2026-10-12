"use client";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DictKey } from "@/lib/i18n";
import { useT } from "@/components/I18nProvider";
import { ChannelQueue } from "@/components/ChannelQueue";
import { GenericPublish } from "@/components/GenericPublish";
import { Loading, PageHeader, cx } from "@/components/ui";

const TABS = [
  { id: "whatsapp", label: "publish.tabWhatsApp" },
  { id: "marketplace", label: "publish.tabMarketplace" },
  { id: "other", label: "publish.tabOther" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function PublishPage() {
  return (
    <Suspense fallback={<Loading />}>
      <PublishCenter />
    </Suspense>
  );
}

function PublishCenter() {
  const { t } = useT();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const preselected = params.get("product");
  const raw = params.get("tab");
  const tab: TabId = raw === "marketplace" || raw === "other" ? raw : "whatsapp";

  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params.toString());
    next.set("tab", id);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("publish.title")}
        actions={<Link href="/history" className="inline-flex min-h-12 items-center font-bold text-sea">{t("nav.history")}</Link>}
      />
      <div role="tablist" className="grid grid-cols-3 gap-1 rounded-xl bg-line/60 p-1">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            role="tab"
            aria-selected={tab === tb.id}
            onClick={() => setTab(tb.id)}
            className={cx(
              "min-h-12 rounded-lg px-2 text-sm font-bold sm:text-base",
              tab === tb.id ? "bg-white text-sea shadow-sm" : "text-muted",
            )}
          >
            {t(tb.label as DictKey)}
          </button>
        ))}
      </div>
      {/* key: switching tabs starts a fresh selection */}
      {tab === "whatsapp" && <ChannelQueue key="wa" channel="whatsapp" preselected={preselected} />}
      {tab === "marketplace" && <ChannelQueue key="mp" channel="facebook_marketplace" preselected={preselected} />}
      {tab === "other" && <GenericPublish preselected={preselected} />}
    </div>
  );
}
