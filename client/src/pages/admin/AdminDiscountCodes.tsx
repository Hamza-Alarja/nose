import AdminLayout from "./AdminLayout";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type DiscountType = "percentage" | "fixed";

type DiscountFormState = {
  code: string;
  type: DiscountType;
  value: string;
  minimumOrderAmount: string;
  maximumDiscountAmount: string;
  usageLimit: string;
  expiresAt: string;
  isActive: boolean;
};

const initialFormState: DiscountFormState = {
  code: "",
  type: "percentage",
  value: "",
  minimumOrderAmount: "",
  maximumDiscountAmount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

export default function AdminDiscountCodes() {
  const { locale, isRTL, t, formatPrice } = useI18n();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "expired"
  >("all");
  const [typeFilter, setTypeFilter] = useState<"all" | DiscountType>("all");
  const [form, setForm] = useState<DiscountFormState>(initialFormState);
  const [codeError, setCodeError] = useState("");

  const activeFilter =
    statusFilter === "active"
      ? true
      : statusFilter === "inactive"
        ? false
        : undefined;

  const { data: codes = [] } = trpc.discountCodes.list.useQuery({
    search: search || undefined,
    active: activeFilter,
  });

  const create = trpc.discountCodes.create.useMutation({
    onSuccess: async () => {
      await utils.discountCodes.list.invalidate();
      setShowForm(false);
      setForm(initialFormState);
      setEditingId(null);
      setCodeError("");
    },
    onError: error => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        setCodeError(t.admin_code_already_exists);
      } else {
        toast.error(t.admin_error_save_discount_code);
      }
    },
  });

  const update = trpc.discountCodes.update.useMutation({
    onSuccess: async () => {
      await utils.discountCodes.list.invalidate();
      setShowForm(false);
      setEditingId(null);
      setCodeError("");
    },
    onError: error => {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("already exists")) {
        setCodeError(t.admin_code_already_exists);
      } else {
        toast.error(t.admin_error_save_discount_code);
      }
    },
  });

  const remove = trpc.discountCodes.delete.useMutation({
    onSuccess: () => utils.discountCodes.list.invalidate(),
    onError: error => {
      toast.error(t.admin_error_delete_discount_code);
    },
  });

  const statusOptions = [
    { value: "all", label: t.admin_filter_all },
    { value: "active", label: t.admin_status_active },
    { value: "inactive", label: t.admin_status_inactive },
    { value: "expired", label: t.admin_status_expired },
  ];

  const typeOptions = [
    { value: "all", label: t.admin_filter_all },
    { value: "percentage", label: t.admin_discount_type_percentage },
    { value: "fixed", label: t.admin_discount_type_fixed },
  ];

  const displayedCodes = useMemo(() => {
    return codes
      .filter(code => (typeFilter === "all" ? true : code.type === typeFilter))
      .filter(code => {
        const now = Date.now();
        const expired =
          code.expiresAt && new Date(code.expiresAt).getTime() < now;
        if (statusFilter === "all") return true;
        if (statusFilter === "expired") return Boolean(expired);
        if (statusFilter === "active") return code.isActive && !expired;
        return !code.isActive && !expired;
      });
  }, [codes, statusFilter, typeFilter]);

  const hasActiveFilters =
    search !== "" || statusFilter !== "all" || typeFilter !== "all";
  const isEmptyState = codes.length === 0 && !hasActiveFilters;
  const isFilteredNoResultsState = displayedCodes.length === 0 && !isEmptyState;

  const clearSearchAndFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const isSavePending = create.isPending || update.isPending;

  const openForm = (codeId?: number) => {
    setCodeError("");
    if (codeId) {
      const code = codes.find(item => item.id === codeId);
      if (!code) return;
      setEditingId(code.id);
      setForm({
        code: code.code,
        type: code.type,
        value: String(code.value),
        minimumOrderAmount: String(code.minimumOrderAmount ?? ""),
        maximumDiscountAmount: code.maximumDiscountAmount
          ? String(code.maximumDiscountAmount)
          : "",
        usageLimit: code.usageLimit ? String(code.usageLimit) : "",
        expiresAt: code.expiresAt
          ? new Date(code.expiresAt).toISOString().slice(0, 16)
          : "",
        isActive: code.isActive,
      });
      setShowForm(true);
      return;
    }

    setEditingId(null);
    setForm(initialFormState);
    setShowForm(true);
  };

  const getStatusLabel = (code: (typeof codes)[number]) => {
    const now = Date.now();
    const expired = code.expiresAt && new Date(code.expiresAt).getTime() < now;
    if (expired) return t.admin_status_expired;
    return code.isActive ? t.admin_status_active : t.admin_status_inactive;
  };

  const formatExpiryDate = (value: string | null | undefined) => {
    if (!value) return t.admin_no_expiry;
    return new Date(value).toLocaleDateString(
      locale === "ar" ? "ar-EG" : "en-US",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const renderStatusBadge = (code: (typeof codes)[number]) => {
    const status = getStatusLabel(code);
    const isExpired = status === t.admin_status_expired;
    const isActiveStatus = status === t.admin_status_active;
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          isExpired
            ? "bg-[#FDE8E8] text-[#B91C1C]"
            : isActiveStatus
              ? "bg-[#E8F8F5] text-[#065F46]"
              : "bg-[#FDEEB7] text-[#92400E]"
        }`}
      >
        {status}
      </span>
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCodeError("");
    const value = Number(form.value);

    if (form.type === "percentage") {
      if (!Number.isInteger(value) || value < 1 || value > 100) {
        setCodeError(t.admin_enter_whole_number);
        return;
      }
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      type: form.type,
      value,
      minimumOrderAmount: form.minimumOrderAmount
        ? Number(form.minimumOrderAmount)
        : 0,
      maximumDiscountAmount:
        form.type === "percentage" && form.maximumDiscountAmount
          ? Number(form.maximumDiscountAmount)
          : null,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: form.isActive,
    };

    if (editingId) {
      update.mutate({ id: editingId, data: payload });
    } else {
      create.mutate(payload);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6" dir={isRTL ? "rtl" : "ltr"}>
        <section className="mb-6 rounded-2xl border border-[#EAE4DC] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1
                className={`font-heading text-3xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
              >
                {t.admin_discount_codes_title}
              </h1>
              <p className="mt-2 text-sm text-[#6B6051]">
                {t.admin_discount_codes_description}
              </p>
            </div>
            <Button onClick={() => openForm()}>{t.admin_create_code}</Button>
          </div>
        </section>

        <section className="mb-6 grid gap-3 rounded-2xl border border-[#EAE4DC] bg-white p-5 shadow-sm sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
              {t.admin_search_discount_codes}
            </label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="NOSE10"
              className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
              {t.admin_status}
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#2E2A25]">
              {t.admin_type}
            </label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as any)}
              className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
            >
              {typeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </section>

        {showForm && (
          <section className="mb-6 rounded-2xl border border-[#EAE4DC] bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#2E2A25]">
                  {editingId
                    ? t.admin_edit_discount_code
                    : t.admin_create_discount_code}
                </h2>
                <p className="text-sm text-[#6B6051]">
                  {editingId
                    ? t.admin_update_discount_code_details
                    : t.admin_add_discount_code_details}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_discount_code}
                </label>
                <input
                  required
                  placeholder="NOSE10"
                  value={form.code}
                  onChange={e =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25] tracking-[0.15em] uppercase"
                />
                {codeError && (
                  <p className="text-sm text-[#B91C1C]">{codeError}</p>
                )}
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_discount_type}
                </label>
                <select
                  value={form.type}
                  onChange={e =>
                    setForm({
                      ...form,
                      type: e.target.value as DiscountType,
                      maximumDiscountAmount:
                        e.target.value === "fixed"
                          ? ""
                          : form.maximumDiscountAmount,
                    })
                  }
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                >
                  <option value="percentage">
                    {t.admin_discount_type_percentage}
                  </option>
                  <option value="fixed">{t.admin_discount_type_fixed}</option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_discount_value}
                </label>
                <input
                  required
                  type="number"
                  min={form.type === "percentage" ? 1 : 0.01}
                  max={form.type === "percentage" ? 100 : undefined}
                  step={form.type === "percentage" ? 1 : 0.01}
                  placeholder={form.type === "percentage" ? "10" : "25.00"}
                  value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                />
                <p className="text-xs text-[#6B6051]">
                  {form.type === "percentage"
                    ? t.admin_enter_whole_number
                    : t.admin_enter_discount_amount}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_minimum_order_amount}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="200"
                  value={form.minimumOrderAmount}
                  onChange={e =>
                    setForm({ ...form, minimumOrderAmount: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                />
                <p className="text-xs text-[#6B6051]">
                  {t.admin_leave_blank_for_0}
                </p>
              </div>

              {form.type === "percentage" ? (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-[#2E2A25]">
                    {t.admin_maximum_discount_amount}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="20"
                    value={form.maximumDiscountAmount}
                    onChange={e =>
                      setForm({
                        ...form,
                        maximumDiscountAmount: e.target.value,
                      })
                    }
                    className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                  />
                  <p className="text-xs text-[#6B6051]">
                    {t.admin_optional_cap}
                  </p>
                </div>
              ) : null}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_usage_limit}
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder={t.admin_leave_blank_for_unlimited}
                  value={form.usageLimit}
                  onChange={e =>
                    setForm({ ...form, usageLimit: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                />
                <p className="text-xs text-[#6B6051]">
                  {t.admin_leave_blank_for_unlimited}
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-[#2E2A25]">
                  {t.admin_expiry_date}
                </label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e =>
                    setForm({ ...form, expiresAt: e.target.value })
                  }
                  className="w-full rounded-2xl border border-[#EAE4DC] bg-[#FAF9F6] px-4 py-3 text-sm text-[#2E2A25]"
                />
                <p className="text-xs text-[#6B6051]">
                  {t.admin_leave_blank_for_no_expiry}
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 text-sm font-medium text-[#2E2A25]">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e =>
                      setForm({ ...form, isActive: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-[#EAE4DC] text-[#2E2A25]"
                  />
                  {t.admin_status_active}
                </label>
              </div>

              <div className="flex items-end gap-3">
                <Button type="submit" disabled={isSavePending}>
                  {isSavePending ? t.admin_saving : t.admin_save}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setCodeError("");
                    setEditingId(null);
                  }}
                >
                  {t.admin_cancel}
                </Button>
              </div>
            </form>
          </section>
        )}

        <section className="rounded-2xl border border-[#EAE4DC] bg-white p-5 shadow-sm">
          {isEmptyState ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center text-[#6B6051]">
              <p className="text-lg font-semibold text-[#2E2A25]">
                {t.admin_no_discount_codes_title}
              </p>
              <p className="max-w-xs text-sm">
                {t.admin_no_discount_codes_description}
              </p>
              <Button onClick={() => openForm()}>
                {t.admin_create_first_discount_code}
              </Button>
            </div>
          ) : isFilteredNoResultsState ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 text-center text-[#6B6051]">
              <p className="text-lg font-semibold text-[#2E2A25]">
                {t.admin_no_matching_discount_codes_title}
              </p>
              <p className="max-w-xs text-sm">
                {t.admin_no_matching_discount_codes_description}
              </p>
              <Button onClick={clearSearchAndFilters}>
                {t.admin_clear_search_and_filters}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F5F1EC] text-[#2E2A25]">
                  <tr>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_code}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_type}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_value}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_minimum_order}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_usage}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_status}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3 text-start font-medium">
                      {t.admin_expiry}
                    </th>
                    <th className="px-4 py-3 text-end font-medium">
                      {t.admin_actions}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayedCodes.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-8 text-center text-[#6B6051]"
                      >
                        {t.admin_no_results_found}
                      </td>
                    </tr>
                  ) : (
                    displayedCodes.map(code => {
                      const expired =
                        code.expiresAt &&
                        new Date(code.expiresAt).getTime() < Date.now();
                      const valueLabel =
                        code.type === "percentage"
                          ? `${Number(code.value).toFixed(0)}%`
                          : formatPrice(code.value);
                      const usageLabel = `${code.usedCount} / ${
                        code.usageLimit === null
                          ? t.admin_unlimited
                          : code.usageLimit
                      }`;
                      return (
                        <tr key={code.id} className="border-t">
                          <td className="whitespace-nowrap px-4 py-4 font-medium text-[#2E2A25]">
                            {code.code}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[#6B6051]">
                            {code.type === "percentage"
                              ? t.admin_discount_type_percentage
                              : t.admin_discount_type_fixed}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[#6B6051]">
                            {valueLabel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[#6B6051]">
                            {formatPrice(code.minimumOrderAmount ?? 0)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[#6B6051]">
                            {usageLabel}
                          </td>
                          <td className="whitespace-nowrap px-4 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                expired
                                  ? "bg-[#FEE2E2] text-[#991B1B]"
                                  : code.isActive
                                    ? "bg-[#DCFCE7] text-[#166534]"
                                    : "bg-[#FDE68A] text-[#92400E]"
                              }`}
                            >
                              {expired
                                ? t.admin_status_expired
                                : code.isActive
                                  ? t.admin_status_active
                                  : t.admin_status_inactive}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-4 text-[#6B6051]">
                            {code.expiresAt
                              ? formatExpiryDate(code.expiresAt)
                              : t.admin_no_expiry}
                          </td>
                          <td className="px-4 py-4 text-end">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  update.mutate({
                                    id: code.id,
                                    data: { isActive: !code.isActive },
                                  })
                                }
                              >
                                {code.isActive
                                  ? t.admin_deactivate
                                  : t.admin_activate}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openForm(code.id)}
                              >
                                {t.admin_edit}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      t.admin_confirm_delete_discount_code
                                    )
                                  ) {
                                    remove.mutate({ id: code.id });
                                  }
                                }}
                              >
                                {t.admin_delete}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
