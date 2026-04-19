// Book types
export interface Book {
  id: string;
  title: string;
  price: number;
  description: string;
  chapters: number;
  readTime: string;
}

// Service types
export interface Service {
  id: string;
  title: string;
  price: string;
  description: string;
  fullDescription: string;
  timeframe: string;
  deliverables: string[];
  ideal: string;
}

// Purchase types
export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productType: "book" | "service";
  amount: number;
  currency: string;
  stripeSessionId: string;
  status: "completed" | "pending" | "refunded";
  purchasedAt: string;
}

// Blog types
export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  featured: boolean;
}

// Stripe types
export interface CheckoutParams {
  productId: string;
  quantity?: number;
}
