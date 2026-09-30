export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line: string
          city: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          latitude: number | null
          longitude: number | null
          phone: string
          province: string
          recipient_name: string
          user_id: string
        }
        Insert: {
          address_line: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          latitude?: number | null
          longitude?: number | null
          phone: string
          province?: string
          recipient_name: string
          user_id: string
        }
        Update: {
          address_line?: string
          city?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          latitude?: number | null
          longitude?: number | null
          phone?: string
          province?: string
          recipient_name?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          image_url: string
          link_url: string | null
          position: string
          sort_order: number
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          position: string
          sort_order?: number
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          position?: string
          sort_order?: number
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      cart: {
        Row: {
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          cart_id: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          cart_id: string
          id?: string
          product_id: string
          quantity: number
        }
        Update: {
          cart_id?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "cart"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["product_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["product_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          min_order: number
          starts_at: string | null
          status: string
          usage_limit: number | null
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          min_order?: number
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
          used_count?: number
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          assigned_at: string | null
          delivered_at: string | null
          failure_reason: string | null
          id: string
          notes: string | null
          order_id: string
          staff_id: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          order_id: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          delivered_at?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          order_id?: string
          staff_id?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      branch_inventory: {
        Row: {
          branch_id: string
          current_stock: number
          last_updated: string
          low_stock_threshold: number
          product_id: string
          reserved_stock: number
        }
        Insert: {
          branch_id: string
          current_stock?: number
          last_updated?: string
          low_stock_threshold?: number
          product_id: string
          reserved_stock?: number
        }
        Update: {
          branch_id?: string
          current_stock?: number
          last_updated?: string
          low_stock_threshold?: number
          product_id?: string
          reserved_stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "branch_inventory_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          accepting_orders: boolean
          address: string
          city: string
          closing_time: string | null
          created_at: string
          cross_branch_fee: number
          delivery_available: boolean
          delivery_fee: number
          email: string | null
          estimated_delivery_minutes: number
          id: string
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          min_order: number
          name: string
          opening_time: string | null
          phone: string | null
          sort_order: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accepting_orders?: boolean
          address?: string
          city: string
          closing_time?: string | null
          created_at?: string
          cross_branch_fee?: number
          delivery_available?: boolean
          delivery_fee?: number
          email?: string | null
          estimated_delivery_minutes?: number
          id: string
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          min_order?: number
          name: string
          opening_time?: string | null
          phone?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accepting_orders?: boolean
          address?: string
          city?: string
          closing_time?: string | null
          created_at?: string
          cross_branch_fee?: number
          delivery_available?: boolean
          delivery_fee?: number
          email?: string | null
          estimated_delivery_minutes?: number
          id?: string
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          min_order?: number
          name?: string
          opening_time?: string | null
          phone?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
        ]
      }
      inventory: {
        Row: {
          current_stock: number
          last_updated: string
          low_stock_threshold: number
          product_id: string
          reserved_stock: number
        }
        Insert: {
          current_stock?: number
          last_updated?: string
          low_stock_threshold?: number
          product_id: string
          reserved_stock?: number
        }
        Update: {
          current_stock?: number
          last_updated?: string
          low_stock_threshold?: number
          product_id?: string
          reserved_stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_adjustments: {
        Row: {
          branch_id: string | null
          changed_by: string | null
          created_at: string
          id: string
          product_id: string
          quantity_delta: number
          reason: string
          reference: string | null
        }
        Insert: {
          branch_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          product_id: string
          quantity_delta: number
          reason: string
          reference?: string | null
        }
        Update: {
          branch_id?: string | null
          changed_by?: string | null
          created_at?: string
          id?: string
          product_id?: string
          quantity_delta?: number
          reason?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: { created_at: string; email: string; id: string; source: string; status: string }
        Insert: { created_at?: string; email: string; id?: string; source?: string; status?: string }
        Update: { created_at?: string; email?: string; id?: string; source?: string; status?: string }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          name: string
          offer_type: string
          product_id: string | null
          starts_at: string | null
          status: string
          usage_limit: number | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          ends_at?: string | null
          id?: string
          name: string
          offer_type: string
          product_id?: string | null
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          name?: string
          offer_type?: string
          product_id?: string | null
          starts_at?: string | null
          status?: string
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          line_total: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity: number
          sku?: string | null
          unit_price: number
        }
        Update: {
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cross_branch_fee: number
          branch_id: string
          address_id: string | null
          created_at: string
          delivery_fee: number
          delivery_instructions: string | null
          discount: number
          estimated_delivery_at: string | null
          id: string
          order_number: string
          payment_method: string
          platform_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cross_branch_fee?: number
          branch_id?: string
          address_id?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_instructions?: string | null
          discount?: number
          estimated_delivery_at?: string | null
          id?: string
          order_number: string
          payment_method: string
          platform_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cross_branch_fee?: number
          branch_id?: string
          address_id?: string | null
          created_at?: string
          delivery_fee?: number
          delivery_instructions?: string | null
          discount?: number
          estimated_delivery_at?: string | null
          id?: string
          order_number?: string
          payment_method?: string
          platform_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json
          order_id: string
          provider: string
          provider_transaction_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id: string
          provider: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          order_id?: string
          provider?: string
          provider_transaction_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          alt_text?: string | null
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bestseller: boolean
          brand: string | null
          category_id: string
          created_at: string
          description: string
          featured: boolean
          id: string
          name: string
          price: number
          sale_price: number | null
          sku: string
          slug: string
          specifications: Json
          status: Database["public"]["Enums"]["product_status"]
          unit: string
          updated_at: string
        }
        Insert: {
          bestseller?: boolean
          brand?: string | null
          category_id: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          name: string
          price: number
          sale_price?: number | null
          sku: string
          slug: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          unit?: string
          updated_at?: string
        }
        Update: {
          bestseller?: boolean
          brand?: string | null
          category_id?: string
          created_at?: string
          description?: string
          featured?: boolean
          id?: string
          name?: string
          price?: number
          sale_price?: number | null
          sku?: string
          slug?: string
          specifications?: Json
          status?: Database["public"]["Enums"]["product_status"]
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          preferred_branch_id: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          preferred_branch_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          preferred_branch_id?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string
          rating: number
          review: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id: string
          rating: number
          review: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string
          rating?: number
          review?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_preferred_branch_id_fkey"
            columns: ["preferred_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          address: string
          closing_time: string | null
          currency: string
          delivery_available: boolean
          delivery_fee: number | null
          delivery_radius_km: number | null
          email: string | null
          estimated_delivery_minutes: number | null
          id: string
          logo_url: string | null
          min_order: number | null
          opening_time: string | null
          phone: string | null
          store_name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address: string
          closing_time?: string | null
          currency?: string
          delivery_available?: boolean
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_delivery_minutes?: number | null
          id?: string
          logo_url?: string | null
          min_order?: number | null
          opening_time?: string | null
          phone?: string | null
          store_name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string
          closing_time?: string | null
          currency?: string
          delivery_available?: boolean
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_delivery_minutes?: number | null
          id?: string
          logo_url?: string | null
          min_order?: number | null
          opening_time?: string | null
          phone?: string | null
          store_name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      staff_branches: {
        Row: {
          branch_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          branch_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          branch_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_branches_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: { created_at: string; product_id: string; user_id: string }
        Insert: { created_at?: string; product_id: string; user_id: string }
        Update: { created_at?: string; product_id?: string; user_id?: string }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cancel_my_order: {
        Args: { p_order: string }
        Returns: undefined
      }
      place_cod_order: {
        Args: { p_address: Json; p_branch?: string; p_coupon?: string; p_items: Json }
        Returns: string
      }
    }
    Enums: {
      app_role:
        | "SUPER_ADMIN"
        | "MANAGER"
        | "ORDER_STAFF"
        | "INVENTORY_STAFF"
        | "DELIVERY_STAFF"
        | "CUSTOMER"
      delivery_status:
        | "PENDING"
        | "READY"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "FAILED"
      order_status:
        | "PENDING"
        | "CONFIRMED"
        | "PREPARING"
        | "READY_FOR_DELIVERY"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "CANCELLED"
        | "FAILED"
      payment_status:
        | "PENDING"
        | "PAID"
        | "FAILED"
        | "REFUNDED"
        | "PARTIAL_REFUND"
      product_status: "ACTIVE" | "INACTIVE" | "DRAFT"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "SUPER_ADMIN",
        "MANAGER",
        "ORDER_STAFF",
        "INVENTORY_STAFF",
        "DELIVERY_STAFF",
        "CUSTOMER",
      ],
      delivery_status: [
        "PENDING",
        "READY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
      ],
      order_status: [
        "PENDING",
        "CONFIRMED",
        "PREPARING",
        "READY_FOR_DELIVERY",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "CANCELLED",
        "FAILED",
      ],
      payment_status: [
        "PENDING",
        "PAID",
        "FAILED",
        "REFUNDED",
        "PARTIAL_REFUND",
      ],
      product_status: ["ACTIVE", "INACTIVE", "DRAFT"],
    },
  },
} as const
