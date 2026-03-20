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
      abonnements: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string | null
          devise: string
          id: string
          mode_paiement: string | null
          montant: number
          plan: string
          reference_paiement: string | null
          statut: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          devise?: string
          id?: string
          mode_paiement?: string | null
          montant?: number
          plan?: string
          reference_paiement?: string | null
          statut?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          devise?: string
          id?: string
          mode_paiement?: string | null
          montant?: number
          plan?: string
          reference_paiement?: string | null
          statut?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "nexora_users"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          access_code_hash: string
          avatar_url: string | null
          created_at: string | null
          email: string
          features: Json
          id: string
          is_active: boolean
          login_token: string | null
          nom: string
          theme_color: string
          updated_at: string | null
        }
        Insert: {
          access_code_hash?: string
          avatar_url?: string | null
          created_at?: string | null
          email: string
          features?: Json
          id?: string
          is_active?: boolean
          login_token?: string | null
          nom: string
          theme_color?: string
          updated_at?: string | null
        }
        Update: {
          access_code_hash?: string
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          features?: Json
          id?: string
          is_active?: boolean
          login_token?: string | null
          nom?: string
          theme_color?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
      entrees: {
        Row: {
          annee_num: number | null
          categorie: string
          created_at: string | null
          date_entree: string
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
          date_entree?: string
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
          date_entree?: string
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
      investissements: {
        Row: {
          created_at: string | null
          date_debut: string
          date_objectif: string | null
          description: string | null
          devise: string
          id: string
          montant_actuel: number
          montant_objectif: number
          nom: string
          statut: string
          type_investissement: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_debut?: string
          date_objectif?: string | null
          description?: string | null
          devise?: string
          id?: string
          montant_actuel?: number
          montant_objectif?: number
          nom: string
          statut?: string
          type_investissement?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_debut?: string
          date_objectif?: string | null
          description?: string | null
          devise?: string
          id?: string
          montant_actuel?: number
          montant_objectif?: number
          nom?: string
          statut?: string
          type_investissement?: string
          updated_at?: string | null
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
      nexora_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          is_admin_session: boolean
          session_token: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          is_admin_session?: boolean
          session_token: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          is_admin_session?: boolean
          session_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nexora_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "nexora_users"
            referencedColumns: ["id"]
          },
        ]
      }
      nexora_users: {
        Row: {
          avatar_url: string | null
          badge_premium: boolean
          created_at: string
          email: string
          id: string
          is_active: boolean
          is_admin: boolean
          nom_prenom: string
          password_hash: string
          plan: string
          remember_token: string | null
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          badge_premium?: boolean
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          nom_prenom: string
          password_hash: string
          plan?: string
          remember_token?: string | null
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          badge_premium?: boolean
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          nom_prenom?: string
          password_hash?: string
          plan?: string
          remember_token?: string | null
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      prets: {
        Row: {
          created_at: string | null
          date_echeance: string | null
          date_pret: string
          devise: string
          id: string
          montant: number
          montant_rembourse: number
          nom_personne: string
          nom_temoin: string | null
          note: string | null
          objectif: string
          signature_emprunteur: string | null
          signature_preteur: string | null
          signature_temoin: string | null
          statut: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          date_echeance?: string | null
          date_pret?: string
          devise?: string
          id?: string
          montant?: number
          montant_rembourse?: number
          nom_personne: string
          nom_temoin?: string | null
          note?: string | null
          objectif?: string
          signature_emprunteur?: string | null
          signature_preteur?: string | null
          signature_temoin?: string | null
          statut?: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          date_echeance?: string | null
          date_pret?: string
          devise?: string
          id?: string
          montant?: number
          montant_rembourse?: number
          nom_personne?: string
          nom_temoin?: string | null
          note?: string | null
          objectif?: string
          signature_emprunteur?: string | null
          signature_preteur?: string | null
          signature_temoin?: string | null
          statut?: string
          type?: string
          updated_at?: string | null
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
      remboursements: {
        Row: {
          created_at: string | null
          date_remboursement: string
          devise: string
          id: string
          montant: number
          note: string | null
          pret_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_remboursement?: string
          devise?: string
          id?: string
          montant?: number
          note?: string | null
          pret_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_remboursement?: string
          devise?: string
          id?: string
          montant?: number
          note?: string | null
          pret_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "remboursements_pret_id_fkey"
            columns: ["pret_id"]
            isOneToOne: false
            referencedRelation: "prets"
            referencedColumns: ["id"]
          },
        ]
      }
      versements_investissement: {
        Row: {
          created_at: string | null
          date_versement: string
          devise: string
          id: string
          investissement_id: string | null
          montant: number
          note: string | null
        }
        Insert: {
          created_at?: string | null
          date_versement?: string
          devise?: string
          id?: string
          investissement_id?: string | null
          montant?: number
          note?: string | null
        }
        Update: {
          created_at?: string | null
          date_versement?: string
          devise?: string
          id?: string
          investissement_id?: string | null
          montant?: number
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "versements_investissement_investissement_id_fkey"
            columns: ["investissement_id"]
            isOneToOne: false
            referencedRelation: "investissements"
            referencedColumns: ["id"]
          },
        ]
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
