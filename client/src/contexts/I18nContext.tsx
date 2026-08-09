import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Locale = "en" | "ar";

export interface Translations {
  // Nav
  nav_home: string;
  nav_shop: string;
  nav_collections: string;
  nav_about: string;
  nav_search_placeholder: string;
  nav_cart: string;
  nav_account: string;
  nav_admin: string;
  // Hero
  hero_tagline: string;
  hero_subtitle: string;
  hero_cta: string;
  // Sections
  section_new_arrivals: string;
  section_bestsellers: string;
  section_collections: string;
  section_featured: string;
  // Product
  product_add_to_cart: string;
  product_out_of_stock: string;
  product_size: string;
  product_scent_notes: string;
  product_description: string;
  product_new: string;
  product_bestseller: string;
  product_featured: string;
  category_men: string;
  category_women: string;
  category_gifts: string;
  admin_category: string;
  admin_category_required: string;
  product_qty: string;
  product_in_stock: string;
  product_only_x_left: string;
  product_details: string;
  delivery_returns: string;
  product_secure_checkout: string;
  product_delivery_uae: string;
  product_authentic_products: string;
  related_products: string;
  // Cart
  cart_title: string;
  cart_empty: string;
  cart_subtotal: string;
  cart_checkout: string;
  cart_continue: string;
  cart_remove: string;
  cart_added_to_cart_title: string;
  cart_added_to_cart_description: string;
  cart_view_cart: string;
  // Checkout
  checkout_title: string;
  checkout_name: string;
  checkout_phone: string;
  checkout_email: string;
  checkout_address: string;
  checkout_city: string;
  checkout_notes: string;
  checkout_place_order: string;
  checkout_pay_now: string;
  checkout_order_summary: string;
  checkout_subtotal: string;
  checkout_shipping: string;
  checkout_discount: string;
  checkout_tax: string;
  checkout_total: string;
  // Order
  order_confirmed: string;
  order_confirmed_msg: string;
  order_number: string;
  order_history: string;
  order_status: string;
  order_date: string;
  order_total: string;
  order_items: string;
  order_status_pending: string;
  order_status_processing: string;
  order_status_shipped: string;
  order_status_completed: string;
  order_status_cancelled: string;
  // Newsletter
  newsletter_title: string;
  newsletter_subtitle: string;
  newsletter_placeholder: string;
  newsletter_cta: string;
  // Footer
  footer_tagline: string;
  footer_shop: string;
  footer_help: string;
  footer_legal: string;
  footer_rights: string;
  // Promo bar
  promo_message: string;
  // Filters
  filter_all: string;
  filter_search: string;
  filter_sort: string;
  filter_sort_newest: string;
  filter_sort_price_asc: string;
  filter_sort_price_desc: string;
  view_grid: string;
  view_list: string;
  // Admin
  admin_dashboard: string;
  admin_products: string;
  admin_orders: string;
  admin_settings: string;
  admin_add_product: string;
  admin_edit_product: string;
  admin_delete_product: string;
  admin_save: string;
  admin_cancel: string;
  admin_new_order_alert: string;
  auth_sign_in: string;
  auth_sign_in_admin: string;
  auth_continue_with_manus: string;
  auth_admin_required: string;
  auth_sign_out: string;
  auth_sign_in_prompt: string;
  auth_create_account: string;
  auth_already_have_account: string;
  auth_register_title: string;
  auth_register_subtitle: string;
  auth_first_name: string;
  auth_last_name: string;
  auth_phone: string;
  auth_password: string;
  auth_confirm_password: string;
  auth_invalid_credentials: string;
  auth_password_requirements: string;
  auth_password_mismatch: string;
  auth_registration_success: string;
  account_details: string;
  account_email: string;
  account_phone: string;
  account_need_login: string;
  account_my_account: string;
  account_my_orders: string;
  account_sign_out: string;
  back_to_orders: string;
  items_label: string;
  payment_paid: string;
  payment_unpaid: string;
  payment_refunded: string;
  view_details: string;
  no_orders_yet: string;
  order_details: string;
  order_tracking: string;
  tracking_received: string;
  tracking_processing: string;
  tracking_shipped: string;
  tracking_delivered: string;
  tracking_order_cancelled: string;
  tracking_current_status: string;
  tracking_completed: string;
  tracking_pending: string;
  shipping_address: string;
  quantity: string;
  order_notes: string;
  admin_sign_in_prompt: string;
  admin_access_denied: string;
  admin_go_home: string;
  admin_product_images: string;
  admin_table_image: string;
  admin_table_name: string;
  admin_table_sku: string;
  admin_table_price: string;
  admin_table_stock: string;
  admin_table_status: string;
  admin_payment: string;
  admin_filter_all: string;
  admin_sign_out: string;
  admin_panel_title: string;
  admin_panel_subtitle: string;
  admin_language_arabic: string;
  admin_language_english: string;
  admin_quick_overview: string;
  admin_pending_orders_summary: string;
  admin_no_orders: string;
  admin_discount_codes_title: string;
  admin_discount_codes_description: string;
  admin_create_code: string;
  admin_search_discount_codes: string;
  admin_status: string;
  admin_type: string;
  admin_percentage: string;
  admin_fixed_amount: string;
  admin_create_discount_code: string;
  admin_add_discount_code_details: string;
  admin_discount_code: string;
  admin_discount_type: string;
  admin_discount_value: string;
  admin_minimum_order_amount: string;
  admin_maximum_discount_amount: string;
  admin_usage_limit: string;
  admin_expiry_date: string;
  admin_leave_blank_for_0: string;
  admin_optional_cap: string;
  admin_leave_blank_for_unlimited: string;
  admin_leave_blank_for_no_expiry: string;
  admin_enter_whole_number: string;
  admin_enter_discount_amount: string;
  admin_no_expiry: string;
  admin_discount_type_percentage: string;
  admin_discount_type_fixed: string;
  admin_edit_discount_code: string;
  admin_update_discount_code_details: string;
  admin_no_discount_codes_title: string;
  admin_no_discount_codes_description: string;
  admin_create_first_discount_code: string;
  admin_no_matching_discount_codes_title: string;
  admin_no_matching_discount_codes_description: string;
  admin_clear_search_and_filters: string;
  admin_no_results_found: string;
  admin_confirm_delete_discount_code: string;
  admin_code: string;
  admin_status_expired: string;
  admin_saving: string;
  admin_code_already_exists: string;
  admin_error_save_discount_code: string;
  admin_error_delete_discount_code: string;
  admin_value: string;
  admin_minimum_order: string;
  admin_usage: string;
  admin_expiry: string;
  admin_actions: string;
  admin_activate: string;
  admin_deactivate: string;
  admin_edit: string;
  admin_delete: string;
  admin_none: string;
  admin_unlimited: string;
  admin_uploading: string;
  admin_click_upload: string;
  admin_name_en: string;
  admin_name_ar: string;
  admin_sku_label: string;
  admin_price_aed: string;
  admin_stock_qty: string;
  admin_description_en: string;
  admin_description_ar: string;
  admin_scent_notes_en: string;
  admin_scent_notes_ar: string;
  admin_badge_new_arrival: string;
  admin_badge_bestseller: string;
  admin_badge_featured: string;
  admin_badge_active: string;
  admin_no_products: string;
  admin_delete_confirm: string;
  admin_upload_failed: string;
  admin_image_upload_success: string;
  admin_status_active: string;
  admin_status_inactive: string;
  admin_status_updated: string;
  admin_product_created: string;
  admin_product_updated: string;
  admin_product_deleted: string;
  admin_order_updated: string;
  admin_new_order: string;
  page_login_title: string;
  page_login_subtitle: string;
  page_product_not_found: string;
  page_admin_panel: string;
  page_admin_panel_subtitle: string;
  // General
  loading: string;
  error_generic: string;
  currency: string;
  back: string;
  see_all: string;
}

const en: Translations = {
  nav_home: "Home",
  nav_shop: "Shop",
  nav_collections: "Collections",
  nav_about: "Our Story",
  nav_search_placeholder: "Search fragrances…",
  nav_cart: "Cart",
  nav_account: "Account",
  nav_admin: "Admin",
  hero_tagline: "Wear Your Story",
  hero_subtitle:
    "Handcrafted fragrances that speak before you do. Discover scents born from desert nights and Mediterranean gardens.",
  hero_cta: "Explore the Collection",
  section_new_arrivals: "New Arrivals",
  section_bestsellers: "Bestsellers",
  section_collections: "Collections",
  section_featured: "Featured",
  product_add_to_cart: "Add to Cart",
  product_out_of_stock: "Out of Stock",
  product_size: "Size",
  product_scent_notes: "Scent Notes",
  product_description: "Description",
  product_new: "New",
  product_bestseller: "Bestseller",
  product_featured: "Featured",
  category_men: "Men's Perfumes",
  category_women: "Women's Perfumes",
  category_gifts: "Gifts",
  admin_category: "Category",
  admin_category_required: "Please select a category.",
  product_qty: "Qty",
  product_in_stock: "In Stock",
  product_only_x_left: "Only {count} left",
  product_details: "Product Details",
  delivery_returns: "Delivery & Returns",
  product_secure_checkout: "Secure checkout",
  product_delivery_uae: "Delivery across UAE",
  product_authentic_products: "Authentic products",
  related_products: "You May Also Like",
  cart_title: "Your Cart",
  cart_empty: "Your cart is empty",
  cart_subtotal: "Subtotal",
  cart_checkout: "Proceed to Checkout",
  cart_continue: "Continue Shopping",
  cart_remove: "Remove",
  cart_added_to_cart_title: "Added to cart",
  cart_added_to_cart_description: "Product added successfully",
  cart_view_cart: "View Cart",
  checkout_title: "Checkout",
  checkout_name: "Full Name",
  checkout_phone: "Phone Number",
  checkout_email: "Email Address",
  checkout_address: "Shipping Address",
  checkout_city: "City",
  checkout_notes: "Order Notes (optional)",
  checkout_place_order: "Place Order",
  checkout_pay_now: "Pay Now",
  checkout_order_summary: "Order Summary",
  checkout_subtotal: "Subtotal",
  checkout_shipping: "Delivery",
  checkout_discount: "Discount",
  checkout_tax: "Tax",
  checkout_total: "Total",
  order_confirmed: "Order Confirmed!",
  order_confirmed_msg:
    "Thank you for your order. You will receive a confirmation shortly.",
  order_number: "Order #",
  order_history: "Order History",
  order_status: "Status",
  order_date: "Date",
  order_total: "Total",
  order_items: "Items",
  order_status_pending: "Pending",
  order_status_processing: "Processing",
  order_status_shipped: "Shipped",
  order_status_completed: "Completed",
  order_status_cancelled: "Cancelled",
  newsletter_title: "Join the Inner Circle",
  newsletter_subtitle:
    "Be the first to discover new scents and exclusive offers.",
  newsletter_placeholder: "Your email address",
  newsletter_cta: "Subscribe",
  footer_tagline: "Crafting memories, one scent at a time.",
  footer_shop: "Shop",
  footer_help: "Help",
  footer_legal: "Legal",
  footer_rights: "© 2026 Nose. All rights reserved.",
  promo_message:
    "Free shipping on orders over 200 AED · Use code NOSE10 for 10% off",
  filter_all: "All",
  filter_search: "Search",
  filter_sort: "Sort",
  filter_sort_newest: "Newest",
  filter_sort_price_asc: "Price: Low to High",
  filter_sort_price_desc: "Price: High to Low",
  view_grid: "Grid",
  view_list: "List",
  admin_dashboard: "Dashboard",
  admin_products: "Products",
  admin_orders: "Orders",
  admin_settings: "Settings",
  admin_add_product: "Add Product",
  admin_edit_product: "Edit Product",
  admin_delete_product: "Delete Product",
  admin_save: "Save",
  admin_cancel: "Cancel",
  admin_new_order_alert: "New order received!",
  auth_sign_in: "Sign In",
  auth_sign_in_admin: "Sign in to admin",
  auth_sign_in_prompt: "Sign in to your account",
  auth_create_account: "Create account",
  auth_already_have_account: "Already have an account?",
  auth_register_title: "Create account",
  auth_register_subtitle: "Create your account to shop faster.",
  auth_first_name: "First name",
  auth_last_name: "Last name",
  auth_phone: "Phone",
  auth_password: "Password",
  auth_confirm_password: "Confirm password",
  auth_invalid_credentials: "Invalid email or password",
  auth_password_requirements:
    "Password must be at least 8 characters and include at least one letter and one number.",
  auth_password_mismatch: "Passwords must match.",
  auth_registration_success: "Account created successfully. Please sign in.",
  account_details: "Account details",
  account_email: "Email",
  account_phone: "Phone",
  account_need_login: "Please sign in to view your account",
  account_my_account: "My Account",
  account_my_orders: "My Orders",
  account_sign_out: "Sign Out",
  back_to_orders: "Back to orders",
  items_label: "items",
  payment_paid: "Paid",
  payment_unpaid: "Unpaid",
  payment_refunded: "Refunded",
  view_details: "View details",
  no_orders_yet: "No orders yet",
  order_details: "Order Details",
  order_tracking: "Order Tracking",
  tracking_received: "Order received",
  tracking_processing: "Processing",
  tracking_shipped: "Shipped",
  tracking_delivered: "Delivered",
  tracking_order_cancelled: "Order cancelled",
  tracking_current_status: "Current status",
  tracking_completed: "Completed",
  tracking_pending: "Pending",
  shipping_address: "Shipping Address",
  quantity: "Qty",
  order_notes: "Order Notes",
  auth_continue_with_manus: "Continue with Manus",
  auth_admin_required: "Please sign in to access the admin panel.",
  auth_sign_out: "Sign Out",
  admin_sign_in_prompt: "Please sign in to access the admin panel.",
  admin_access_denied: "Access denied. Admin only.",
  admin_go_home: "Go Home",
  admin_product_images: "Product Images",
  admin_table_image: "Image",
  admin_table_name: "Name",
  admin_table_sku: "SKU",
  admin_table_price: "Price",
  admin_table_stock: "Stock",
  admin_table_status: "Status",
  admin_payment: "Payment",
  admin_filter_all: "All",
  admin_sign_out: "Sign Out",
  admin_panel_title: "Admin Panel",
  admin_panel_subtitle: "Admin Panel",
  admin_language_arabic: "Arabic",
  admin_language_english: "English",
  admin_quick_overview: "Quick overview",
  admin_pending_orders_summary: "You have {count} pending orders to review.",
  admin_no_orders: "No orders found",
  admin_uploading: "Uploading...",
  admin_click_upload: "Click to upload images",
  admin_name_en: "Name (English) *",
  admin_name_ar: "Name (Arabic) *",
  admin_sku_label: "SKU *",
  admin_price_aed: "Price (AED) *",
  admin_stock_qty: "Stock Qty",
  admin_description_en: "Description (EN)",
  admin_description_ar: "Description (AR)",
  admin_scent_notes_en: "Scent Notes (EN)",
  admin_scent_notes_ar: "Scent Notes (AR)",
  admin_badge_new_arrival: "New Arrival",
  admin_badge_bestseller: "Bestseller",
  admin_badge_featured: "Featured",
  admin_badge_active: "Active",
  admin_no_products: "No products yet. Add your first product.",
  admin_delete_confirm: "Delete this product?",
  admin_upload_failed: "Upload failed",
  admin_image_upload_success: "image(s) uploaded",
  admin_status_active: "Active",
  admin_status_inactive: "Inactive",
  admin_status_updated: "Status updated",
  admin_product_created: "Product created",
  admin_product_updated: "Product updated",
  admin_product_deleted: "Product deleted",
  admin_order_updated: "Status updated",
  admin_new_order: "New order received",
  admin_discount_codes_title: "Discount Codes",
  admin_discount_codes_description: "Create and manage discount codes",
  admin_create_code: "Create code",
  admin_search_discount_codes: "Search discount codes",
  admin_status: "Status",
  admin_type: "Type",
  admin_percentage: "Percentage",
  admin_fixed_amount: "Fixed amount",
  admin_create_discount_code: "Create discount code",
  admin_add_discount_code_details: "Add a new discount code carefully",
  admin_discount_code: "Discount code",
  admin_discount_type: "Discount type",
  admin_discount_value: "Discount value",
  admin_minimum_order_amount: "Minimum order amount",
  admin_maximum_discount_amount: "Maximum discount amount",
  admin_usage_limit: "Usage limit",
  admin_expiry_date: "Expiry date",
  admin_leave_blank_for_0: "Leave blank for 0",
  admin_optional_cap: "Optional cap",
  admin_leave_blank_for_unlimited: "Leave blank for unlimited",
  admin_leave_blank_for_no_expiry: "Leave blank for no expiry",
  admin_enter_whole_number: "Enter a whole number from 1 to 100",
  admin_enter_discount_amount: "Enter the discount amount in AED",
  admin_no_expiry: "No expiry",
  admin_discount_type_percentage: "Percentage",
  admin_discount_type_fixed: "Fixed amount",
  admin_edit_discount_code: "Edit discount code",
  admin_update_discount_code_details: "Update the details and save changes",
  admin_no_discount_codes_title: "No discount codes yet",
  admin_no_discount_codes_description:
    "Add your first discount code to manage offers easily.",
  admin_create_first_discount_code: "Create your first code",
  admin_no_matching_discount_codes_title: "No matching discount codes",
  admin_no_matching_discount_codes_description:
    "Try a different search term or adjust the filters.",
  admin_clear_search_and_filters: "Clear search and filters",
  admin_no_results_found: "No results match your filters.",
  admin_confirm_delete_discount_code: "Delete this discount code?",
  admin_status_expired: "Expired",
  admin_saving: "Saving...",
  admin_code_already_exists: "This discount code already exists",
  admin_error_save_discount_code: "Unable to save the discount code",
  admin_error_delete_discount_code: "Unable to delete the discount code",
  admin_code: "Code",
  admin_value: "Value",
  admin_minimum_order: "Minimum order",
  admin_usage: "Usage",
  admin_expiry: "Expiry",
  admin_actions: "Actions",
  admin_activate: "Activate",
  admin_deactivate: "Deactivate",
  admin_edit: "Edit",
  admin_delete: "Delete",
  admin_none: "None",
  admin_unlimited: "Unlimited",
  page_login_title: "Sign in",
  page_login_subtitle: "Continue to the admin dashboard.",
  page_product_not_found: "Product not found",
  page_admin_panel: "Admin Panel",
  page_admin_panel_subtitle: "Admin Panel",
  loading: "Loading…",
  error_generic: "Something went wrong. Please try again.",
  currency: "AED",
  back: "Back",
  see_all: "See All",
};

const ar: Translations = {
  nav_home: "الرئيسية",
  nav_shop: "المتجر",
  nav_collections: "المجموعات",
  nav_about: "قصتنا",
  nav_search_placeholder: "ابحث عن عطر…",
  nav_cart: "السلة",
  nav_account: "حسابي",
  nav_admin: "لوحة التحكم",
  hero_tagline: "ارتدِ قصتك",
  hero_subtitle:
    "عطور مصنوعة يدوياً تتحدث قبلك. اكتشف روائح وُلدت من ليالي الصحراء وحدائق المتوسط.",
  hero_cta: "استكشف المجموعة",
  section_new_arrivals: "وصل حديثاً",
  section_bestsellers: "الأكثر مبيعاً",
  section_collections: "المجموعات",
  section_featured: "مميز",
  product_add_to_cart: "أضف إلى السلة",
  product_out_of_stock: "نفد المخزون",
  product_size: "الحجم",
  product_scent_notes: "مكونات العطر",
  product_description: "الوصف",
  product_new: "جديد",
  product_bestseller: "الأكثر مبيعاً",
  product_featured: "مميز",
  category_men: "عطور رجالية",
  category_women: "عطور نسائية",
  category_gifts: "هدايا",
  admin_category: "القسم",
  admin_category_required: "يرجى اختيار القسم.",
  product_qty: "الكمية",
  product_in_stock: "متوفر",
  product_only_x_left: "متبقي {count} فقط",
  product_details: "تفاصيل المنتج",
  delivery_returns: "التوصيل والإرجاع",
  product_secure_checkout: "دفع آمن",
  product_delivery_uae: "التوصيل داخل الإمارات",
  product_authentic_products: "منتجات أصلية",
  related_products: "قد يعجبك أيضًا",
  cart_title: "سلة التسوق",
  cart_empty: "سلتك فارغة",
  cart_subtotal: "المجموع الفرعي",
  cart_checkout: "إتمام الشراء",
  cart_continue: "مواصلة التسوق",
  cart_remove: "حذف",
  cart_added_to_cart_title: "تمت الإضافة إلى السلة",
  cart_added_to_cart_description: "تمت إضافة المنتج بنجاح",
  cart_view_cart: "عرض السلة",
  checkout_title: "الدفع",
  checkout_name: "الاسم الكامل",
  checkout_phone: "رقم الهاتف",
  checkout_email: "البريد الإلكتروني",
  checkout_address: "عنوان الشحن",
  checkout_city: "المدينة",
  checkout_notes: "ملاحظات الطلب (اختياري)",
  checkout_place_order: "تأكيد الطلب",
  checkout_pay_now: "ادفع الآن",
  checkout_order_summary: "ملخص الطلب",
  checkout_subtotal: "المجموع الفرعي",
  checkout_shipping: "التوصيل",
  checkout_discount: "الخصم",
  checkout_tax: "الضريبة",
  checkout_total: "الإجمالي",
  order_confirmed: "تم تأكيد الطلب!",
  order_confirmed_msg: "شكراً لطلبك. ستصلك رسالة تأكيد قريباً.",
  order_number: "رقم الطلب #",
  order_history: "سجل الطلبات",
  order_status: "الحالة",
  order_date: "التاريخ",
  order_total: "الإجمالي",
  order_items: "المنتجات",
  order_status_pending: "قيد الانتظار",
  order_status_processing: "قيد المعالجة",
  order_status_shipped: "تم الشحن",
  order_status_completed: "مكتمل",
  order_status_cancelled: "ملغي",
  newsletter_title: "انضم إلى الدائرة الداخلية",
  newsletter_subtitle: "كن أول من يكتشف العطور الجديدة والعروض الحصرية.",
  newsletter_placeholder: "بريدك الإلكتروني",
  newsletter_cta: "اشترك",
  footer_tagline: "نصنع الذكريات، عطراً تلو الآخر.",
  footer_shop: "التسوق",
  footer_help: "المساعدة",
  footer_legal: "القانونية",
  footer_rights: "© 2026 Nose. جميع الحقوق محفوظة.",
  promo_message:
    "شحن مجاني للطلبات فوق ٢٠٠ درهم · استخدم كود NOSE10 للحصول على خصم ١٠٪",
  filter_all: "الكل",
  filter_search: "بحث",
  filter_sort: "ترتيب",
  filter_sort_newest: "الأحدث",
  filter_sort_price_asc: "السعر: من الأقل",
  filter_sort_price_desc: "السعر: من الأعلى",
  view_grid: "شبكة",
  view_list: "قائمة",
  admin_dashboard: "لوحة التحكم",
  admin_products: "المنتجات",
  admin_orders: "الطلبات",
  admin_settings: "الإعدادات",
  admin_add_product: "إضافة منتج",
  admin_edit_product: "تعديل المنتج",
  admin_delete_product: "حذف المنتج",
  admin_save: "حفظ",
  admin_cancel: "إلغاء",
  admin_new_order_alert: "طلب جديد وصل!",
  auth_sign_in: "تسجيل الدخول",
  auth_sign_in_admin: "تسجيل الدخول إلى الإدارة",
  auth_sign_in_prompt: "سجّل الدخول إلى حسابك",
  auth_create_account: "إنشاء حساب",
  auth_already_have_account: "لديك حساب بالفعل؟",
  auth_register_title: "إنشاء حساب",
  auth_register_subtitle: "أنشئ حسابك للشراء بسرعة أكبر.",
  auth_first_name: "الاسم الأول",
  auth_last_name: "اسم العائلة",
  auth_phone: "الهاتف",
  auth_password: "كلمة المرور",
  auth_confirm_password: "تأكيد كلمة المرور",
  auth_invalid_credentials: "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  auth_password_requirements:
    "يجب أن تكون كلمة المرور 8 أحرف على الأقل وتحتوي على حرف ورقم.",
  auth_password_mismatch: "يجب أن تتطابق كلمات المرور.",
  auth_registration_success: "تم إنشاء الحساب بنجاح. يرجى تسجيل الدخول.",
  account_details: "معلومات الحساب",
  account_email: "البريد الإلكتروني",
  account_phone: "الهاتف",
  account_need_login: "يرجى تسجيل الدخول لعرض حسابك",
  account_my_account: "حسابي",
  account_my_orders: "طلباتي",
  account_sign_out: "خروج",
  back_to_orders: "العودة إلى الطلبات",
  items_label: "منتجات",
  payment_paid: "مدفوع",
  payment_unpaid: "غير مدفوع",
  payment_refunded: "تم الاسترجاع",
  view_details: "عرض التفاصيل",
  no_orders_yet: "لا توجد طلبات بعد",
  order_details: "تفاصيل الطلب",
  order_tracking: "تتبع الطلب",
  tracking_received: "تم استلام الطلب",
  tracking_processing: "قيد المعالجة",
  tracking_shipped: "تم الشحن",
  tracking_delivered: "تم التسليم",
  tracking_order_cancelled: "تم إلغاء الطلب",
  tracking_current_status: "الحالة الحالية",
  tracking_completed: "مكتمل",
  tracking_pending: "قيد الانتظار",
  shipping_address: "عنوان الشحن",
  quantity: "Qty",
  order_notes: "ملاحظات الطلب",
  auth_continue_with_manus: "المتابعة مع Manus",
  auth_admin_required: "يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.",
  auth_sign_out: "خروج",
  admin_sign_in_prompt: "يرجى تسجيل الدخول للوصول إلى لوحة الإدارة.",
  admin_access_denied: "غير مسموح. هذا القسم للإدارة فقط.",
  admin_go_home: "العودة للرئيسية",
  admin_product_images: "صور المنتج",
  admin_table_image: "الصورة",
  admin_table_name: "الاسم",
  admin_table_sku: "SKU",
  admin_table_price: "السعر",
  admin_table_stock: "المخزون",
  admin_table_status: "الحالة",
  admin_payment: "الدفع",
  admin_filter_all: "الكل",
  admin_sign_out: "تسجيل الخروج",
  admin_panel_title: "لوحة الإدارة",
  admin_panel_subtitle: "لوحة الإدارة",
  admin_language_arabic: "العربية",
  admin_language_english: "الإنجليزية",
  admin_quick_overview: "نظرة سريعة",
  admin_pending_orders_summary: "لديك {count} طلبات معلّقة تحتاج إلى المراجعة.",
  admin_no_orders: "لا توجد طلبات",
  admin_discount_codes_title: "رموز الخصم",
  admin_discount_codes_description: "أنشئ وتحقق من رموز الخصم",
  admin_create_code: "إنشاء رمز",
  admin_search_discount_codes: "ابحث عن رموز الخصم",
  admin_status: "الحالة",
  admin_type: "النوع",
  admin_percentage: "نسبة مئوية",
  admin_fixed_amount: "مبلغ ثابت",
  admin_create_discount_code: "إنشاء رمز خصم",
  admin_add_discount_code_details: "أضف رمز خصم جديد بعناية",
  admin_discount_code: "رمز الخصم",
  admin_discount_type: "نوع الخصم",
  admin_discount_value: "قيمة الخصم",
  admin_minimum_order_amount: "الحد الأدنى للطلب",
  admin_maximum_discount_amount: "الحد الأقصى للخصم",
  admin_usage_limit: "حد الاستخدام",
  admin_expiry_date: "تاريخ الانتهاء",
  admin_leave_blank_for_0: "اتركه فارغًا ليكون 0",
  admin_optional_cap: "حد اختياري",
  admin_leave_blank_for_unlimited: "اتركه فارغًا لعدم وجود حد",
  admin_leave_blank_for_no_expiry: "اتركه فارغًا لعدم وجود انتهاء",
  admin_enter_whole_number: "أدخل عددًا صحيحًا من 1 إلى 100",
  admin_enter_discount_amount: "أدخل قيمة الخصم بالدرهم",
  admin_no_expiry: "لا يوجد",
  admin_discount_type_percentage: "نسبة مئوية",
  admin_discount_type_fixed: "مبلغ ثابت",
  admin_edit_discount_code: "تعديل رمز الخصم",
  admin_update_discount_code_details: "حدّث تفاصيل الرمز ثم احفظ التغييرات",
  admin_no_discount_codes_title: "لا توجد رموز خصم حتى الآن",
  admin_no_discount_codes_description: "أضف أول رمز خصم لإدارة العروض بسهولة.",
  admin_create_first_discount_code: "إنشاء أول رمز",
  admin_no_matching_discount_codes_title: "لا توجد رموز خصم مطابقة",
  admin_no_matching_discount_codes_description:
    "جرّب اسمًا آخر أو غيّر خيارات التصفية.",
  admin_clear_search_and_filters: "مسح البحث والفلاتر",
  admin_no_results_found: "لا توجد نتائج تناسب معايير البحث.",
  admin_confirm_delete_discount_code: "هل تريد حذف هذا الرمز؟",
  admin_code: "الرمز",
  admin_value: "القيمة",
  admin_minimum_order: "الحد الأدنى للطلب",
  admin_usage: "الاستخدام",
  admin_expiry: "الانتهاء",
  admin_actions: "الإجراءات",
  admin_activate: "تفعيل",
  admin_deactivate: "تعطيل",
  admin_edit: "تعديل",
  admin_delete: "حذف",
  admin_none: "لا شيء",
  admin_unlimited: "غير محدود",
  admin_uploading: "جاري الرفع...",
  admin_click_upload: "انقر لرفع الصور",
  admin_name_en: "الاسم (الإنجليزي) *",
  admin_name_ar: "الاسم (العربي) *",
  admin_sku_label: "SKU *",
  admin_price_aed: "السعر (AED) *",
  admin_stock_qty: "الكمية",
  admin_description_en: "الوصف (EN)",
  admin_description_ar: "الوصف (AR)",
  admin_scent_notes_en: "مكونات العطر (EN)",
  admin_scent_notes_ar: "مكونات العطر (AR)",
  admin_badge_new_arrival: "جديد",
  admin_badge_bestseller: "الأكثر مبيعاً",
  admin_badge_featured: "مميز",
  admin_badge_active: "نشط",
  admin_no_products: "لا توجد منتجات بعد. أضف أول منتج لك.",
  admin_delete_confirm: "حذف هذا المنتج؟",
  admin_upload_failed: "فشل الرفع",
  admin_image_upload_success: "تم رفع الصورة/الصور",
  admin_status_active: "نشط",
  admin_status_inactive: "غير نشط",
  admin_status_updated: "تم تحديث الحالة",
  admin_product_created: "تم إنشاء المنتج",
  admin_product_updated: "تم تحديث المنتج",
  admin_product_deleted: "تم حذف المنتج",
  admin_order_updated: "تم تحديث الحالة",
  admin_new_order: "طلب جديد وصل",
  admin_status_expired: "منتهي",
  admin_saving: "جارٍ الحفظ...",
  admin_code_already_exists: "هذا الرمز موجود بالفعل",
  admin_error_save_discount_code: "تعذّر حفظ رمز الخصم",
  admin_error_delete_discount_code: "تعذّر حذف رمز الخصم",
  page_login_title: "تسجيل الدخول",
  page_login_subtitle: "تابع إلى لوحة إدارة المنتجات.",
  page_product_not_found: "المنتج غير موجود",
  page_admin_panel: "لوحة التحكم",
  page_admin_panel_subtitle: "لوحة التحكم",
  loading: "جاري التحميل…",
  error_generic: "حدث خطأ. يرجى المحاولة مرة أخرى.",
  currency: "درهم",
  back: "رجوع",
  see_all: "عرض الكل",
};

interface I18nContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Translations;
  isRTL: boolean;
  formatPrice: (amount: number | string) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem("nose_locale");
    return saved === "ar" || saved === "en" ? saved : "en";
  });

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("nose_locale", l);
  };

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  }, [locale]);

  const isRTL = locale === "ar";
  const t = locale === "ar" ? ar : en;

  const formatPrice = (amount: number | string) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (locale === "ar") {
      return `${num.toFixed(2)} ${ar.currency}`;
    }
    return `${en.currency} ${num.toFixed(2)}`;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRTL, formatPrice }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
