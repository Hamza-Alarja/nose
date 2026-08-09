
import AdminLayout from "./AdminLayout";
import { useI18n } from "@/contexts/I18nContext";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Plus, Edit2, Trash2, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

export default function AdminProducts() {
  const { t, isRTL } = useI18n();
  const utils = trpc.useUtils();
  const allowedCategories = ["men", "women", "gifts"] as const;
  const productSchema = z.object({
    sku: z.string().min(1),
    nameEn: z.string().min(1),
    nameAr: z.string().min(1),
    descriptionEn: z.string().optional(),
    descriptionAr: z.string().optional(),
    scentNotesEn: z.string().optional(),
    scentNotesAr: z.string().optional(),
    category: z
      .string()
      .trim()
      .refine(
        value =>
          allowedCategories.includes(
            value as (typeof allowedCategories)[number]
          ),
        { message: t.admin_category_required }
      ),
    price: z.string().min(1),
    compareAtPrice: z.string().optional(),
    stockQuantity: z.coerce.number(),
    isNew: z.boolean(),
    isActive: z.boolean(),
  });
  type ProductFormData = z.infer<typeof productSchema>;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: products, refetch } = trpc.products.list.useQuery({});

  const formMethods = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      isActive: true,
      isNew: false,
      stockQuantity: 0,
      category: "",
    },
  });
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = formMethods as any;

  const createProduct = trpc.products.create.useMutation({
    onSuccess: async () => {
      toast.success(t.admin_product_created);
      await utils.products.list.invalidate();
      await refetch();
      setShowForm(false);
      reset();
      setUploadedImages([]);
    },
    onError: e => toast.error(e.message),
  });

  const updateProduct = trpc.products.update.useMutation({
    onSuccess: async () => {
      toast.success(t.admin_product_updated);
      await utils.products.list.invalidate();
      await refetch();
      setShowForm(false);
      setEditingId(null);
      reset();
      setUploadedImages([]);
    },
    onError: e => toast.error(e.message),
  });

  const deleteProduct = trpc.products.delete.useMutation({
    onSuccess: async () => {
      toast.success(t.admin_product_deleted);
      await utils.products.list.invalidate();
      await refetch();
    },
    onError: e => toast.error(e.message),
  });

  const uploadImage = trpc.products.uploadImage.useMutation();

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;
    setUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const form = new FormData();
        form.append("file", file, file.name);

        const resp = await fetch("/api/upload", {
          method: "POST",
          body: form,
          credentials: "include",
        });

        if (!resp.ok) {
          const body = await resp.json().catch(() => ({}));
          throw new Error(body?.message || `upload failed (${resp.status})`);
        }

        const data = await resp.json();
        if (!data?.url) throw new Error("Invalid upload response");

        newUrls.push(data.url);
      }
      setUploadedImages(prev => [...prev, ...newUrls]);
      toast.success(`${newUrls.length} ${t.admin_image_upload_success}`);
    } catch (e: any) {
      toast.error(`${t.admin_upload_failed}: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (p: any) => {
    setEditingId(p.id);
    setUploadedImages(p.images ?? []);
    setValue("sku", p.sku);
    setValue("nameEn", p.nameEn);
    setValue("nameAr", p.nameAr);
    setValue("descriptionEn", p.descriptionEn ?? "");
    setValue("descriptionAr", p.descriptionAr ?? "");
    setValue("scentNotesEn", p.scentNotesEn ?? "");
    setValue("scentNotesAr", p.scentNotesAr ?? "");
    setValue(
      "category",
      p.category &&
        allowedCategories.includes(
          p.category as (typeof allowedCategories)[number]
        )
        ? p.category
        : ""
    );
    setValue("price", String(p.price));
    setValue(
      "compareAtPrice",
      p.compareAtPrice ? String(p.compareAtPrice) : ""
    );
    setValue("stockQuantity", p.stockQuantity);
    setValue("isNew", p.isNew);
    setValue("isActive", p.isActive);
    setShowForm(true);
  };

  const onSubmit = (data: ProductFormData) => {
    const normalizedCompareAtPrice =
      typeof data.compareAtPrice === "string" &&
      data.compareAtPrice.trim() === ""
        ? null
        : data.compareAtPrice;

    const payload = {
      ...data,
      images: uploadedImages,
      compareAtPrice: normalizedCompareAtPrice,
      price: data.price.trim(),
      stockQuantity:
        data.stockQuantity === undefined || data.stockQuantity === null
          ? 0
          : Number(data.stockQuantity),
    } as any;

    if (editingId) {
      updateProduct.mutate({ id: editingId, ...payload });
    } else {
      createProduct.mutate(payload);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    reset();
    setUploadedImages([]);
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div
          className={`flex items-center justify-between mb-6 ${isRTL ? "flex-row-reverse" : ""}`}
        >
          <h1
            className={`font-heading text-2xl font-light text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
          >
            {t.admin_products}
          </h1>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingId(null);
              reset();
              setUploadedImages([]);
            }}
            className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm text-sm"
          >
            <Plus size={14} className="me-1" />
            <span className={isRTL ? "font-arabic" : ""}>
              {t.admin_add_product}
            </span>
          </Button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-sm border border-[#EAE4DC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F5F1EC] border-b border-[#EAE4DC]">
                <tr className={isRTL ? "text-right" : "text-left"}>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_image}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_name}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_sku}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_price}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_stock}
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-[#8A8078] uppercase tracking-wide">
                    {t.admin_table_status}
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4DC]">
                {products?.map(p => {
                  const imgs = p.images as string[];
                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-[#FBF7F2] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="w-10 h-12 bg-[#F0EBE3] rounded-sm overflow-hidden">
                          {imgs[0] ? (
                            <img
                              src={imgs[0]}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EAE4DC]" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#2E2A25]">{p.nameEn}</p>
                        <p className="text-xs text-[#8A8078] font-arabic">
                          {p.nameAr}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-[#8A8078] text-xs">
                        {p.sku}
                      </td>
                      <td className="px-4 py-3 font-medium ltr-num">
                        AED {parseFloat(String(p.price)).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 ltr-num">{p.stockQuantity}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-sm ${p.isActive ? "bg-[#A9C9A5]/30 text-[#2E2A25]" : "bg-[#EAE4DC] text-[#8A8078]"}`}
                        >
                          {p.isActive
                            ? t.admin_status_active
                            : t.admin_status_inactive}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEdit(p)}
                            className="p-1 text-[#8A8078] hover:text-[#2E2A25] transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(t.admin_delete_confirm))
                                deleteProduct.mutate({ id: p.id });
                            }}
                            className="p-1 text-[#8A8078] hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!products || products.length === 0) && (
              <div className="text-center py-10 text-[#8A8078] text-sm">
                {t.admin_no_products}
              </div>
            )}
          </div>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-sm border border-[#EAE4DC] w-full max-w-2xl my-8">
              <div
                className={`flex items-center justify-between p-5 border-b border-[#EAE4DC] ${isRTL ? "flex-row-reverse" : ""}`}
              >
                <h2
                  className={`font-medium text-[#2E2A25] ${isRTL ? "font-arabic" : ""}`}
                >
                  {editingId ? t.admin_edit_product : t.admin_add_product}
                </h2>
                <button
                  onClick={closeForm}
                  className="p-1 text-[#8A8078] hover:text-[#2E2A25]"
                >
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-[#2E2A25] mb-2">
                    {t.admin_product_images}
                  </label>
                  <div
                    className="border-2 border-dashed border-[#EAE4DC] rounded-sm p-4 text-center cursor-pointer hover:border-[#8B76B8] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={e => handleFileUpload(e.target.files)}
                    />
                    {uploading ? (
                      <div className="flex items-center justify-center gap-2 text-[#8A8078]">
                        <div className="w-4 h-4 border-2 border-[#8B76B8] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs">{t.admin_uploading}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[#8A8078]">
                        <Upload size={20} />
                        <span className="text-xs">{t.admin_click_upload}</span>
                      </div>
                    )}
                  </div>
                  {uploadedImages.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {uploadedImages.map((url, i) => (
                        <div
                          key={i}
                          className="relative w-16 h-16 rounded-sm overflow-hidden border border-[#EAE4DC]"
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setUploadedImages(prev =>
                                prev.filter((_, j) => j !== i)
                              )
                            }
                            className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center"
                          >
                            <X size={8} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_name_en}
                    </label>
                    <input
                      {...register("nameEn")}
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                    />
                    {errors.nameEn && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.nameEn.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1 font-arabic">
                      {t.admin_name_ar}
                    </label>
                    <input
                      {...register("nameAr")}
                      dir="rtl"
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8] font-arabic text-right"
                    />
                    {errors.nameAr && (
                      <p className="text-xs text-red-500 mt-1">
                        {errors.nameAr.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_sku_label}
                    </label>
                    <input
                      {...register("sku")}
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_price_aed}
                    </label>
                    <input
                      {...register("price")}
                      type="number"
                      step="0.01"
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_stock_qty}
                    </label>
                    <input
                      {...register("stockQuantity")}
                      type="number"
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_description_en}
                    </label>
                    <textarea
                      {...register("descriptionEn")}
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1 font-arabic">
                      {t.admin_description_ar}
                    </label>
                    <textarea
                      {...register("descriptionAr")}
                      rows={3}
                      dir="rtl"
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none font-arabic text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                      {t.admin_scent_notes_en}
                    </label>
                    <textarea
                      {...register("scentNotesEn")}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#2E2A25] mb-1 font-arabic">
                      {t.admin_scent_notes_ar}
                    </label>
                    <textarea
                      {...register("scentNotesAr")}
                      rows={2}
                      dir="rtl"
                      className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8] resize-none font-arabic text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-medium text-[#2E2A25] mb-1">
                    {t.admin_category}
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-3 py-2 text-sm border border-[#EAE4DC] rounded-sm focus:outline-none focus:ring-1 focus:ring-[#8B76B8]"
                  >
                    <option value="">{t.admin_category_required}</option>
                    <option value="men">{t.category_men}</option>
                    <option value="women">{t.category_women}</option>
                    <option value="gifts">{t.category_gifts}</option>
                  </select>
                  {errors.category && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 flex-wrap">
                  {[
                    {
                      name: "isNew" as const,
                      label: t.admin_badge_new_arrival,
                    },
                    { name: "isActive" as const, label: t.admin_badge_active },
                  ].map(({ name, label }) => (
                    <label
                      key={name}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        {...register(name)}
                        type="checkbox"
                        className="w-4 h-4 rounded border-[#EAE4DC] accent-[#8B76B8]"
                      />
                      {label}
                    </label>
                  ))}
                </div>

                <div
                  className={`flex gap-3 pt-2 ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <Button
                    type="submit"
                    disabled={
                      createProduct.isPending || updateProduct.isPending
                    }
                    className="bg-[#2E2A25] hover:bg-[#4A3F35] text-white rounded-sm"
                  >
                    {t.admin_save}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeForm}
                    className="border-[#EAE4DC] rounded-sm"
                  >
                    {t.admin_cancel}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
