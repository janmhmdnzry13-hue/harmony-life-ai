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
      accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          name: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          name: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      bills: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          cycle: string
          id: string
          is_active: boolean
          name: string
          next_due: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          is_active?: boolean
          name: string
          next_due: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          cycle?: string
          id?: string
          is_active?: boolean
          name?: string
          next_due?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      brain_dumps: {
        Row: {
          content: string
          created_at: string
          id: string
          processed: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          processed?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          processed?: boolean
          user_id?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          id: string
          month: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          currency?: string
          id?: string
          month: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          id?: string
          month?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dividends: {
        Row: {
          amount: number
          created_at: string
          currency: string
          holding_id: string | null
          id: string
          note: string | null
          paid_on: string
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          holding_id?: string | null
          id?: string
          note?: string | null
          paid_on?: string
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          holding_id?: string | null
          id?: string
          note?: string | null
          paid_on?: string
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dividends_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          location: string | null
          notes: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          progress: number
          project_id: string | null
          status: string
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          project_id?: string | null
          status?: string
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          progress?: number
          project_id?: string | null
          status?: string
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_logs: {
        Row: {
          count: number
          created_at: string
          habit_id: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          count?: number
          created_at?: string
          habit_id: string
          id?: string
          log_date: string
          user_id: string
        }
        Update: {
          count?: number
          created_at?: string
          habit_id?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_logs_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          color: string
          created_at: string
          description: string | null
          expires_on: string | null
          id: string
          name: string
          target_per_day: number
          user_id: string
        }
        Insert: {
          archived?: boolean
          color?: string
          created_at?: string
          description?: string | null
          expires_on?: string | null
          id?: string
          name: string
          target_per_day?: number
          user_id: string
        }
        Update: {
          archived?: boolean
          color?: string
          created_at?: string
          description?: string | null
          expires_on?: string | null
          id?: string
          name?: string
          target_per_day?: number
          user_id?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          account_id: string | null
          asset_type: string
          avg_cost: number
          created_at: string
          currency: string
          current_price: number | null
          id: string
          name: string | null
          notes: string | null
          price_updated_at: string | null
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          asset_type?: string
          avg_cost?: number
          created_at?: string
          currency?: string
          current_price?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          price_updated_at?: string | null
          quantity?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          asset_type?: string
          avg_cost?: number
          created_at?: string
          currency?: string
          current_price?: number | null
          id?: string
          name?: string | null
          notes?: string | null
          price_updated_at?: string | null
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          gratitude: string | null
          id: string
          mood: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          gratitude?: string | null
          id?: string
          mood?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          gratitude?: string | null
          id?: string
          mood?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          pinned: boolean
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      price_cache: {
        Row: {
          asset_type: string
          currency: string
          id: string
          meta: Json | null
          price: number
          symbol: string
          updated_at: string
        }
        Insert: {
          asset_type: string
          currency?: string
          id?: string
          meta?: Json | null
          price: number
          symbol: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          currency?: string
          id?: string
          meta?: Json | null
          price?: number
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          energy_level: number | null
          id: string
          mood: string | null
          mood_updated_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          energy_level?: number | null
          id: string
          mood?: string | null
          mood_updated_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          energy_level?: number | null
          id?: string
          mood?: string | null
          mood_updated_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_goals: {
        Row: {
          category: string
          created_at: string
          currency: string
          current_amount: number
          deadline: string | null
          id: string
          name: string
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name: string
          target_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          current_amount?: number
          deadline?: string | null
          id?: string
          name?: string
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          due_date: string | null
          expires_on: string | null
          goal_id: string | null
          id: string
          notes: string | null
          priority: string
          project_id: string | null
          tag: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          expires_on?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          tag?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          due_date?: string | null
          expires_on?: string | null
          goal_id?: string | null
          id?: string
          notes?: string | null
          priority?: string
          project_id?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          asset_type: string
          closed_at: string | null
          created_at: string
          currency: string
          entry_price: number
          exit_price: number | null
          id: string
          mistakes: string[]
          notes: string | null
          opened_at: string
          pnl: number | null
          quantity: number
          r_multiple: number | null
          rating: number | null
          setup: string | null
          side: string
          stop_price: number | null
          symbol: string
          target_price: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type?: string
          closed_at?: string | null
          created_at?: string
          currency?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          mistakes?: string[]
          notes?: string | null
          opened_at?: string
          pnl?: number | null
          quantity?: number
          r_multiple?: number | null
          rating?: number | null
          setup?: string | null
          side?: string
          stop_price?: number | null
          symbol: string
          target_price?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          closed_at?: string | null
          created_at?: string
          currency?: string
          entry_price?: number
          exit_price?: number | null
          id?: string
          mistakes?: string[]
          notes?: string | null
          opened_at?: string
          pnl?: number | null
          quantity?: number
          r_multiple?: number | null
          rating?: number | null
          setup?: string | null
          side?: string
          stop_price?: number | null
          symbol?: string
          target_price?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string
          created_at: string
          currency: string
          id: string
          note: string | null
          occurred_on: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          occurred_on?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          currency?: string
          id?: string
          note?: string | null
          occurred_on?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_summary_time: string
          notification_prefs: Json
          theme: string
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_summary_time?: string
          notification_prefs?: Json
          theme?: string
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_summary_time?: string
          notification_prefs?: Json
          theme?: string
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
