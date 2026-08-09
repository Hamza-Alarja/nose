import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { notifyOwner } from "./_core/notification";
import {
  createProduct,
  createOrderWithStock,
  getOrderById,
  getOrdersByUserId,
  releaseOrderStock,
  updateOrderPayment,
  updateProduct,
} from "./db-products";

// Mock db-products module
vi.mock("./db-products", () => ({
  getAllProducts: vi.fn().mockResolvedValue([
    {
      id: 1,
      sku: "NOSE-001",
      nameEn: "Desert Rose",
      nameAr: "وردة الصحراء",
      price: "299.00",
      stockQuantity: 10,
      images: [],
      variants: [],
      isNew: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getProductById: vi.fn().mockResolvedValue({
    id: 1,
    sku: "NOSE-001",
    nameEn: "Desert Rose",
    nameAr: "وردة الصحراء",
    price: "299.00",
    stockQuantity: 10,
    images: [],
    variants: [],
    isNew: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  createProduct: vi.fn().mockResolvedValue(undefined),
  createOrderWithStock: vi.fn().mockResolvedValue({
    orderId: 1,
    orderNumber: "NOSE-TEST-0001",
    subtotal: "598.00",
    shippingAmount: "25.00",
    discountAmount: "0.00",
    taxAmount: "0.00",
    totalAmount: "623.00",
    currency: "AED",
    items: [
      {
        productId: 1,
        productNameAr: "وردة الصحراء",
        productNameEn: "Desert Rose",
        quantity: 2,
        unitPrice: "299.00",
      },
    ],
  }),
  updateProduct: vi.fn().mockResolvedValue(undefined),
  deleteProduct: vi.fn().mockResolvedValue(undefined),
  createOrder: vi
    .fn()
    .mockResolvedValue({ orderId: 1, orderNumber: "NOSE-TEST-0001" }),
  getOrderById: vi.fn().mockResolvedValue(null),
  getOrderByNumber: vi.fn().mockResolvedValue(null),
  getOrderItems: vi.fn().mockResolvedValue([]),
  getAllOrders: vi.fn().mockResolvedValue([]),
  getOrdersByUserId: vi.fn().mockResolvedValue([]),
  releaseOrderStock: vi.fn().mockResolvedValue(true),
  updateOrderStatus: vi.fn().mockResolvedValue(undefined),
  updateOrderPayment: vi.fn().mockResolvedValue(undefined),
  getNewOrdersSince: vi.fn().mockResolvedValue([]),
}));

vi.mock("./storage", () => ({
  storagePut: vi
    .fn()
    .mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function makePublicCtx(): TrpcContext {
  return {
    user: null,
    admin: null,
    customer: null,
    req: { protocol: "https", headers: { host: "localhost:3000" } } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeAdminCtx(): TrpcContext {
  const admin = {
    id: 1,
    openId: "admin-user",
    email: "admin@nose.com",
    name: "Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: admin,
    admin,
    customer: null,
    req: { protocol: "https", headers: { host: "localhost:3000" } } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

function makeCustomerCtx(): TrpcContext {
  const customer = {
    id: 123,
    openId: "customer-user",
    email: "customer@example.com",
    name: "Customer",
    loginMethod: "password",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user: customer,
    admin: null,
    customer,
    req: { protocol: "https", headers: { host: "localhost:3000" } } as any,
    res: { clearCookie: vi.fn() } as any,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.ZIINA_API_KEY = "test-ziina-key";
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "pay_test",
        redirect_url: "https://hosted.example/checkout",
      }),
    })
  );
});

describe("products.list", () => {
  it("returns products for public users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.list({});
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].nameEn).toBe("Desert Rose");
  });
});

describe("products.byId", () => {
  it("returns a product by id", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.products.byId({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.sku).toBe("NOSE-001");
  });
});

describe("products.create", () => {
  it("allows admin to create a product", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    const result = await caller.products.create({
      sku: "NOSE-002",
      nameEn: "Amber Night",
      nameAr: "ليلة العنبر",
      price: "350.00",
      stockQuantity: 5,
      images: [],
      variants: [],
      isNew: true,
      isActive: true,
      category: "men",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes an empty compare-at-price to null", async () => {
    const caller = appRouter.createCaller(makeAdminCtx());
    await caller.products.create({
      sku: "NOSE-004",
      nameEn: "Velvet Bloom",
      nameAr: "زهرة المخمل",
      price: "250.00",
      compareAtPrice: "",
      stockQuantity: 3,
      images: [],
      variants: [],
      isNew: true,
      isActive: true,
      category: "women",
    });

    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({ compareAtPrice: null })
    );
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.products.create({
        sku: "NOSE-003",
        nameEn: "Test",
        nameAr: "اختبار",
        price: "100.00",
        stockQuantity: 0,
        images: [],
        variants: [],
        isNew: false,
        isActive: true,
        category: "gifts",
      })
    ).rejects.toThrow();
  });
});

describe("orders.create", () => {
  it("ignores client-supplied price and product snapshots", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await caller.orders.create({
      customerName: "Ahmed Al-Rashid",
      customerPhone: "+971501234567",
      shippingAddress: "123 Sheikh Zayed Rd, Dubai",
      items: [
        {
          productId: 1,
          quantity: 1,
          unitPrice: "0.01",
          productNameEn: "Manipulated",
          productNameAr: "بيانات مزورة",
        } as any,
      ],
    });

    expect(createOrderWithStock).toHaveBeenCalledWith(
      expect.any(Object),
      [{ productId: 1, quantity: 1 }],
      undefined
    );
  });

  it("creates an order and returns order number", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.orders.create({
      customerName: "Ahmed Al-Rashid",
      customerPhone: "+971501234567",
      customerEmail: "ahmed@example.com",
      shippingAddress: "123 Sheikh Zayed Rd, Dubai",
      city: "Dubai",
      items: [
        {
          productId: 1,
          quantity: 2,
        },
      ],
    });
    expect(result.orderNumber).toBe("NOSE-TEST-0001");
    expect(result.orderId).toBe(1);
    expect(result).toMatchObject({
      subtotal: "598.00",
      shippingAmount: "25.00",
      discountAmount: "0.00",
      taxAmount: "0.00",
      totalAmount: "623.00",
      currency: "AED",
    });
  });

  it("keeps the order creation successful when notification delivery fails", async () => {
    vi.mocked(notifyOwner).mockRejectedValueOnce(
      new Error("notification failed")
    );

    const caller = appRouter.createCaller(makePublicCtx());
    const result = await caller.orders.create({
      customerName: "Ahmed Al-Rashid",
      customerPhone: "+971501234567",
      customerEmail: "ahmed@example.com",
      shippingAddress: "123 Sheikh Zayed Rd, Dubai",
      city: "Dubai",
      items: [
        {
          productId: 1,
          quantity: 2,
        },
      ],
    });

    expect(result.orderNumber).toBe("NOSE-TEST-0001");
    expect(result.orderId).toBe(1);
  });

  it("fails cleanly when Ziina does not return a hosted redirect URL", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: "pay_test",
          success_url: "https://example.com/success",
        }),
      })
    );

    const caller = appRouter.createCaller(makePublicCtx());
    await expect(
      caller.orders.create({
        customerName: "Ahmed Al-Rashid",
        customerPhone: "+971501234567",
        customerEmail: "ahmed@example.com",
        shippingAddress: "123 Sheikh Zayed Rd, Dubai",
        city: "Dubai",
        items: [{ productId: 1, quantity: 2 }],
      })
    ).rejects.toThrow("Unable to start Ziina checkout");

    expect(releaseOrderStock).toHaveBeenCalledTimes(1);
    expect(updateOrderPayment).toHaveBeenCalledWith(1, "unpaid");
  });

  it("associates a logged-in customer order with the session customer id", async () => {
    const caller = appRouter.createCaller(makeCustomerCtx());
    await caller.orders.create({
      customerName: "Layla",
      customerPhone: "+971501234567",
      shippingAddress: "123 Sheikh Zayed Rd, Dubai",
      items: [{ productId: 1, quantity: 1 }],
    });

    expect(createOrderWithStock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 123 }),
      [{ productId: 1, quantity: 1 }],
      undefined
    );
  });

  it("ignores a client-supplied userId on order creation", async () => {
    const caller = appRouter.createCaller(makePublicCtx());
    await caller.orders.create({
      customerName: "Hacker",
      customerPhone: "+971501234567",
      shippingAddress: "123 Sheikh Zayed Rd, Dubai",
      items: [{ productId: 1, quantity: 1 }],
      userId: 999,
    } as any);

    expect(createOrderWithStock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
      [{ productId: 1, quantity: 1 }],
      undefined
    );
  });
});

describe("orders.myOrders and myOrderDetail", () => {
  it("returns orders for the authenticated customer", async () => {
    const caller = appRouter.createCaller(makeCustomerCtx());
    await caller.orders.myOrders();

    expect(getOrdersByUserId).toHaveBeenCalledWith(123);
  });

  it("rejects access to another customer\'s order detail", async () => {
    vi.mocked(getOrderById).mockResolvedValueOnce({
      id: 42,
      userId: 999,
    } as any);

    const caller = appRouter.createCaller(makeCustomerCtx());
    await expect(
      caller.orders.myOrderDetail({ orderId: 42 })
    ).rejects.toThrow();
  });
});
