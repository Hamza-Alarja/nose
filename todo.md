# Nose Fragrance Store — TODO

## Phase 1: Database Schema & Design System
- [x] Define Drizzle schema: products, orders, order_items, cart_items tables
- [x] Run migration and apply SQL
- [x] Set up Nose brand design tokens in index.css (colors, fonts, RTL variables)
- [x] Add Google Fonts (Cormorant Garamond, Noto Naskh Arabic, Inter) to index.html
- [x] Create i18n context (language switcher, AR/EN translations)
- [x] Create RTL-aware layout wrapper

## Phase 2: Storefront Pages
- [x] Storefront layout: top promo bar, header with logo/nav/cart/language switcher
- [x] Homepage: hero banner, featured collections, new arrivals grid, bestsellers, newsletter, footer
- [x] Product catalog page: category filter, search, grid/list toggle, product cards
- [x] Product detail page: image gallery, scent notes, size/variant selector, add-to-cart

## Phase 3: Cart & Checkout
- [x] Cart context (global state, add/remove/update quantity)
- [x] Cart drawer/sidebar with quantity management and subtotal
- [x] Checkout page: customer info form (name, phone, email, address)
- [x] Ziina payment integration: create payment link on order placement (requires ZIINA_API_KEY secret)
- [x] Webhook endpoint for Ziina payment confirmation (via orders.ziinaWebhook tRPC mutation)
- [x] Order confirmation page after successful payment

## Phase 4: Admin Dashboard
- [x] Admin route guard (role-based, admin only)
- [x] Admin login via Manus OAuth with role check
- [x] Admin dashboard layout with sidebar navigation
- [x] Product CRUD: list, add, edit, delete products
- [x] Product image upload via S3 storage
- [x] Orders management: list all orders, filter by status, update order status
- [x] Order detail view: products, customer info, payment status

## Phase 5: Notifications & Polish
- [x] Owner email/notification on new order (via notifyOwner with full order details)
- [x] Order history page for logged-in users
- [x] RTL layout polish: dir="rtl" on Arabic pages, mirrored icons, LTR numbers
- [x] Bilingual content: all UI strings in AR/EN
- [x] New order polling alert in admin (every 20-30s, visual/sound alert)
- [x] Mobile responsive design

## Phase 6: Tests & Delivery
- [x] Vitest: product router tests
- [x] Vitest: order router tests
- [x] Final QA and checkpoint

## Admin Login System (New)
- [ ] Create admin_users table in database (separate from users table)
- [ ] Create login page at /login with email/password form
- [ ] Create admin login tRPC procedure (authenticate against admin_users)
- [ ] Create admin logout tRPC procedure
- [ ] Add route protection middleware: redirect unauthenticated /admin/* to /login
- [ ] Redirect authenticated users from /login to /admin after successful login
- [ ] Add admin session management (separate from customer OAuth)
- [ ] Create admin auth context/hook for checking admin login state
