export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug?: string | undefined;
  subcategory?: string | undefined;
  brand?: string | undefined;
  unit: string;
  price: number;
  oldPrice?: number | undefined;
  image: string;
  /** True when `image` is a product-type illustration rather than a photo of the product. */
  art?: boolean | undefined;
  /** No real photo yet: shown as a name tile. */
  noPhoto?: boolean | undefined;
  gallery?: string[] | undefined;
  discount?: number | undefined;
  stock: number;
  rating: number;
  reviews: number;
  featured?: boolean | undefined;
  isNew?: boolean | undefined;
  description: string;
};
export type CartLine = { product: Product; quantity: number };
export type OrderStatus = 'Pending' | 'Preparing' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
