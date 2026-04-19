// Auto-generated from Supabase - run `npx supabase gen types typescript` to update
// This file defines the database schema shared across all apps

export type User = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Session = {
  access_token: string
  refresh_token: string
  user: User
}

export type Purchase = {
  id: string
  user_id: string
  product_type: 'book' | 'service' | 'tool_export'
  product_id: string
  stripe_payment_id: string
  amount_cents: number
  currency: string
  status: 'pending' | 'completed' | 'refunded'
  created_at: string
}

export type SavedCalculation = {
  id: string
  user_id: string
  tool_slug: string // e.g. 'apr-calculator', 'mortgage-calculator'
  label: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type Favorite = {
  id: string
  user_id: string
  item_type: 'tool' | 'blog_post' | 'book'
  item_id: string
  created_at: string
}

export type FinancialModel = {
  id: string
  user_id: string
  name: string
  data: Record<string, unknown> // Full model JSON
  scenario: 'conservative' | 'base' | 'aggressive'
  is_template: boolean
  created_at: string
  updated_at: string
}

// Supabase Database type (extend as you run migrations)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id'>>
      }
      purchases: {
        Row: Purchase
        Insert: Omit<Purchase, 'id' | 'created_at'>
        Update: Partial<Omit<Purchase, 'id'>>
      }
      saved_calculations: {
        Row: SavedCalculation
        Insert: Omit<SavedCalculation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SavedCalculation, 'id'>>
      }
      favorites: {
        Row: Favorite
        Insert: Omit<Favorite, 'id' | 'created_at'>
        Update: never
      }
      financial_models: {
        Row: FinancialModel
        Insert: Omit<FinancialModel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FinancialModel, 'id'>>
      }
    }
  }
}
