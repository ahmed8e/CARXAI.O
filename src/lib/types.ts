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
  issueName: string
  likelyCause: string
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical'
  nextStep: string
  warning?: string
  followUp?: string
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

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical'
