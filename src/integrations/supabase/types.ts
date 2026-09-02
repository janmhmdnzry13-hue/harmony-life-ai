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
      ai_automations: {
        Row: {
          active: boolean
          agent_key: string
          created_at: string
          description: string | null
          id: string
          last_result: string | null
          last_run_at: string | null
          name: string
          schedule: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          agent_key: string
          created_at?: string
          description?: string | null
          id?: string
          last_result?: string | null
          last_run_at?: string | null
          name: string
          schedule?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          agent_key?: string
          created_at?: string
          description?: string | null
          id?: string
          last_result?: string | null
          last_run_at?: string | null
          name?: string
          schedule?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          action_label: string | null
          action_link: string | null
          body: string
          confidence: number
          created_at: string
          dismissed: boolean
          domain: string
          id: string
          kind: string
          severity: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_link?: string | null
          body: string
          confidence?: number
          created_at?: string
          dismissed?: boolean
          domain?: string
          id?: string
          kind?: string
          severity?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_link?: string | null
          body?: string
          confidence?: number
          created_at?: string
          dismissed?: boolean
          domain?: string
          id?: string
          kind?: string
          severity?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_memories: {
        Row: {
          content: string
          created_at: string
          id: string
          importance: number
          kind: string
          last_used_at: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          importance?: number
          kind?: string
          last_used_at?: string | null
          source?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          importance?: number
          kind?: string
          last_used_at?: string | null
          source?: string
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
      books: {
        Row: {
          author: string | null
          created_at: string
          current_page: number | null
          finished_on: string | null
          id: string
          notes: string | null
          pages: number | null
          rating: number | null
          started_on: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          current_page?: number | null
          finished_on?: string | null
          id?: string
          notes?: string | null
          pages?: number | null
          rating?: number | null
          started_on?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          created_at?: string
          current_page?: number | null
          finished_on?: string | null
          id?: string
          notes?: string | null
          pages?: number | null
          rating?: number | null
          started_on?: string | null
          status?: string
          title?: string
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
      communication_reminders: {
        Row: {
          cadence_days: number
          contact_id: string
          created_at: string
          id: string
          last_contacted_on: string | null
          next_due_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cadence_days?: number
          contact_id: string
          created_at?: string
          id?: string
          last_contacted_on?: string | null
          next_due_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cadence_days?: number
          contact_id?: string
          created_at?: string
          id?: string
          last_contacted_on?: string | null
          next_due_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_reminders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          avatar_url: string | null
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          relation: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          relation?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          relation?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          progress_pct: number
          provider: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_pct?: number
          provider?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_pct?: number
          provider?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
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
      documents: {
        Row: {
          category: string
          created_at: string
          expires_on: string | null
          file_path: string | null
          id: string
          mime: string | null
          notes: string | null
          ocr_text: string | null
          size: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          mime?: string | null
          notes?: string | null
          ocr_text?: string | null
          size?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          expires_on?: string | null
          file_path?: string | null
          id?: string
          mime?: string | null
          notes?: string | null
          ocr_text?: string | null
          size?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      flashcard_decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          back: string
          created_at: string
          deck_id: string
          due_on: string
          ease: number
          front: string
          id: string
          interval_days: number
          reps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          back: string
          created_at?: string
          deck_id: string
          due_on?: string
          ease?: number
          front: string
          id?: string
          interval_days?: number
          reps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          back?: string
          created_at?: string
          deck_id?: string
          due_on?: string
          ease?: number
          front?: string
          id?: string
          interval_days?: number
          reps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "flashcard_decks"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_ideas: {
        Row: {
          budget: number | null
          contact_id: string | null
          created_at: string
          id: string
          notes: string | null
          occasion: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occasion?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          contact_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          occasion?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_ideas_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
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
      gratitude_entries: {
        Row: {
          created_at: string
          entries: string[]
          id: string
          log_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entries?: string[]
          id?: string
          log_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entries?: string[]
          id?: string
          log_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      learn_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          links: string[]
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          links?: string[]
          tags?: string[]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          links?: string[]
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      learning_goals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          progress_pct: number
          target_date: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_pct?: number
          target_date?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          progress_pct?: number
          target_date?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_scores: {
        Row: {
          breakdown: Json
          burnout_risk: number
          created_at: string
          finance_score: number
          happiness_score: number
          health_score: number
          id: string
          life_score: number
          productivity_score: number
          score_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          breakdown?: Json
          burnout_risk?: number
          created_at?: string
          finance_score?: number
          happiness_score?: number
          health_score?: number
          id?: string
          life_score?: number
          productivity_score?: number
          score_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          breakdown?: Json
          burnout_risk?: number
          created_at?: string
          finance_score?: number
          happiness_score?: number
          health_score?: number
          id?: string
          life_score?: number
          productivity_score?: number
          score_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      meetings: {
        Row: {
          agenda: string | null
          attendees: string[] | null
          created_at: string
          ends_at: string | null
          id: string
          location: string | null
          notes: string | null
          starts_at: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agenda?: string | null
          attendees?: string[] | null
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agenda?: string | null
          attendees?: string[] | null
          created_at?: string
          ends_at?: string | null
          id?: string
          location?: string | null
          notes?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mood_logs: {
        Row: {
          created_at: string
          energy: number | null
          id: string
          logged_at: string
          mood: number
          notes: string | null
          tags: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          energy?: number | null
          id?: string
          logged_at?: string
          mood: number
          notes?: string | null
          tags?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          energy?: number | null
          id?: string
          logged_at?: string
          mood?: number
          notes?: string | null
          tags?: string[] | null
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
      nutrition_logs: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          id: string
          log_date: string
          meal: string
          name: string
          protein: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          log_date: string
          meal: string
          name: string
          protein?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          id?: string
          log_date?: string
          meal?: string
          name?: string
          protein?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      packing_items: {
        Row: {
          created_at: string
          id: string
          label: string
          packed: boolean
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          packed?: boolean
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          packed?: boolean
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "packing_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
      project_cards: {
        Row: {
          assignees: string[] | null
          column_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          position: number
          project_id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignees?: string[] | null
          column_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignees?: string[] | null
          column_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          position?: number
          project_id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_cards_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "project_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_cards_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_columns: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_columns_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_deps: {
        Row: {
          card_id: string
          created_at: string
          depends_on_card_id: string
          id: string
          user_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          depends_on_card_id: string
          id?: string
          user_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          depends_on_card_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_deps_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "project_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deps_depends_on_card_id_fkey"
            columns: ["depends_on_card_id"]
            isOneToOne: false
            referencedRelation: "project_cards"
            referencedColumns: ["id"]
          },
        ]
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
      reading_sessions: {
        Row: {
          book_id: string | null
          created_at: string
          id: string
          log_date: string
          minutes: number
          notes: string | null
          pages: number
          user_id: string
        }
        Insert: {
          book_id?: string | null
          created_at?: string
          id?: string
          log_date: string
          minutes?: number
          notes?: string | null
          pages?: number
          user_id: string
        }
        Update: {
          book_id?: string | null
          created_at?: string
          id?: string
          log_date?: string
          minutes?: number
          notes?: string | null
          pages?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_sessions_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
        ]
      }
      reflection_entries: {
        Row: {
          body: string
          created_at: string
          id: string
          log_date: string
          prompt: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          log_date: string
          prompt?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          log_date?: string
          prompt?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body_md: string
          created_at: string
          highlights: string[] | null
          id: string
          kind: string
          period_end: string
          period_start: string
          suggestions: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_md: string
          created_at?: string
          highlights?: string[] | null
          id?: string
          kind: string
          period_end: string
          period_start: string
          suggestions?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_md?: string
          created_at?: string
          highlights?: string[] | null
          id?: string
          kind?: string
          period_end?: string
          period_start?: string
          suggestions?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_logs: {
        Row: {
          completed_steps: number[]
          created_at: string
          id: string
          log_date: string
          routine_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: number[]
          created_at?: string
          id?: string
          log_date: string
          routine_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: number[]
          created_at?: string
          id?: string
          log_date?: string
          routine_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_logs_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          active: boolean
          created_at: string
          id: string
          kind: string
          name: string
          steps: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          kind: string
          name: string
          steps?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          kind?: string
          name?: string
          steps?: string[]
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
      sleep_logs: {
        Row: {
          bedtime: string | null
          created_at: string
          duration_min: number | null
          id: string
          log_date: string
          notes: string | null
          quality: number | null
          updated_at: string
          user_id: string
          wake_time: string | null
        }
        Insert: {
          bedtime?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          log_date: string
          notes?: string | null
          quality?: number | null
          updated_at?: string
          user_id: string
          wake_time?: string | null
        }
        Update: {
          bedtime?: string | null
          created_at?: string
          duration_min?: number | null
          id?: string
          log_date?: string
          notes?: string | null
          quality?: number | null
          updated_at?: string
          user_id?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      step_logs: {
        Row: {
          created_at: string
          distance_km: number | null
          id: string
          log_date: string
          steps: number
          user_id: string
        }
        Insert: {
          created_at?: string
          distance_km?: number | null
          id?: string
          log_date: string
          steps: number
          user_id: string
        }
        Update: {
          created_at?: string
          distance_km?: number | null
          id?: string
          log_date?: string
          steps?: number
          user_id?: string
        }
        Relationships: []
      }
      stress_logs: {
        Row: {
          created_at: string
          id: string
          level: number
          logged_at: string
          notes: string | null
          triggers: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          logged_at?: string
          notes?: string | null
          triggers?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          logged_at?: string
          notes?: string | null
          triggers?: string[] | null
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
      time_blocks: {
        Row: {
          category: string | null
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      travel_journal: {
        Row: {
          body: string | null
          created_at: string
          entry_date: string
          id: string
          photos: string[] | null
          title: string | null
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entry_date: string
          id?: string
          photos?: string[] | null
          title?: string | null
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          photos?: string[] | null
          title?: string | null
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "travel_journal_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_items: {
        Row: {
          cost: number | null
          created_at: string
          ends_at: string | null
          id: string
          kind: string
          notes: string | null
          starts_at: string | null
          title: string
          trip_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          starts_at?: string | null
          title: string
          trip_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          ends_at?: string | null
          id?: string
          kind?: string
          notes?: string | null
          starts_at?: string | null
          title?: string
          trip_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_items_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          budget: number | null
          cover_url: string | null
          created_at: string
          destination: string | null
          ends_on: string | null
          id: string
          notes: string | null
          starts_on: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          cover_url?: string | null
          created_at?: string
          destination?: string | null
          ends_on?: string | null
          id?: string
          notes?: string | null
          starts_on?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          cover_url?: string | null
          created_at?: string
          destination?: string | null
          ends_on?: string | null
          id?: string
          notes?: string | null
          starts_on?: string | null
          title?: string
          updated_at?: string
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
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          log_date: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          log_date: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          log_date?: string
          user_id?: string
        }
        Relationships: []
      }
      weight_logs: {
        Row: {
          body_fat_pct: number | null
          created_at: string
          id: string
          log_date: string
          notes: string | null
          user_id: string
          weight_kg: number
        }
        Insert: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          log_date: string
          notes?: string | null
          user_id: string
          weight_kg: number
        }
        Update: {
          body_fat_pct?: number | null
          created_at?: string
          id?: string
          log_date?: string
          notes?: string | null
          user_id?: string
          weight_kg?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories: number | null
          created_at: string
          duration_min: number | null
          exercises: Json | null
          id: string
          intensity: string | null
          log_date: string
          notes: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          calories?: number | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json | null
          id?: string
          intensity?: string | null
          log_date: string
          notes?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          calories?: number | null
          created_at?: string
          duration_min?: number | null
          exercises?: Json | null
          id?: string
          intensity?: string | null
          log_date?: string
          notes?: string | null
          type?: string
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
    Enums: {},
  },
} as const
