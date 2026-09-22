import "server-only";

import type {
  Category,
  Product,
  ProductVariation,
  ProductsQuery,
} from "@/types";

const REVALIDATE_SECONDS = 60;

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_WORDPRESS_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_WORDPRESS_URL is not set");
  }
  return url.replace(/\/$/, "");
}

function getAuthHeader(): string {
  const key = process.env.WC_CONSUMER_KEY;
  const secret = process.env.WC_CONSUMER_SECRET;
  if (!key || !secret) {
    throw new Error("WooCommerce API credentials are not configured");
  }
  const token = Buffer.from(`${key}:${secret}`).toString("base64");
  return `Basic ${token}`;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

async function wcFetch<T>(
  path: string,
  init?: RequestInit & { revalidate?: number | false }
): Promise<T> {
  const { revalidate = REVALIDATE_SECONDS, ...fetchInit } = init ?? {};
  const url = `${getBaseUrl()}/wp-json/wc/v3${path}`;

  const response = await fetch(url, {
    ...fetchInit,
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...fetchInit.headers,
    },
    next:
      revalidate === false
        ? undefined
        : {
            revalidate,
          },
    cache: revalidate === false ? "no-store" : undefined,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `WooCommerce API error ${response.status} for ${path}: ${body.slice(0, 300)}`
    );
  }

  return response.json() as Promise<T>;
}

function mapProductsQuery(query: ProductsQuery = {}): Record<string, string | number | boolean | undefined> {
  return {
    page: query.page ?? 1,
    per_page: query.perPage ?? 12,
    category: query.category,
    search: query.search,
    orderby: query.orderby ?? "date",
    order: query.order ?? "desc",
    featured: query.featured,
    stock_status: query.stockStatus,
    include: query.include?.length ? query.include.join(",") : undefined,
    slug: query.slug,
    status: "publish",
  };
}

export async function getProducts(query: ProductsQuery = {}): Promise<Product[]> {
  const qs = buildQuery(mapProductsQuery(query));
  return wcFetch<Product[]>(`/products${qs}`);
}

export async function getProductById(id: number): Promise<Product> {
  return wcFetch<Product>(`/products/${id}`);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const products = await wcFetch<Product[]>(
    `/products${buildQuery({ slug, status: "publish" })}`
  );
  return products[0] ?? null;
}

export async function getProductVariations(
  productId: number
): Promise<ProductVariation[]> {
  return wcFetch<ProductVariation[]>(
    `/products/${productId}/variations${buildQuery({ per_page: 100 })}`
  );
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  return getProducts({
    featured: true,
    perPage: limit,
    orderby: "popularity",
    order: "desc",
  });
}

export async function getCategories(params?: {
  perPage?: number;
  hideEmpty?: boolean;
  parent?: number;
}): Promise<Category[]> {
  const qs = buildQuery({
    per_page: params?.perPage ?? 50,
    hide_empty: params?.hideEmpty ?? true,
    parent: params?.parent,
  });
  return wcFetch<Category[]>(`/products/categories${qs}`);
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const categories = await wcFetch<Category[]>(
    `/products/categories${buildQuery({ slug })}`
  );
  return categories[0] ?? null;
}

export interface CreateOrderPayload {
  line_items: Array<{
    product_id: number;
    variation_id?: number;
    quantity: number;
  }>;
  billing?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}

export interface CreatedOrder {
  id: number;
  order_key: string;
  status: string;
  payment_url?: string;
  total: string;
}

export async function createPendingOrder(
  payload: CreateOrderPayload
): Promise<CreatedOrder> {
  return wcFetch<CreatedOrder>("/orders", {
    method: "POST",
    body: JSON.stringify({
      status: "pending",
      set_paid: false,
      line_items: payload.line_items,
      billing: payload.billing ?? {},
    }),
    revalidate: false,
  });
}

export function getWordpressUrl(): string {
  return getBaseUrl();
}

export function buildAddToCartCheckoutUrl(
  items: Array<{ productId: number; variationId?: number; quantity: number }>
): string {
  const base = getBaseUrl();
  if (items.length === 0) return `${base}/checkout/`;

  const first = items[0];
  const params = new URLSearchParams({
    "add-to-cart": String(first.variationId ?? first.productId),
    quantity: String(first.quantity),
  });

  // Additional items: append as repeatable query keys for bridge/plugins;
  // primary checkout path for multi-item uses createPendingOrder + payment_url.
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    params.append("add-to-cart", String(item.variationId ?? item.productId));
    params.append("quantity", String(item.quantity));
  }

  return `${base}/checkout/?${params.toString()}`;
}
