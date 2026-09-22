import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/woocommerce";
import type { ProductsQuery, StockStatus } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const query: ProductsQuery = {
      page: Number(searchParams.get("page") ?? "1") || 1,
      perPage: Number(searchParams.get("per_page") ?? "12") || 12,
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      orderby: (searchParams.get("orderby") as ProductsQuery["orderby"]) ?? "date",
      order: (searchParams.get("order") as ProductsQuery["order"]) ?? "desc",
      featured: searchParams.get("featured") === "true" ? true : undefined,
      stockStatus: (searchParams.get("stock_status") as StockStatus) ?? undefined,
      slug: searchParams.get("slug") ?? undefined,
    };

    const products = await getProducts(query);
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
