import { NextRequest, NextResponse } from "next/server";
import {
  buildAddToCartCheckoutUrl,
  createPendingOrder,
  getProductById,
} from "@/lib/woocommerce";
import type { CartItem, CheckoutLineItem } from "@/types";

type EnrichBody = {
  action?: "enrich" | "checkout-url" | "create-order";
  items: Array<{
    productId: number;
    variationId?: number;
    quantity: number;
  }>;
};

async function enrichItems(
  items: EnrichBody["items"]
): Promise<{ items: CartItem[]; errors: string[] }> {
  const errors: string[] = [];
  const enriched: CartItem[] = [];

  for (const item of items) {
    try {
      const product = await getProductById(item.productId);
      if (!product.purchasable || product.stock_status === "outofstock") {
        errors.push(`${product.name} is unavailable`);
        continue;
      }
      enriched.push({
        productId: product.id,
        variationId: item.variationId,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity: item.quantity,
        image: product.images[0]?.src,
        stockStatus: product.stock_status,
      });
    } catch {
      errors.push(`Product ${item.productId} could not be validated`);
    }
  }

  return { items: enriched, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as EnrichBody;
    const items = body.items ?? [];
    const action = body.action ?? "enrich";

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart items are required" }, { status: 400 });
    }

    if (action === "enrich") {
      const result = await enrichItems(items);
      return NextResponse.json(result);
    }

    if (action === "checkout-url") {
      const checkoutUrl = buildAddToCartCheckoutUrl(items);
      return NextResponse.json({ checkoutUrl });
    }

    if (action === "create-order") {
      const lineItems: CheckoutLineItem[] = items.map((item) => ({
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
      }));

      const order = await createPendingOrder({
        line_items: lineItems.map((item) => ({
          product_id: item.productId,
          variation_id: item.variationId,
          quantity: item.quantity,
        })),
      });

      const fallbackUrl = buildAddToCartCheckoutUrl(items);
      const paymentUrl =
        order.payment_url ||
        `${process.env.NEXT_PUBLIC_WORDPRESS_URL?.replace(/\/$/, "")}/checkout/order-pay/${order.id}/?pay_for_order=true&key=${order.order_key}`;

      return NextResponse.json({
        orderId: order.id,
        paymentUrl: paymentUrl || fallbackUrl,
        checkoutUrl: fallbackUrl,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cart request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST cart items with action: enrich | checkout-url | create-order",
  });
}
