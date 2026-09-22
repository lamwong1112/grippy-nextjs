import { NextRequest, NextResponse } from "next/server";
import { getCategories } from "@/lib/woocommerce";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const perPage = Number(searchParams.get("per_page") ?? "50") || 50;
    const hideEmpty = searchParams.get("hide_empty") !== "false";
    const parentParam = searchParams.get("parent");
    const parent =
      parentParam !== null && parentParam !== ""
        ? Number(parentParam)
        : undefined;

    const categories = await getCategories({
      perPage,
      hideEmpty,
      parent: Number.isFinite(parent) ? parent : undefined,
    });

    return NextResponse.json({ categories });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
