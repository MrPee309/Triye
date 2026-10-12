"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, useApi } from "@/lib/client";
import { SUPPORTED_CURRENCIES, CURRENCY_META, type CurrencyCode } from "@/lib/currency";
import { LANGS, type DictKey, type Lang } from "@/lib/i18n";
import type { CategoryDTO, ChannelInfo } from "@/types";
import { useT } from "@/components/I18nProvider";
import { Alert, Button, Card, Field, Input, Loading, PageHeader, Select } from "@/components/ui";

type Me = { preferences: { language: Lang; defaultCurrency: CurrencyCode }; aiConfigured: boolean };

export default function SettingsPage() {
  const { t } = useT();
  const router = useRouter();
  const me = useApi<Me>("/api/me");
  const cats = useApi<{ items: CategoryDTO[] }>("/api/categories");
  const channels = useApi<{ items: ChannelInfo[] }>("/api/channels");

  const [lang, setLang] = useState<Lang | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [catName, setCatName] = useState("");
  const [catParent, setCatParent] = useState("");
  const [catBusy, setCatBusy] = useState(false);
  const [catMsg, setCatMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  if (me.loading) return <Loading />;
  if (me.error || !me.data) return <Alert tone="error" onRetry={me.reload}>{me.error?.message || t("error.generic")}</Alert>;

  const curLang = lang ?? me.data.preferences.language;
  const curCurrency = currency ?? me.data.preferences.defaultCurrency;

  async function savePrefs() {
    setSaving(true);
    setPrefMsg(null);
    try {
      await api("/api/me", { method: "PATCH", json: { language: curLang, defaultCurrency: curCurrency } });
      setPrefMsg({ tone: "success", text: t("settings.saved") });
      router.refresh(); // re-render layouts with the new language/currency
    } catch (e) {
      setPrefMsg({ tone: "error", text: e instanceof ApiError && e.message ? e.message : t("error.network") });
    } finally {
      setSaving(false);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (catName.trim().length < 2) return;
    setCatBusy(true);
    setCatMsg(null);
    try {
      await api("/api/categories", { method: "POST", json: { name: catName.trim(), parent: catParent || null } });
      setCatName("");
      setCatMsg({ tone: "success", text: t("settings.categoryAdded") });
      cats.reload();
    } catch (err) {
      setCatMsg({ tone: "error", text: err instanceof ApiError && err.message ? err.message : t("error.network") });
    } finally {
      setCatBusy(false);
    }
  }

  const top = (cats.data?.items ?? []).filter((c) => !c.parent);
  const children = (id: string) => (cats.data?.items ?? []).filter((c) => c.parent === id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("nav.settings")} />

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("settings.preferences")}</h2>
        <Field label={t("settings.language")} htmlFor="lang" hint={t("settings.languageHint")}>
          <Select id="lang" value={curLang} onChange={(e) => setLang(e.target.value as Lang)}>
            {LANGS.map((l) => (
              <option key={l} value={l}>{t(`lang.${l}` as DictKey)}</option>
            ))}
          </Select>
        </Field>
        <Field label={t("settings.defaultCurrency")} htmlFor="currency" hint={t("settings.defaultCurrencyHint")}>
          <Select id="currency" value={curCurrency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
            {SUPPORTED_CURRENCIES.map((c) => (
              <option key={c} value={c}>{c} ({CURRENCY_META[c].name})</option>
            ))}
          </Select>
        </Field>
        {prefMsg && <Alert tone={prefMsg.tone}>{prefMsg.text}</Alert>}
        <Button onClick={savePrefs} loading={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-lg font-bold">{t("settings.categories")}</h2>
        {cats.loading ? (
          <Loading />
        ) : (
          <ul className="space-y-2">
            {top.map((c) => (
              <li key={c._id}>
                <span className="font-bold">{c.name}</span>
                {!c.owner && <span className="ml-2 text-sm text-muted">({t("settings.shared")})</span>}
                {children(c._id).length > 0 && (
                  <span className="block text-sm text-muted">{children(c._id).map((s) => s.name).join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        )}
        <form onSubmit={addCategory} className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
          <Field label={t("settings.newCategory")} htmlFor="cat-name">
            <Input id="cat-name" value={catName} onChange={(e) => setCatName(e.target.value)} maxLength={60} />
          </Field>
          <Field label={t("settings.parentCategory")} htmlFor="cat-parent">
            <Select id="cat-parent" value={catParent} onChange={(e) => setCatParent(e.target.value)}>
              <option value="">{t("settings.topLevel")}</option>
              {top.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2 space-y-3">
            {catMsg && <Alert tone={catMsg.tone}>{catMsg.text}</Alert>}
            <Button type="submit" variant="secondary" loading={catBusy} disabled={catName.trim().length < 2}>
              + {t("settings.addCategory")}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">{t("settings.channels")}</h2>
        <p className="text-sm text-muted">{t("settings.channelsHint")}</p>
        {channels.loading ? (
          <Loading />
        ) : (
          <ul className="divide-y divide-line">
            {channels.data?.items.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3">
                <span className="font-bold">{t(`channel.${c.id}` as DictKey)}</span>
                <span className="text-sm text-muted">
                  {c.mode === "manual"
                    ? t("settings.manualOnly")
                    : c.configured
                      ? t("settings.connected")
                      : t("settings.notConfigured")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-bold">{t("settings.ai")}</h2>
        <p className="mt-1 text-muted">{me.data.aiConfigured ? t("settings.connected") : t("settings.aiOff")}</p>
      </Card>
    </div>
  );
}
