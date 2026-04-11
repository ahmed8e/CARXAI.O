export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          created_at?: string
        }
      }
      vehicles: {
        Row: {
          id: string
          user_id: string
          make: string
          model: string
          year: number
          fuel_type: string | null
          engine_type: string | null
          gearbox: string | null
          mileage: number | null
          plate_number: string | null
          vin: string | null
          is_default: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          make: string
          model: string
          year: number
          fuel_type?: string | null
          engine_type?: string | null
          gearbox?: string | null
          mileage?: number | null
          plate_number?: string | null
          vin?: string | null
          is_default?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['vehicles']['Insert']>
      }
      ai_chats: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          user_message: string
          ai_response: string
          issue_name: string | null
          likely_cause: string | null
          urgency_level: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id?: string | null
          user_message: string
          ai_response: string
          issue_name?: string | null
          likely_cause?: string | null
          urgency_level?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_chats']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          email: string | null
          status: string
          plan_name: string
          billing_cycle: string | null
          starts_at: string | null
          ends_at: string | null
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email?: string | null
          status?: string
          plan_name?: string
          billing_cycle?: string | null
          starts_at?: string | null
          ends_at?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      ai_chat_attachments: {
        Row: {
          id: string
          chat_id: string
          user_id: string
          file_url: string
          file_type: string
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          user_id: string
          file_url: string
          file_type: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['ai_chat_attachments']['Insert']>
      }
      mechanic_searches: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          location_text: string | null
          selected_mechanic_name: string | null
          selected_mechanic_place_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id?: string | null
          location_text?: string | null
          selected_mechanic_name?: string | null
          selected_mechanic_place_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['mechanic_searches']['Insert']>
      }
      towing_requests: {
        Row: {
          id: string
          user_id: string
          vehicle_id: string | null
          location_text: string | null
          provider_name: string | null
          provider_place_id: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vehicle_id?: string | null
          location_text?: string | null
          provider_name?: string | null
          provider_place_id?: string | null
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['towing_requests']['Insert']>
      }
      saved_places: {
        Row: {
          id: string
          user_id: string
          place_type: string
          place_name: string
          place_id: string | null
          address: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          place_type: string
          place_name: string
          place_id?: string | null
          address?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['saved_places']['Insert']>
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          preferred_language: string
          notifications_enabled: boolean
          phone_number: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          preferred_language?: string
          notifications_enabled?: boolean
          phone_number?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>
      }
      service_providers_raw: {
        Row: {
          id: number
          Category: string | null
          Business_name: string | null
          Address: string | null
          City: string | null
          State: string | null
          PostalCode: string | null
          Country: string | null
          Phone: string | null
          Fax: string | null
          Website_url: string | null
          Email: string | null
          MapLink: string | null
          DetailsLink: string | null
          Rating: string | null
          Review: string | null
          image1: string | null
          Lat: string | null
          Long: string | null
          ClosingHour: string | null
          Facebookprofile: string | null
          Twitterprofile: string | null
          linkedinprofile: string | null
          instagramprofile: string | null
          BusinessDescription: string | null
          Working_hour: string | null
          created_at: string
        }
        Insert: {
          id?: number
          Category?: string | null
          Business_name?: string | null
          Address?: string | null
          City?: string | null
          State?: string | null
          PostalCode?: string | null
          Country?: string | null
          Phone?: string | null
          Fax?: string | null
          Website_url?: string | null
          Email?: string | null
          MapLink?: string | null
          DetailsLink?: string | null
          Rating?: string | null
          Review?: string | null
          image1?: string | null
          Lat?: string | null
          Long?: string | null
          ClosingHour?: string | null
          Facebookprofile?: string | null
          Twitterprofile?: string | null
          linkedinprofile?: string | null
          instagramprofile?: string | null
          BusinessDescription?: string | null
          Working_hour?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['service_providers_raw']['Insert']>
      }
      shared_reports: {
        Row: {
          id: string
          report_id: string | null
          token: string
          created_by: string
          vehicle_data: any
          diagnosis_data: any
          messages: any
          customer_data: any
          summary: string | null
          created_at: string
        }
        Insert: {
          id?: string
          report_id?: string | null
          token: string
          created_by: string
          vehicle_data: any
          diagnosis_data: any
          messages?: any
          customer_data?: any
          summary?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['shared_reports']['Insert']>
      }
      mechanic_leads: {
        Row: {
          id: string
          report_id: string | null
          shared_link_id: string | null
          contact_value: string
          contact_type: string
          source: string
          submitted_at: string
        }
        Insert: {
          id?: string
          report_id?: string | null
          shared_link_id?: string | null
          contact_value: string
          contact_type: string
          source?: string
          submitted_at?: string
        }
        Update: Partial<Database['public']['Tables']['mechanic_leads']['Insert']>
      }
    }
  }
}

// App types
export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  imageUrl?: string
  timestamp: Date
  issueData?: DiagnosticResult
}

export interface DiagnosticResult {
  // New Dashboard Analysis Fields
  dashboard_type?: 'warning_light' | 'text_message' | 'both' | 'unknown'
  warning_light_name?: string | null
  fault_message_text?: string | null
  normalized_issue?: string
  severity?: 'low' | 'medium' | 'high'
  can_drive: boolean
  confidence?: 'low' | 'medium' | 'high'
  used_vehicle_context?: boolean
  explanation: string
  next_step: string

  // Backward Compatibility / Legacy mapping
  issueName?: string
  likelyCause?: string
  driveWhy?: string
  urgencyLevel?: 'low' | 'medium' | 'high' | 'stop_driving'
  mechanicRecommended?: boolean
  towingRecommended?: boolean
  spokenSummary?: string
  readableText?: string
  fallbackReason?: string | null
  report_id?: string // Links to the ai_chats DB record
}

export interface NearbyPlace {
  id: string
  name: string
  address: string
  rating: number
  userRatingsTotal: number
  isOpen: boolean
  distance?: number
  phoneNumber?: string
  location: { lat: number; lng: number }
  types: string[]
  placeId: string
}

export interface TowingProvider {
  id: number
  name: string
  phone: string
  city: string
  address: string
  rating: number
  reviewCount: number
  lat: number | null
  lng: number | null
  imageUrl: string | null
  category: string
  description: string | null
  distance: number | null
}
