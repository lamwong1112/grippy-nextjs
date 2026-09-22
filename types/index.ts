export type StockStatus = "instock" | "outofstock" | "onbackorder";

export interface ProductImage {
  id: number;
  src: string;
  alt: string;
  name: string;
}

export interface ProductCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface ProductAttribute {
  id: number;
  name: string;
  slug: string;
  position: number;
  visible: boolean;
  variation: boolean;
  options: string[];
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  permalink: string;
  type: "simple" | "variable" | "grouped" | "external" | string;
  status: string;
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: StockStatus;
  stock_quantity: number | null;
  average_rating: string;
  rating_count: number;
  categories: ProductCategoryRef[];
  images: ProductImage[];
  attributes: ProductAttribute[];
  default_attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
  variations: number[];
  featured: boolean;
  catalog_visibility: string;
  total_sales?: number;
  related_ids?: number[];
}

export interface ProductVariation {
  id: number;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  on_sale: boolean;
  purchasable: boolean;
  stock_status: StockStatus;
  stock_quantity: number | null;
  image: ProductImage | null;
  attributes: Array<{
    id: number;
    name: string;
    option: string;
  }>;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: ProductImage | null;
  menu_order: number;
  count: number;
}

export interface CartItem {
  productId: number;
  variationId?: number;
  name: string;
  slug: string;
  price: string;
  quantity: number;
  image?: string;
  attributes?: Record<string, string>;
  stockStatus?: StockStatus;
}

export interface WPPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt?: string;
  date?: string;
  modified?: string;
}

export interface WPMenuItem {
  id: string;
  label: string;
  url: string;
  path: string;
  parentId?: string | null;
  cssClasses?: string[];
}

export interface WPSiteSettings {
  title: string;
  description: string;
  url: string;
}

export interface ProductsQuery {
  page?: number;
  perPage?: number;
  category?: number | string;
  search?: string;
  orderby?: "date" | "id" | "title" | "slug" | "price" | "popularity" | "rating" | "menu_order";
  order?: "asc" | "desc";
  featured?: boolean;
  stockStatus?: StockStatus;
  include?: number[];
  slug?: string;
}

export interface CheckoutLineItem {
  productId: number;
  variationId?: number;
  quantity: number;
}
