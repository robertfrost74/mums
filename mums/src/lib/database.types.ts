export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string;
          name: string;
          invite_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          invite_code?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          invite_code?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      family_members: {
        Row: {
          id: string;
          user_id: string;
          family_id: string;
          role: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          family_id: string;
          role?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          family_id?: string;
          role?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          family_id: string;
          title: string;
          description: string | null;
          instructions: string | null;
          category: string | null;
          image_url: string | null;
          source: string | null;
          servings: number | null;
          prep_time: number | null;
          cook_time: number | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_id: string;
          title: string;
          description?: string | null;
          instructions?: string | null;
          category?: string | null;
          image_url?: string | null;
          source?: string | null;
          servings?: number | null;
          prep_time?: number | null;
          cook_time?: number | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_id?: string;
          title?: string;
          description?: string | null;
          instructions?: string | null;
          category?: string | null;
          image_url?: string | null;
          source?: string | null;
          servings?: number | null;
          prep_time?: number | null;
          cook_time?: number | null;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient: string;
          amount: string | null;
          unit: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient: string;
          amount?: string | null;
          unit?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient?: string;
          amount?: string | null;
          unit?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_my_family_id: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
