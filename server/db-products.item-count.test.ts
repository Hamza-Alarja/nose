import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetDb } = vi.hoisted(() => ({ mockGetDb: vi.fn() }));

vi.mock("./db", () => ({
  getDb: mockGetDb,
}));

import { getOrdersByUserId } from "./db-products";

class FakeQueryBuilder {
  public calls: string[] = [];
  constructor(private readonly rows: Array<Record<string, unknown>>) {}

  select() {
    return this;
  }

  from() {
    this.calls.push("from");
    return this;
  }

  leftJoin() {
    this.calls.push("leftJoin");
    return this;
  }

  where() {
    this.calls.push("where");
    return this;
  }

  groupBy(...columns: unknown[]) {
    this.calls.push(`groupBy:${columns.length}`);
    return this;
  }

  orderBy() {
    this.calls.push("orderBy");
    return this;
  }

  then(resolve: (value: Array<Record<string, unknown>>) => unknown) {
    return Promise.resolve(this.rows).then(resolve);
  }
}

describe("getOrdersByUserId item count", () => {
  beforeEach(() => {
    mockGetDb.mockReset();
  });

  it("aggregates item quantities per order instead of using a global count", async () => {
    const rows = [
      { id: 1, itemCount: 1 },
      { id: 2, itemCount: 3 },
    ];
    const builder = new FakeQueryBuilder(rows);
    const selectMock = vi.fn(() => builder);

    mockGetDb.mockResolvedValue({
      select: selectMock,
    });

    const result = await getOrdersByUserId(123);

    expect(result).toEqual(rows);
    expect(selectMock).toHaveBeenCalledWith(
      expect.objectContaining({ itemCount: expect.anything() })
    );
    expect(builder.calls).toContain("leftJoin");
    expect(builder.calls.some(call => call.startsWith("groupBy:"))).toBe(true);
  });
});
