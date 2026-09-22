import { NextRequest, NextResponse } from "next/server";
import { getProductById, getProductVariations } from "@/lib/woocommerce";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const productId = Number(id);
    if (!Number.isFinite(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    const includeVariations =
      request.nextUrl.searchParams.get("variations") === "true";

    const product = await getProductById(productId);
    if (includeVariations && product.type === "variable") {
      const variations = await getProductVariations(productId);
      return NextResponse.json({ product, variations });
    }

    return NextResponse.json({ product });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch product";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
