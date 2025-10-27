
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: any }
  | any[]

export interface Database {
  public: {
    Tables: {
      ad_views: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          campaign_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          campaign_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_views_campaign_id_fkey"
            columns: ["campaign_id"]
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ad_views_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      campaigns: {
        Row: {
          ad_creative_url: string
          advertiser_id: string
          budget: number
          campaign_goal: "Brand Awareness" | "Lead Generation" | "Sales"
          category: string
          clicks: number
          company: Json
          created_at: string
          cta_text: string
          duration: number
          id: string
          impressions: number
          landing_page_url: string
          name: string
          reward: number
          rewarded_points: number | null
          status: "Active" | "Paused" | "Finished" | "Pending" | "Rejected" | "Uploading" | "Upload Failed"
          thumbnail_url: string | null
          type: "Video" | "Shortz"
          upload_error: string | null
        }
        Insert: {
          ad_creative_url: string
          advertiser_id: string
          budget: number
          campaign_goal: "Brand Awareness" | "Lead Generation" | "Sales"
          category: string
          clicks?: number
          company: Json
          created_at?: string
          cta_text: string
          duration: number
          id?: string
          impressions?: number
          landing_page_url: string
          name: string
          reward: number
          rewarded_points?: number | null
          status?: "Active" | "Paused" | "Finished" | "Pending" | "Rejected" | "Uploading" | "Upload Failed"
          thumbnail_url?: string | null
          type: "Video" | "Shortz"
          upload_error?: string | null
        }
        Update: {
          ad_creative_url?: string
          advertiser_id?: string
          budget?: number
          campaign_goal?: "Brand Awareness" | "Lead Generation" | "Sales"
          category?: string
          clicks?: number
          company?: Json
          created_at?: string
          cta_text?: string
          duration?: number
          id?: string
          impressions?: number
          landing_page_url?: string
          name?: string
          reward?: number
          rewarded_points?: number | null
          status?: "Active" | "Paused" | "Finished" | "Pending" | "Rejected" | "Uploading" | "Upload Failed"
          thumbnail_url?: string | null
          type?: "Video" | "Shortz"
          upload_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_advertiser_id_fkey"
            columns: ["advertiser_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          banner_url: string | null
          city: string | null
          country: string | null
          credit_balance: number | null
          email: string
          gender: string | null
          id: string
          logo_url: string | null
          reward_points: number | null
          role: "advertiser" | "viewer"
          state: string | null
          subscribers: number | null
          username: string
        }
        Insert: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          credit_balance?: number | null
          email: string
          gender?: string | null
          id: string
          logo_url?: string | null
          reward_points?: number | null
          role: "advertiser" | "viewer"
          state?: string | null
          subscribers?: number | null
          username: string
        }
        Update: {
          banner_url?: string | null
          city?: string | null
          country?: string | null
          credit_balance?: number | null
          email?: string
          gender?: string | null
          id?: string
          logo_url?: string | null
          reward_points?: number | null
          role?: "advertiser" | "viewer"
          state?: string | null
          subscribers?: number | null
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_reward: {
        Args: {
          campaign_id_arg: string
        }
        Returns: undefined
      }
      get_audience_demographics: {
        Args: {}
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}