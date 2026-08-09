import AdminLayout from "./AdminLayout";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const urlField = z
  .string()
  .trim()
  .refine(value => value === "" || /^https?:\/\//i.test(value), {
    message: "Must be a valid URL or empty",
  });

const schema = z.object({
  storeName: z.string().trim().min(1).max(255),
  announcementEn: z.string().trim().max(500).default(""),
  announcementAr: z.string().trim().max(500).default(""),
  shippingFee: z.coerce.number().min(0),
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.coerce.number().min(0),
  currency: z.string().trim().min(3).max(3),
  supportEmail: z.string().trim().email().or(z.literal("")),
  phoneNumber: z.string().trim().max(64).default(""),
  whatsappNumber: z.string().trim().max(64).default(""),
  instagramUrl: urlField.default(""),
  facebookUrl: urlField.default(""),
  tiktokUrl: urlField.default(""),
  twitterUrl: urlField.default(""),
  storeAddressEn: z.string().trim().max(500).default(""),
  storeAddressAr: z.string().trim().max(500).default(""),
  businessHoursEn: z.string().trim().max(500).default(""),
  businessHoursAr: z.string().trim().max(500).default(""),
  logoUrl: urlField.default(""),
  faviconUrl: urlField.default(""),
  adminLoginLogoUrl: urlField.default(""),
});

type StoreSettingsFormValues = z.infer<typeof schema>;

const emptyValues: StoreSettingsFormValues = {
  storeName: "NOSE",
  announcementEn: "",
  announcementAr: "",
  shippingFee: 25,
  freeShippingEnabled: false,
  freeShippingThreshold: 200,
  currency: "AED",
  supportEmail: "",
  phoneNumber: "",
  whatsappNumber: "",
  instagramUrl: "",
  facebookUrl: "",
  tiktokUrl: "",
  twitterUrl: "",
  storeAddressEn: "",
  storeAddressAr: "",
  businessHoursEn: "",
  businessHoursAr: "",
  logoUrl: "",
  faviconUrl: "",
  adminLoginLogoUrl: "",
};

export default function AdminStoreSettings() {
  const { t, locale, isRTL } = useI18n();
  const utils = trpc.useUtils();
  const { data: settings, isLoading } =
    trpc.storeSettings.get.useQuery(undefined);

  const form = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = form;
  const announcementEn = watch("announcementEn");
  const announcementAr = watch("announcementAr");
  const freeShippingEnabled = watch("freeShippingEnabled");
  const freeShippingThreshold = watch("freeShippingThreshold");

  const pageTitle = locale === "ar" ? "إعدادات المتجر" : "Store Settings";
  const pageSubtitle =
    locale === "ar"
      ? "إدارة هوية المتجر والإعلانات والشحن"
      : "Manage store identity, announcements, and shipping";
  const generalTitle = locale === "ar" ? "عام" : "General";
  const announcementTitle =
    locale === "ar" ? "شريط الإعلانات" : "Announcement Bar";
  const shippingTitle = locale === "ar" ? "الشحن" : "Shipping";
  const storeNameLabel = locale === "ar" ? "اسم المتجر" : "Store Name";
  const storeNameHelp =
    locale === "ar"
      ? "الاسم المعروض في واجهة المتجر."
      : "The name displayed throughout the storefront.";
  const englishMessageLabel =
    locale === "ar" ? "الرسالة الإنجليزية" : "English message";
  const arabicMessageLabel =
    locale === "ar" ? "الرسالة العربية" : "Arabic message";
  const previewLabel = locale === "ar" ? "المعاينة" : "Live preview";
  const shippingFeeLabel = locale === "ar" ? "رسوم الشحن" : "Shipping fee";
  const enableFreeShippingLabel =
    locale === "ar" ? "تفعيل الشحن المجاني" : "Enable free shipping";
  const thresholdLabel =
    locale === "ar" ? "حد الشحن المجاني" : "Free shipping threshold";
  const savedSummary = useMemo(() => {
    const threshold = Number(freeShippingThreshold || 0);
    if (locale === "ar") {
      return freeShippingEnabled
        ? `الطلبات فوق ${threshold} AED تحصل على شحن مجاني.`
        : "الشحن المجاني غير مفعل حالياً.";
    }
    return freeShippingEnabled
      ? `Orders over ${threshold} AED receive free shipping.`
      : "Free shipping is currently disabled.";
  }, [locale, freeShippingEnabled, freeShippingThreshold]);
  const announcementPreview = useMemo(() => {
    if (locale === "ar") {
      return announcementAr || announcementEn || "معاينة شريط الإعلانات";
    }
    return announcementEn || announcementAr || "Announcement preview";
  }, [announcementAr, announcementEn, locale]);
  const shippingPreview = useMemo(() => {
    const threshold = Number(freeShippingThreshold || 0);
    return `${threshold.toFixed(2)} AED`;
  }, [freeShippingThreshold]);

  useEffect(() => {
    if (!settings) return;
    reset({
      storeName: settings.storeName ?? emptyValues.storeName,
      announcementEn: settings.announcementEn ?? emptyValues.announcementEn,
      announcementAr: settings.announcementAr ?? emptyValues.announcementAr,
      shippingFee: Number(settings.shippingFee ?? emptyValues.shippingFee),
      freeShippingEnabled: Boolean(settings.freeShippingEnabled),
      freeShippingThreshold: Number(
        settings.freeShippingThreshold ?? emptyValues.freeShippingThreshold
      ),
      currency: settings.currency ?? emptyValues.currency,
      supportEmail: settings.supportEmail ?? emptyValues.supportEmail,
      phoneNumber: settings.phoneNumber ?? emptyValues.phoneNumber,
      whatsappNumber: settings.whatsappNumber ?? emptyValues.whatsappNumber,
      instagramUrl: settings.instagramUrl ?? emptyValues.instagramUrl,
      facebookUrl: settings.facebookUrl ?? emptyValues.facebookUrl,
      tiktokUrl: settings.tiktokUrl ?? emptyValues.tiktokUrl,
      twitterUrl: settings.twitterUrl ?? emptyValues.twitterUrl,
      storeAddressEn: settings.storeAddressEn ?? emptyValues.storeAddressEn,
      storeAddressAr: settings.storeAddressAr ?? emptyValues.storeAddressAr,
      businessHoursEn: settings.businessHoursEn ?? emptyValues.businessHoursEn,
      businessHoursAr: settings.businessHoursAr ?? emptyValues.businessHoursAr,
      logoUrl: settings.logoUrl ?? emptyValues.logoUrl,
      faviconUrl: settings.faviconUrl ?? emptyValues.faviconUrl,
      adminLoginLogoUrl:
        settings.adminLoginLogoUrl ?? emptyValues.adminLoginLogoUrl,
    });
  }, [settings, reset]);

  const updateSettings = trpc.storeSettings.update.useMutation({
    onSuccess: async () => {
      toast.success("Store settings updated");
      await utils.storeSettings.get.invalidate();
      await utils.storeSettings.get.refetch();
    },
    onError: error => toast.error(error.message || t.error_generic),
  });

  const onSubmit = (values: any) => {
    updateSettings.mutate(values as StoreSettingsFormValues);
  };

  return (
    <AdminLayout>
      <div className="p-6" dir={isRTL ? "rtl" : "ltr"}>
        <div className="mx-auto w-full max-w-[860px]">
          <div className={`mb-4 ${isRTL ? "text-right" : "text-left"}`}>
            <h1
              className={`font-heading text-2xl font-light text-[#2E2A25] ${
                isRTL ? "font-arabic" : ""
              }`}
            >
              {pageTitle}
            </h1>
            <p className="mt-2 text-sm text-[#6B6051]">{pageSubtitle}</p>
          </div>

          {isLoading ? (
            <div className="rounded-sm border border-[#EAE4DC] bg-white p-5 text-center text-sm text-[#8A8078] shadow-sm">
              {t.loading}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4">
                <section className="rounded-sm border border-[#EAE4DC] bg-white p-5 shadow-sm">
                  <div className="mb-3">
                    <h2 className="text-lg font-semibold text-[#2E2A25]">
                      {generalTitle}
                    </h2>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
                      {storeNameLabel}
                    </label>
                    <Input
                      {...register("storeName")}
                      className="rounded-sm border-[#EAE4DC] bg-[#FAF9F6]"
                      placeholder={
                        locale === "ar" ? "أدخل اسم المتجر" : "Enter store name"
                      }
                    />
                    {errors.storeName && (
                      <p className="mt-2 text-xs text-[#B91C1C]">
                        {String(errors.storeName.message ?? "")}
                      </p>
                    )}
                  </div>
                </section>

                <section className="rounded-sm border border-[#EAE4DC] bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[#2E2A25]">
                      {announcementTitle}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B6051]">
                      {locale === "ar"
                        ? "أضف رسائل شريط الإعلان باللغتين."
                        : "Add announcement messages in both languages."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
                        {englishMessageLabel}
                      </label>
                      <Textarea
                        rows={4}
                        {...register("announcementEn")}
                        className="rounded-sm border-[#EAE4DC] bg-[#FAF9F6]"
                        placeholder={
                          locale === "ar"
                            ? "اكتب الرسالة الإنجليزية هنا"
                            : "Type the English announcement here"
                        }
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
                        {arabicMessageLabel}
                      </label>
                      <Textarea
                        rows={4}
                        {...register("announcementAr")}
                        className="rounded-sm border-[#EAE4DC] bg-[#FAF9F6]"
                        placeholder={
                          locale === "ar"
                            ? "اكتب الرسالة العربية هنا"
                            : "Type the Arabic announcement here"
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-4 rounded-sm border border-[#EAE4DC] bg-[#FAF9F6] px-3 py-3 text-sm text-[#2E2A25]">
                    <div className="mb-2 text-[11px] uppercase tracking-[0.24em] text-[#8A8078]">
                      {previewLabel}
                    </div>
                    <div
                      className={
                        locale === "ar" ? "font-arabic text-sm" : "text-sm"
                      }
                    >
                      {announcementPreview}
                    </div>
                  </div>
                </section>

                <section className="rounded-sm border border-[#EAE4DC] bg-white p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-lg font-semibold text-[#2E2A25]">
                      {shippingTitle}
                    </h2>
                    <p className="mt-1 text-sm text-[#6B6051]">
                      {locale === "ar"
                        ? "تحكم في رسوم الشحن وحد الشحن المجاني."
                        : "Control shipping cost and free shipping threshold."}
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
                        {shippingFeeLabel}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...register("shippingFee")}
                        placeholder={locale === "ar" ? "0.00 AED" : "0.00 AED"}
                        className="rounded-sm border-[#EAE4DC] bg-[#FAF9F6]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
                        {thresholdLabel}
                      </label>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        {...register("freeShippingThreshold")}
                        disabled={!freeShippingEnabled}
                        placeholder={locale === "ar" ? "0.00 AED" : "0.00 AED"}
                        className={`rounded-sm border-[#EAE4DC] bg-[#FAF9F6] ${
                          !freeShippingEnabled
                            ? "opacity-60 cursor-not-allowed"
                            : ""
                        }`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <label className="flex items-center gap-2 text-sm text-[#2E2A25]">
                      <Switch
                        checked={freeShippingEnabled}
                        onCheckedChange={value =>
                          setValue("freeShippingEnabled", Boolean(value))
                        }
                      />
                      <span>{enableFreeShippingLabel}</span>
                    </label>
                    <p className="text-sm text-[#6B6051]">{savedSummary}</p>
                  </div>
                </section>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={updateSettings.isPending}
                  className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm text-sm"
                >
                  {updateSettings.isPending ? t.admin_saving : t.admin_save}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
