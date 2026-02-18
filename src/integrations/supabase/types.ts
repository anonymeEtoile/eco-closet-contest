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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contest_photos: {
        Row: {
          banned: boolean
          created_at: string
          description: string | null
          id: string
          photo_url: string
          refus_motif: string | null
          status: Database["public"]["Enums"]["photo_status"]
          titre: string
          user_id: string
        }
        Insert: {
          banned?: boolean
          created_at?: string
          description?: string | null
          id?: string
          photo_url: string
          refus_motif?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          titre: string
          user_id: string
        }
        Update: {
          banned?: boolean
          created_at?: string
          description?: string | null
          id?: string
          photo_url?: string
          refus_motif?: string | null
          status?: Database["public"]["Enums"]["photo_status"]
          titre?: string
          user_id?: string
        }
        Relationships: []
      }
      contest_settings: {
        Row: {
          classement_public: boolean
          date_limite: string | null
          description: string
          id: string
          recompenses: string | null
          theme: string
          titre: string
          updated_at: string
          votes_actifs: boolean
        }
        Insert: {
          classement_public?: boolean
          date_limite?: string | null
          description?: string
          id?: string
          recompenses?: string | null
          theme?: string
          titre?: string
          updated_at?: string
          votes_actifs?: boolean
        }
        Update: {
          classement_public?: boolean
          date_limite?: string | null
          description?: string
          id?: string
          recompenses?: string | null
          theme?: string
          titre?: string
          updated_at?: string
          votes_actifs?: boolean
        }
        Relationships: []
      }
      contest_votes: {
        Row: {
          created_at: string
          id: string
          photo_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          photo_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          photo_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_votes_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "contest_photos"
            referencedColumns: ["id"]
          },
        ]
      }
      event_settings: {
        Row: {
          id: string
          instructions_remise: string
          lieux_depot: string[]
          point_collecte_date: string | null
          presentation_text: string
          semaine_collecte_end: string | null
          semaine_collecte_start: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          instructions_remise?: string
          lieux_depot?: string[]
          point_collecte_date?: string | null
          presentation_text?: string
          semaine_collecte_end?: string | null
          semaine_collecte_start?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          instructions_remise?: string
          lieux_depot?: string[]
          point_collecte_date?: string | null
          presentation_text?: string
          semaine_collecte_end?: string | null
          semaine_collecte_start?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          categorie: string | null
          created_at: string
          description: string | null
          etat: string | null
          id: string
          marque: string | null
          photos: string[]
          price: number | null
          refus_motif: string | null
          seller_id: string
          status: Database["public"]["Enums"]["listing_status"]
          taille: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          categorie?: string | null
          created_at?: string
          description?: string | null
          etat?: string | null
          id?: string
          marque?: string | null
          photos?: string[]
          price?: number | null
          refus_motif?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["listing_status"]
          taille?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          categorie?: string | null
          created_at?: string
          description?: string | null
          etat?: string | null
          id?: string
          marque?: string | null
          photos?: string[]
          price?: number | null
          refus_motif?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["listing_status"]
          taille?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          classe: string
          created_at: string
          email: string
          id: string
          nom: string
          prenom: string
          suspended: boolean
          updated_at: string
        }
        Insert: {
          classe: string
          created_at?: string
          email: string
          id: string
          nom: string
          prenom: string
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          classe?: string
          created_at?: string
          email?: string
          id?: string
          nom?: string
          prenom?: string
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          listing_id: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          listing_id: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          listing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: true
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "eleve" | "moderateur" | "super_admin"
      listing_status:
        | "brouillon"
        | "en_attente"
        | "en_ligne"
        | "reserve"
        | "termine"
      photo_status: "en_attente" | "validee" | "refusee"
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
      app_role: ["eleve", "moderateur", "super_admin"],
      listing_status: [
        "brouillon",
        "en_attente",
        "en_ligne",
        "reserve",
        "termine",
      ],
      photo_status: ["en_attente", "validee", "refusee"],
    },
  },
} as const
