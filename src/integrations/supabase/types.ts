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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string | null
          icone: string | null
          id: string
          nom: string
        }
        Insert: {
          created_at?: string | null
          icone?: string | null
          id?: string
          nom: string
        }
        Update: {
          created_at?: string | null
          icone?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      coffre_fort: {
        Row: {
          created_at: string | null
          email_identifiant: string | null
          id: string
          mot_de_passe_visible: string | null
          nom: string
          note: string | null
          ordre: number | null
          site_url: string | null
          telephone: string | null
          type_entree: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_identifiant?: string | null
          id?: string
          mot_de_passe_visible?: string | null
          nom: string
          note?: string | null
          ordre?: number | null
          site_url?: string | null
          telephone?: string | null
          type_entree?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_identifiant?: string | null
          id?: string
          mot_de_passe_visible?: string | null
          nom?: string
          note?: string | null
          ordre?: number | null
          site_url?: string | null
          telephone?: string | null
          type_entree?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      commandes: {
        Row: {
          acheteur_id: string | null
          created_at: string | null
          id: string
          kkiapay_id: string | null
          montant: number
          produit_id: string | null
          statut: string | null
        }
        Insert: {
          acheteur_id?: string | null
          created_at?: string | null
          id?: string
          kkiapay_id?: string | null
          montant: number
          produit_id?: string | null
          statut?: string | null
        }
        Update: {
          acheteur_id?: string | null
          created_at?: string | null
          id?: string
          kkiapay_id?: string | null
          montant?: number
          produit_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commandes_produit_id_fkey"
            columns: ["produit_id"]
            isOneToOne: false
            referencedRelation: "produits"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          annee_num: number | null
          categorie: string
          created_at: string | null
          date_depense: string
          devise: string
          id: string
          mois_num: number | null
          montant: number
          note: string | null
          semaine_num: number | null
          titre: string
        }
        Insert: {
          annee_num?: number | null
          categorie?: string
          created_at?: string | null
          date_depense?: string
          devise?: string
          id?: string
          mois_num?: number | null
          montant?: number
          note?: string | null
          semaine_num?: number | null
          titre: string
        }
        Update: {
          annee_num?: number | null
          categorie?: string
          created_at?: string | null
          date_depense?: string
          devise?: string
          id?: string
          mois_num?: number | null
          montant?: number
          note?: string | null
          semaine_num?: number | null
          titre?: string
        }
        Relationships: []
      }
      liens_contacts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          ordre: number | null
          type_entree: string
          valeur: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          ordre?: number | null
          type_entree?: string
          valeur: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          ordre?: number | null
          type_entree?: string
          valeur?: string
        }
        Relationships: []
      }
      medias: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          nom: string
          taille_bytes: number | null
          type_media: string
          url: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom: string
          taille_bytes?: number | null
          type_media?: string
          url: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          nom?: string
          taille_bytes?: number | null
          type_media?: string
          url?: string
        }
        Relationships: []
      }
      produits: {
        Row: {
          categorie_id: string | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          nom: string
          prix: number
          stock: number | null
          vendeur_id: string | null
        }
        Insert: {
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          nom: string
          prix: number
          stock?: number | null
          vendeur_id?: string | null
        }
        Update: {
          categorie_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          nom?: string
          prix?: number
          stock?: number | null
          vendeur_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "produits_categorie_id_fkey"
            columns: ["categorie_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_code_hash: string
          avatar_url: string | null
          created_at: string | null
          email: string
          id: string
          nom: string
          updated_at: string | null
        }
        Insert: {
          access_code_hash?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nom?: string
          updated_at?: string | null
        }
        Update: {
          access_code_hash?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          id?: string
          nom?: string
          updated_at?: string | null
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
