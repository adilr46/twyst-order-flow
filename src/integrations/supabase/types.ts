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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      event_log: {
        Row: {
          actor: string | null
          id: string
          order_id: string | null
          payload: Json | null
          ts: string | null
          type: string | null
          venue_id: string | null
        }
        Insert: {
          actor?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          ts?: string | null
          type?: string | null
          venue_id?: string | null
        }
        Update: {
          actor?: string | null
          id?: string
          order_id?: string | null
          payload?: Json | null
          ts?: string | null
          type?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_log_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          price_cents: number
          venue_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          price_cents: number
          venue_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          price_cents?: number
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          item_id: string
          notes: string | null
          options_json: Json | null
          order_id: string
          qty: number
          unit_price_cents: number
        }
        Insert: {
          id?: string
          item_id: string
          notes?: string | null
          options_json?: Json | null
          order_id: string
          qty: number
          unit_price_cents: number
        }
        Update: {
          id?: string
          item_id?: string
          notes?: string | null
          options_json?: Json | null
          order_id?: string
          qty?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          id: string
          service_fee_bps: number | null
          session_id: string
          status: Database["public"]["Enums"]["order_status"] | null
          stripe_session_id: string | null
          subtotal_cents: number | null
          tax_cents: number | null
          tax_rate_bps: number | null
          total_cents: number | null
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          service_fee_bps?: number | null
          session_id: string
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_session_id?: string | null
          subtotal_cents?: number | null
          tax_cents?: number | null
          tax_rate_bps?: number | null
          total_cents?: number | null
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          service_fee_bps?: number | null
          session_id?: string
          status?: Database["public"]["Enums"]["order_status"] | null
          stripe_session_id?: string | null
          subtotal_cents?: number | null
          tax_cents?: number | null
          tax_rate_bps?: number | null
          total_cents?: number | null
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          closed_at: string | null
          id: string
          last_seen_at: string | null
          opened_at: string | null
          status: Database["public"]["Enums"]["session_status"] | null
          table_id: string
          updated_at: string | null
          venue_id: string
        }
        Insert: {
          closed_at?: string | null
          id?: string
          last_seen_at?: string | null
          opened_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          table_id: string
          updated_at?: string | null
          venue_id: string
        }
        Update: {
          closed_at?: string | null
          id?: string
          last_seen_at?: string | null
          opened_at?: string | null
          status?: Database["public"]["Enums"]["session_status"] | null
          table_id?: string
          updated_at?: string | null
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id: string
          last_attempt_at?: string | null
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      tables: {
        Row: {
          created_at: string | null
          id: string
          label: string
          nfc_uid: string | null
          token: string
          venue_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          label: string
          nfc_uid?: string | null
          token: string
          venue_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          label?: string
          nfc_uid?: string | null
          token?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string
          timezone: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          name: string
          owner_id?: string | null
          slug: string
          timezone?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string
          timezone?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_table_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      increment_stripe_event_attempts: {
        Args: { processed_count: number }
        Returns: undefined
      }
    }
    Enums: {
      order_status:
        | "created"
        | "paid"
        | "accepted"
        | "in_prep"
        | "served"
        | "cancelled"
      session_status: "open" | "closed"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      order_status: [
        "created",
        "paid",
        "accepted",
        "in_prep",
        "served",
        "cancelled",
      ],
      session_status: ["open", "closed"],
    },
  },
} as const
