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
      activity_logs: {
        Row: {
          activity_type: string
          amount: number | null
          created_at: string
          currency: string | null
          description: string
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          amount?: number | null
          created_at?: string
          currency?: string | null
          description?: string
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          ip_address: unknown | null
          sensitive_data_accessed: Json | null
          target_admin_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_admin_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_admin_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_notification_templates: {
        Row: {
          content_template: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          title_template: string
          type_id: string
          updated_at: string
        }
        Insert: {
          content_template: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          title_template: string
          type_id: string
          updated_at?: string
        }
        Update: {
          content_template?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          title_template?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_templates_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "admin_notification_types"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          severity: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          severity?: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          severity?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          admin_level: string | null
          created_at: string | null
          department: string | null
          display_name: string
          email: string
          employee_id: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          permissions: string[] | null
          phone_number: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_level?: string | null
          created_at?: string | null
          department?: string | null
          display_name: string
          email: string
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: string[] | null
          phone_number: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_level?: string | null
          created_at?: string | null
          department?: string | null
          display_name?: string
          email?: string
          employee_id?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          permissions?: string[] | null
          phone_number?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      challenge_rewards: {
        Row: {
          challenge_id: string
          created_at: string
          driver_challenge_id: string
          driver_id: string
          id: string
          reward_currency: string | null
          reward_type: string
          reward_value: number
          wallet_transaction_id: string | null
        }
        Insert: {
          challenge_id: string
          created_at?: string
          driver_challenge_id: string
          driver_id: string
          id?: string
          reward_currency?: string | null
          reward_type: string
          reward_value: number
          wallet_transaction_id?: string | null
        }
        Update: {
          challenge_id?: string
          created_at?: string
          driver_challenge_id?: string
          driver_id?: string
          id?: string
          reward_currency?: string | null
          reward_type?: string
          reward_value?: number
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_rewards_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_rewards_driver_challenge_id_fkey"
            columns: ["driver_challenge_id"]
            isOneToOne: false
            referencedRelation: "driver_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge_type: string
          created_at: string
          description: string
          end_date: string
          id: string
          is_active: boolean
          reward_currency: string | null
          reward_type: string
          reward_value: number
          start_date: string
          target_metric: string
          target_value: number
          title: string
          updated_at: string
        }
        Insert: {
          challenge_type: string
          created_at?: string
          description: string
          end_date: string
          id?: string
          is_active?: boolean
          reward_currency?: string | null
          reward_type: string
          reward_value?: number
          start_date?: string
          target_metric: string
          target_value: number
          title: string
          updated_at?: string
        }
        Update: {
          challenge_type?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean
          reward_currency?: string | null
          reward_type?: string
          reward_value?: number
          start_date?: string
          target_metric?: string
          target_value?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chauffeurs: {
        Row: {
          bank_account_number: string | null
          created_at: string | null
          delivery_capacity: string | null
          display_name: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          license_expiry: string | null
          license_number: string | null
          phone_number: string | null
          rating_average: number | null
          role: string | null
          service_areas: string[] | null
          total_rides: number | null
          updated_at: string | null
          user_id: string
          vehicle_color: string | null
          vehicle_model: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
          verification_status: string | null
        }
        Insert: {
          bank_account_number?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          phone_number?: string | null
          rating_average?: number | null
          role?: string | null
          service_areas?: string[] | null
          total_rides?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_status?: string | null
        }
        Update: {
          bank_account_number?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          phone_number?: string | null
          rating_average?: number | null
          role?: string | null
          service_areas?: string[] | null
          total_rides?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_color?: string | null
          vehicle_model?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          date_of_birth: string | null
          display_name: string
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          phone_number: string
          preferred_language: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name: string
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone_number: string
          preferred_language?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          display_name?: string
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone_number?: string
          preferred_language?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      commission_settings: {
        Row: {
          admin_rate: number
          created_at: string
          created_by: string | null
          driver_rate: number
          id: string
          is_active: boolean
          platform_rate: number
          service_type: string
          updated_at: string
        }
        Insert: {
          admin_rate?: number
          created_at?: string
          created_by?: string | null
          driver_rate?: number
          id?: string
          is_active?: boolean
          platform_rate?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          admin_rate?: number
          created_at?: string
          created_by?: string | null
          driver_rate?: number
          id?: string
          is_active?: boolean
          platform_rate?: number
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          last_message_at: string | null
          product_id: string
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id: string
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          product_id?: string
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency: string
          description: string
          driver_id: string
          id: string
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency?: string
          description: string
          driver_id: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency?: string
          description?: string
          driver_id?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      delivery_fees: {
        Row: {
          base_fee: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          service_type: string
          updated_at: string
        }
        Insert: {
          base_fee?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Update: {
          base_fee?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_location_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          assignment_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          assignment_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          assignment_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      delivery_orders: {
        Row: {
          actual_price: number | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_coordinates: Json | null
          delivery_location: string
          delivery_photo_url: string | null
          delivery_proof: Json | null
          delivery_time: string | null
          delivery_type: string
          driver_assigned_at: string | null
          driver_id: string | null
          driver_notes: string | null
          estimated_price: number | null
          id: string
          in_transit_at: string | null
          loading_assistance: boolean | null
          order_time: string
          package_type: string | null
          package_weight: number | null
          picked_up_at: string | null
          pickup_coordinates: Json | null
          pickup_location: string
          pickup_time: string | null
          recipient_signature: string | null
          status: string | null
          updated_at: string
          user_id: string
          vehicle_size: string | null
        }
        Insert: {
          actual_price?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_coordinates?: Json | null
          delivery_location: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location: string
          pickup_time?: string | null
          recipient_signature?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_size?: string | null
        }
        Update: {
          actual_price?: number | null
          cancelled_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_coordinates?: Json | null
          delivery_location?: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type?: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string
          pickup_time?: string | null
          recipient_signature?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_size?: string | null
        }
        Relationships: []
      }
      driver_challenges: {
        Row: {
          challenge_id: string
          completed_at: string | null
          created_at: string
          current_progress: number
          driver_id: string
          id: string
          is_completed: boolean
          reward_claimed: boolean
          reward_claimed_at: string | null
          updated_at: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          driver_id: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          updated_at?: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string | null
          created_at?: string
          current_progress?: number
          driver_id?: string
          id?: string
          is_completed?: boolean
          reward_claimed?: boolean
          reward_claimed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_challenges_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_codes: {
        Row: {
          code: string
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      driver_credits: {
        Row: {
          balance: number
          created_at: string
          currency: string
          driver_id: string
          id: string
          is_active: boolean
          last_topup_date: string | null
          low_balance_alert_sent: boolean
          total_earned: number
          total_spent: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          driver_id: string
          id?: string
          is_active?: boolean
          last_topup_date?: string | null
          low_balance_alert_sent?: boolean
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          last_topup_date?: string | null
          low_balance_alert_sent?: boolean
          total_earned?: number
          total_spent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_credits_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      driver_location_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          driver_id: string
          id: string
          ip_address: unknown | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          driver_id: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          driver_id?: string
          id?: string
          ip_address?: unknown | null
          user_agent?: string | null
        }
        Relationships: []
      }
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          is_available: boolean
          is_online: boolean
          is_verified: boolean | null
          last_ping: string
          latitude: number
          longitude: number
          minimum_balance: number | null
          speed: number | null
          updated_at: string
          vehicle_class: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          is_verified?: boolean | null
          last_ping?: string
          latitude: number
          longitude: number
          minimum_balance?: number | null
          speed?: number | null
          updated_at?: string
          vehicle_class?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          is_available?: boolean
          is_online?: boolean
          is_verified?: boolean | null
          last_ping?: string
          latitude?: number
          longitude?: number
          minimum_balance?: number | null
          speed?: number | null
          updated_at?: string
          vehicle_class?: string | null
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          created_at: string
          delivery_capacity: string | null
          documents: Json | null
          id: string
          insurance_expiry: string
          insurance_number: string
          is_active: boolean
          license_expiry: string
          license_number: string
          profile_photo_url: string | null
          rating_average: number | null
          rating_count: number | null
          service_type: string | null
          total_rides: number | null
          updated_at: string
          user_id: string
          vehicle_class: string
          vehicle_color: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo_url: string | null
          vehicle_plate: string
          vehicle_year: number
          verification_level: string
          verification_status: string
        }
        Insert: {
          created_at?: string
          delivery_capacity?: string | null
          documents?: Json | null
          id?: string
          insurance_expiry: string
          insurance_number: string
          is_active?: boolean
          license_expiry: string
          license_number: string
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vehicle_class?: string
          vehicle_color?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_photo_url?: string | null
          vehicle_plate: string
          vehicle_year: number
          verification_level?: string
          verification_status?: string
        }
        Update: {
          created_at?: string
          delivery_capacity?: string | null
          documents?: Json | null
          id?: string
          insurance_expiry?: string
          insurance_number?: string
          is_active?: boolean
          license_expiry?: string
          license_number?: string
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vehicle_class?: string
          vehicle_color?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_photo_url?: string | null
          vehicle_plate?: string
          vehicle_year?: number
          verification_level?: string
          verification_status?: string
        }
        Relationships: []
      }
      driver_queue: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          last_activity: string
          position_in_queue: number
          updated_at: string
          zone_id: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          last_activity?: string
          position_in_queue?: number
          updated_at?: string
          zone_id: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          last_activity?: string
          position_in_queue?: number
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_queue_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_requests: {
        Row: {
          approved_at: string | null
          created_at: string
          documents: Json | null
          id: string
          insurance_number: string
          license_expiry: string
          license_number: string
          partner_id: string | null
          rejected_reason: string | null
          service_type: string | null
          status: string
          updated_at: string
          user_id: string
          validated_by: string | null
          validation_comments: string | null
          validation_date: string | null
          validation_level: string | null
          vehicle_model: string
          vehicle_plate: string
          vehicle_type: string
          vehicle_year: number
        }
        Insert: {
          approved_at?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          insurance_number: string
          license_expiry: string
          license_number: string
          partner_id?: string | null
          rejected_reason?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id: string
          validated_by?: string | null
          validation_comments?: string | null
          validation_date?: string | null
          validation_level?: string | null
          vehicle_model: string
          vehicle_plate: string
          vehicle_type: string
          vehicle_year: number
        }
        Update: {
          approved_at?: string | null
          created_at?: string
          documents?: Json | null
          id?: string
          insurance_number?: string
          license_expiry?: string
          license_number?: string
          partner_id?: string | null
          rejected_reason?: string | null
          service_type?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          validated_by?: string | null
          validation_comments?: string | null
          validation_date?: string | null
          validation_level?: string | null
          vehicle_model?: string
          vehicle_plate?: string
          vehicle_type?: string
          vehicle_year?: number
        }
        Relationships: []
      }
      driver_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          driver_id: string
          end_date: string
          grace_period_end: string | null
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          payment_method: string
          plan_id: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          driver_id: string
          end_date: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method: string
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          driver_id?: string
          end_date?: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          payment_method?: string
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_zone_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          assignment_type: string
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_concurrent_requests: number | null
          metadata: Json | null
          priority_level: number | null
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_concurrent_requests?: number | null
          metadata?: Json | null
          priority_level?: number | null
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          assignment_type?: string
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_concurrent_requests?: number | null
          metadata?: Json | null
          priority_level?: number | null
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_zone_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_pricing: {
        Row: {
          available_drivers: number
          calculated_at: string
          demand_level: string
          id: string
          pending_requests: number
          surge_multiplier: number
          valid_until: string
          vehicle_class: string
          zone_id: string
        }
        Insert: {
          available_drivers?: number
          calculated_at?: string
          demand_level?: string
          id?: string
          pending_requests?: number
          surge_multiplier?: number
          valid_until?: string
          vehicle_class?: string
          zone_id: string
        }
        Update: {
          available_drivers?: number
          calculated_at?: string
          demand_level?: string
          id?: string
          pending_requests?: number
          surge_multiplier?: number
          valid_until?: string
          vehicle_class?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_pricing_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_function_performance: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number
          function_name: string
          id: string
          request_id: string | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms: number
          function_name: string
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          request_id?: string | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      enhanced_support_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      escrow_notifications: {
        Row: {
          created_at: string
          escrow_transaction_id: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          escrow_transaction_id: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          escrow_transaction_id?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_notifications_escrow_transaction_id_fkey"
            columns: ["escrow_transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_payments: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string
          currency: string
          held_at: string
          id: string
          order_id: string
          payment_method: string
          refunded_at: string | null
          released_at: string | null
          seller_id: string
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          order_id: string
          payment_method: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id: string
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string
          currency?: string
          held_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          refunded_at?: string | null
          released_at?: string | null
          seller_id?: string
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          buyer_id: string
          completed_at: string | null
          created_at: string
          currency: string
          dispute_reason: string | null
          driver_amount: number | null
          driver_id: string | null
          held_at: string
          id: string
          order_id: string
          platform_fee: number
          released_at: string | null
          seller_amount: number
          seller_id: string
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          dispute_reason?: string | null
          driver_amount?: number | null
          driver_id?: string | null
          held_at?: string
          id?: string
          order_id: string
          platform_fee: number
          released_at?: string | null
          seller_amount: number
          seller_id: string
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          dispute_reason?: string | null
          driver_amount?: number | null
          driver_id?: string | null
          held_at?: string
          id?: string
          order_id?: string
          platform_fee?: number
          released_at?: string | null
          seller_amount?: number
          seller_id?: string
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligent_places: {
        Row: {
          avenue: string | null
          category: string
          city: string
          commune: string | null
          created_at: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean | null
          is_verified: boolean | null
          latitude: number | null
          longitude: number | null
          metadata: Json | null
          name: string
          name_alternatives: string[] | null
          numero: string | null
          popularity_score: number | null
          quartier: string | null
          search_vector: unknown | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          avenue?: string | null
          category?: string
          city?: string
          commune?: string | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name: string
          name_alternatives?: string[] | null
          numero?: string | null
          popularity_score?: number | null
          quartier?: string | null
          search_vector?: unknown | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          avenue?: string | null
          category?: string
          city?: string
          commune?: string | null
          created_at?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean | null
          is_verified?: boolean | null
          latitude?: number | null
          longitude?: number | null
          metadata?: Json | null
          name?: string
          name_alternatives?: string[] | null
          numero?: string | null
          popularity_score?: number | null
          quartier?: string | null
          search_vector?: unknown | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lottery_draws: {
        Row: {
          created_at: string
          draw_algorithm: string
          draw_type: string
          drawn_at: string | null
          id: string
          max_winners: number
          min_tickets_required: number
          name: string
          prize_pool: Json | null
          scheduled_date: string
          status: string
          total_participants: number | null
          total_tickets_used: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          draw_algorithm?: string
          draw_type: string
          drawn_at?: string | null
          id?: string
          max_winners?: number
          min_tickets_required?: number
          name: string
          prize_pool?: Json | null
          scheduled_date: string
          status?: string
          total_participants?: number | null
          total_tickets_used?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          draw_algorithm?: string
          draw_type?: string
          drawn_at?: string | null
          id?: string
          max_winners?: number
          min_tickets_required?: number
          name?: string
          prize_pool?: Json | null
          scheduled_date?: string
          status?: string
          total_participants?: number | null
          total_tickets_used?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      lottery_entries: {
        Row: {
          claimed_at: string | null
          created_at: string
          draw_id: string
          entry_time: string
          id: string
          is_winner: boolean | null
          prize_won: Json | null
          ticket_ids: Json
          tickets_used: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          draw_id: string
          entry_time?: string
          id?: string
          is_winner?: boolean | null
          prize_won?: Json | null
          ticket_ids?: Json
          tickets_used?: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          draw_id?: string
          entry_time?: string
          id?: string
          is_winner?: boolean | null
          prize_won?: Json | null
          ticket_ids?: Json
          tickets_used?: number
          user_id?: string
        }
        Relationships: []
      }
      lottery_prize_types: {
        Row: {
          category: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      lottery_tickets: {
        Row: {
          created_at: string
          earned_date: string
          expires_at: string | null
          id: string
          multiplier: number | null
          source_id: string | null
          source_type: string
          status: string
          ticket_number: string
          used_at: string | null
          used_in_draw_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          earned_date?: string
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          source_id?: string | null
          source_type: string
          status?: string
          ticket_number: string
          used_at?: string | null
          used_in_draw_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          earned_date?: string
          expires_at?: string | null
          id?: string
          multiplier?: number | null
          source_id?: string | null
          source_type?: string
          status?: string
          ticket_number?: string
          used_at?: string | null
          used_in_draw_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lottery_wins: {
        Row: {
          claimed_at: string | null
          created_at: string
          currency: string
          draw_id: string
          entry_id: string
          expires_at: string | null
          id: string
          prize_details: Json
          prize_type_id: string | null
          prize_value: number
          status: string
          user_id: string
          wallet_transaction_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          currency?: string
          draw_id: string
          entry_id: string
          expires_at?: string | null
          id?: string
          prize_details: Json
          prize_type_id?: string | null
          prize_value: number
          status?: string
          user_id: string
          wallet_transaction_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          currency?: string
          draw_id?: string
          entry_id?: string
          expires_at?: string | null
          id?: string
          prize_details?: Json
          prize_type_id?: string | null
          prize_value?: number
          status?: string
          user_id?: string
          wallet_transaction_id?: string | null
        }
        Relationships: []
      }
      marketplace_delivery_assignments: {
        Row: {
          actual_delivery_time: string | null
          actual_pickup_time: string | null
          assignment_status: string
          created_at: string
          delivery_coordinates: Json | null
          delivery_fee: number | null
          delivery_location: string
          driver_id: string | null
          driver_notes: string | null
          estimated_delivery_time: string | null
          id: string
          order_id: string
          pickup_coordinates: Json | null
          pickup_location: string
          updated_at: string
        }
        Insert: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          assignment_status?: string
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id: string
          pickup_coordinates?: Json | null
          pickup_location: string
          updated_at?: string
        }
        Update: {
          actual_delivery_time?: string | null
          actual_pickup_time?: string | null
          assignment_status?: string
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_fee?: number | null
          delivery_location?: string
          driver_id?: string | null
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          order_id?: string
          pickup_coordinates?: Json | null
          pickup_location?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_orders: {
        Row: {
          assigned_to_driver_at: string | null
          buyer_id: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          customer_feedback: string | null
          customer_rating: number | null
          delivered_at: string | null
          delivery_address: string | null
          delivery_attempted_at: string | null
          delivery_coordinates: Json | null
          delivery_method: string
          driver_notes: string | null
          estimated_delivery_time: string | null
          id: string
          in_transit_at: string | null
          notes: string | null
          payment_status: string
          picked_up_by_driver_at: string | null
          pickup_coordinates: Json | null
          preparing_at: string | null
          product_id: string
          quantity: number
          ready_for_pickup_at: string | null
          revenue_status: string | null
          seller_id: string
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
          vendor_confirmation_status: string | null
          vendor_confirmed_at: string | null
          vendor_rejection_reason: string | null
        }
        Insert: {
          assigned_to_driver_at?: string | null
          buyer_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_attempted_at?: string | null
          delivery_coordinates?: Json | null
          delivery_method?: string
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          in_transit_at?: string | null
          notes?: string | null
          payment_status?: string
          picked_up_by_driver_at?: string | null
          pickup_coordinates?: Json | null
          preparing_at?: string | null
          product_id: string
          quantity?: number
          ready_for_pickup_at?: string | null
          revenue_status?: string | null
          seller_id: string
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string
          vendor_confirmation_status?: string | null
          vendor_confirmed_at?: string | null
          vendor_rejection_reason?: string | null
        }
        Update: {
          assigned_to_driver_at?: string | null
          buyer_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_attempted_at?: string | null
          delivery_coordinates?: Json | null
          delivery_method?: string
          driver_notes?: string | null
          estimated_delivery_time?: string | null
          id?: string
          in_transit_at?: string | null
          notes?: string | null
          payment_status?: string
          picked_up_by_driver_at?: string | null
          pickup_coordinates?: Json | null
          preparing_at?: string | null
          product_id?: string
          quantity?: number
          ready_for_pickup_at?: string | null
          revenue_status?: string | null
          seller_id?: string
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
          vendor_confirmation_status?: string | null
          vendor_confirmed_at?: string | null
          vendor_rejection_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category: string
          condition: string | null
          coordinates: Json | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          images: Json | null
          location: string | null
          moderation_status: string | null
          price: number
          seller_id: string
          status: string | null
          subcategory: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          condition?: string | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          location?: string | null
          moderation_status?: string | null
          price: number
          seller_id: string
          status?: string | null
          subcategory?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          condition?: string | null
          coordinates?: Json | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          location?: string | null
          moderation_status?: string | null
          price?: number
          seller_id?: string
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      merchant_accounts: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          pending_withdrawals: number
          total_earned: number
          total_withdrawn: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          pending_withdrawals?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          pending_withdrawals?: number
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      merchant_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency: string
          description: string
          id: string
          merchant_account_id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          vendor_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          merchant_account_id: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          vendor_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          merchant_account_id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          vendor_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_status: string | null
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_status?: string | null
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_status?: string | null
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          chat_notifications: boolean | null
          created_at: string
          id: string
          marketing_emails: boolean | null
          order_updates: boolean | null
          product_updates: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chat_notifications?: boolean | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          product_updates?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chat_notifications?: boolean | null
          created_at?: string
          id?: string
          marketing_emails?: boolean | null
          order_updates?: boolean | null
          product_updates?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      order_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          order_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          order_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "marketplace_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      partenaires: {
        Row: {
          address: string
          bank_account_number: string | null
          business_type: string
          city: string | null
          commission_rate: number | null
          company_name: string
          company_registration_number: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contract_end_date: string | null
          contract_start_date: string | null
          country: string | null
          created_at: string | null
          display_name: string
          email: string
          id: string
          is_active: boolean | null
          phone_number: string
          tax_number: string | null
          updated_at: string | null
          user_id: string
          verification_status: string | null
        }
        Insert: {
          address: string
          bank_account_number?: string | null
          business_type: string
          city?: string | null
          commission_rate?: number | null
          company_name: string
          company_registration_number?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_name: string
          email: string
          id?: string
          is_active?: boolean | null
          phone_number: string
          tax_number?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string | null
        }
        Update: {
          address?: string
          bank_account_number?: string | null
          business_type?: string
          city?: string | null
          commission_rate?: number | null
          company_name?: string
          company_registration_number?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          is_active?: boolean | null
          phone_number?: string
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      partner_commission_tracking: {
        Row: {
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at: string | null
          currency: string
          driver_id: string
          id: string
          partner_id: string
          service_type: string
          updated_at: string | null
        }
        Insert: {
          booking_amount: number
          booking_id: string
          commission_amount: number
          commission_rate: number
          created_at?: string | null
          currency?: string
          driver_id: string
          id?: string
          partner_id: string
          service_type: string
          updated_at?: string | null
        }
        Update: {
          booking_amount?: number
          booking_id?: string
          commission_amount?: number
          commission_rate?: number
          created_at?: string | null
          currency?: string
          driver_id?: string
          id?: string
          partner_id?: string
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      partner_drivers: {
        Row: {
          added_at: string
          commission_rate: number
          created_at: string
          driver_code: string
          driver_id: string
          id: string
          partner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          added_at?: string
          commission_rate?: number
          created_at?: string
          driver_code: string
          driver_id: string
          id?: string
          partner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          added_at?: string
          commission_rate?: number
          created_at?: string
          driver_code?: string
          driver_id?: string
          id?: string
          partner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          company_address: string | null
          company_name: string
          company_phone: string | null
          created_at: string
          id: string
          license_number: string | null
          rejection_reason: string | null
          tax_number: string | null
          updated_at: string
          user_id: string
          validated_at: string | null
          validated_by: string | null
          validation_status: string
        }
        Insert: {
          company_address?: string | null
          company_name: string
          company_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          rejection_reason?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string
        }
        Update: {
          company_address?: string | null
          company_name?: string
          company_phone?: string | null
          created_at?: string
          id?: string
          license_number?: string | null
          rejection_reason?: string | null
          tax_number?: string | null
          updated_at?: string
          user_id?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_status?: string
        }
        Relationships: []
      }
      partner_rental_subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string
          grace_period_end: string | null
          id: string
          last_payment_date: string | null
          next_payment_date: string | null
          partner_id: string
          payment_method: string | null
          plan_id: string
          start_date: string
          status: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          partner_id: string
          payment_method?: string | null
          plan_id: string
          start_date?: string
          status?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string
          grace_period_end?: string | null
          id?: string
          last_payment_date?: string | null
          next_payment_date?: string | null
          partner_id?: string
          payment_method?: string | null
          plan_id?: string
          start_date?: string
          status?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_rental_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "rental_subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_rental_subscriptions_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_taxi_vehicles: {
        Row: {
          assigned_driver_id: string | null
          brand: string
          color: string | null
          created_at: string
          id: string
          images: Json | null
          is_active: boolean
          is_available: boolean
          license_plate: string
          model: string
          moderation_status: string
          name: string
          partner_id: string
          rejection_reason: string | null
          seats: number
          updated_at: string
          vehicle_class: string
          year: number
        }
        Insert: {
          assigned_driver_id?: string | null
          brand: string
          color?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          license_plate: string
          model: string
          moderation_status?: string
          name: string
          partner_id: string
          rejection_reason?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: string
          year: number
        }
        Update: {
          assigned_driver_id?: string | null
          brand?: string
          color?: string | null
          created_at?: string
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          license_plate?: string
          model?: string
          moderation_status?: string
          name?: string
          partner_id?: string
          rejection_reason?: string | null
          seats?: number
          updated_at?: string
          vehicle_class?: string
          year?: number
        }
        Relationships: []
      }
      partner_withdrawals: {
        Row: {
          account_details: Json
          amount: number
          created_at: string | null
          currency: string
          id: string
          notes: string | null
          partner_id: string
          payment_method: string
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          account_details?: Json
          amount: number
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          partner_id: string
          payment_method: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          account_details?: Json
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          notes?: string | null
          partner_id?: string
          payment_method?: string
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payment_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          ip_address: unknown | null
          sensitive_data_accessed: Json | null
          target_payment_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_payment_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_payment_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_name: string | null
          account_number: string
          created_at: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          method_type: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name?: string | null
          account_number: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string | null
          account_number?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          method_type?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          currency: string | null
          delivery_id: string | null
          id: string
          payment_method: string
          payment_provider: string | null
          product_id: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          delivery_id?: string | null
          id?: string
          payment_method: string
          payment_provider?: string | null
          product_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          currency?: string | null
          delivery_id?: string | null
          id?: string
          payment_method?: string
          payment_provider?: string | null
          product_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "transport_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      places_database: {
        Row: {
          accuracy: number | null
          address_components: Json | null
          aliases: string[] | null
          category: string
          city: string
          commune: string | null
          country_code: string
          created_at: string
          district: string | null
          hierarchy_level: number | null
          id: string
          is_active: boolean
          is_popular: boolean
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          name_fr: string
          name_local: string | null
          opening_hours: Json | null
          parent_id: string | null
          phone_number: string | null
          place_type: string
          popularity_score: number | null
          search_keywords: string[] | null
          search_vector: unknown | null
          services: string[] | null
          updated_at: string
          website: string | null
        }
        Insert: {
          accuracy?: number | null
          address_components?: Json | null
          aliases?: string[] | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          name_fr: string
          name_local?: string | null
          opening_hours?: Json | null
          parent_id?: string | null
          phone_number?: string | null
          place_type?: string
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown | null
          services?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          accuracy?: number | null
          address_components?: Json | null
          aliases?: string[] | null
          category?: string
          city?: string
          commune?: string | null
          country_code?: string
          created_at?: string
          district?: string | null
          hierarchy_level?: number | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          name_fr?: string
          name_local?: string | null
          opening_hours?: Json | null
          parent_id?: string | null
          phone_number?: string | null
          place_type?: string
          popularity_score?: number | null
          search_keywords?: string[] | null
          search_vector?: unknown | null
          services?: string[] | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_database_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "places_database"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_rules: {
        Row: {
          base_price: number
          city: string
          created_at: string
          currency: string
          free_waiting_time_minutes: number | null
          id: string
          is_active: boolean
          max_waiting_time_minutes: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          service_type: string
          surge_multiplier: number
          updated_at: string
          vehicle_class: string
          waiting_fee_per_minute: number | null
        }
        Insert: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          free_waiting_time_minutes?: number | null
          id?: string
          is_active?: boolean
          max_waiting_time_minutes?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
          waiting_fee_per_minute?: number | null
        }
        Update: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          free_waiting_time_minutes?: number | null
          id?: string
          is_active?: boolean
          max_waiting_time_minutes?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
          waiting_fee_per_minute?: number | null
        }
        Relationships: []
      }
      product_moderation_logs: {
        Row: {
          action: string
          admin_notes: string | null
          changes_made: Json | null
          created_at: string
          id: string
          moderator_id: string
          new_status: string
          previous_status: string | null
          product_id: string
        }
        Insert: {
          action: string
          admin_notes?: string | null
          changes_made?: Json | null
          created_at?: string
          id?: string
          moderator_id: string
          new_status: string
          previous_status?: string | null
          product_id: string
        }
        Update: {
          action?: string
          admin_notes?: string | null
          changes_made?: Json | null
          created_at?: string
          id?: string
          moderator_id?: string
          new_status?: string
          previous_status?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_moderation_logs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          sensitive_data_accessed: Json | null
          target_user_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_user_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_user_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean | null
          last_seen: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean | null
          last_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          is_public?: boolean | null
          last_seen?: string | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
      }
      promotional_ads: {
        Row: {
          click_count: number | null
          created_at: string
          created_by: string | null
          cta_action: string
          cta_target: string | null
          cta_text: string
          description: string
          display_priority: number | null
          end_date: string | null
          id: string
          image_url: string | null
          impression_count: number | null
          is_active: boolean
          start_date: string
          target_user_types: string[] | null
          target_zones: Json | null
          title: string
          updated_at: string
        }
        Insert: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          cta_action: string
          cta_target?: string | null
          cta_text?: string
          description: string
          display_priority?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean
          start_date?: string
          target_user_types?: string[] | null
          target_zones?: Json | null
          title: string
          updated_at?: string
        }
        Update: {
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          cta_action?: string
          cta_target?: string | null
          cta_text?: string
          description?: string
          display_priority?: number | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impression_count?: number | null
          is_active?: boolean
          start_date?: string
          target_user_types?: string[] | null
          target_zones?: Json | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_messages: {
        Row: {
          audience_role: string | null
          audience_type: string
          body: string
          created_at: string
          data: Json | null
          error: string | null
          failure_count: number
          id: string
          sent_at: string | null
          sent_by: string
          status: string
          success_count: number
          target_user_ids: string[] | null
          title: string
        }
        Insert: {
          audience_role?: string | null
          audience_type: string
          body: string
          created_at?: string
          data?: Json | null
          error?: string | null
          failure_count?: number
          id?: string
          sent_at?: string | null
          sent_by: string
          status?: string
          success_count?: number
          target_user_ids?: string[] | null
          title: string
        }
        Update: {
          audience_role?: string | null
          audience_type?: string
          body?: string
          created_at?: string
          data?: Json | null
          error?: string | null
          failure_count?: number
          id?: string
          sent_at?: string | null
          sent_by?: string
          status?: string
          success_count?: number
          target_user_ids?: string[] | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_messages_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      push_notifications: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean
          message: string
          notification_type: string
          reference_id: string | null
          sent_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean
          message: string
          notification_type: string
          reference_id?: string | null
          sent_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean
          message?: string
          notification_type?: string
          reference_id?: string | null
          sent_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          app_type: string
          created_at: string
          device_id: string | null
          device_model: string | null
          id: string
          language: string | null
          last_seen_at: string | null
          notifications_enabled: boolean
          os_version: string | null
          platform: string
          timezone: string | null
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_type: string
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean
          os_version?: string | null
          platform: string
          timezone?: string | null
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_type?: string
          created_at?: string
          device_id?: string | null
          device_model?: string | null
          id?: string
          language?: string | null
          last_seen_at?: string | null
          notifications_enabled?: boolean
          os_version?: string | null
          platform?: string
          timezone?: string | null
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          created_at: string
          id: string
          referral_id: string
          referrer_id: string
          reward_amount: number
          reward_currency: string | null
          tier_level: string
          wallet_transaction_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_id: string
          referrer_id: string
          reward_amount: number
          reward_currency?: string | null
          tier_level: string
          wallet_transaction_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_id?: string
          referrer_id?: string
          reward_amount?: number
          reward_currency?: string | null
          tier_level?: string
          wallet_transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          completion_date: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string | null
          referred_user_type: string | null
          referrer_id: string
          reward_given_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id?: string | null
          referred_user_type?: string | null
          referrer_id: string
          reward_given_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string | null
          referred_user_type?: string | null
          referrer_id?: string
          reward_given_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rental_bookings: {
        Row: {
          additional_services: Json | null
          confirmed_at: string | null
          contract_signed: boolean
          created_at: string
          currency: string
          driver_license_verified: boolean
          end_date: string
          id: string
          insurance_type: string | null
          payment_status: string
          picked_up_at: string | null
          pickup_coordinates: Json | null
          pickup_location: string
          rental_duration_type: string
          return_coordinates: Json | null
          return_location: string | null
          returned_at: string | null
          security_deposit: number
          special_requests: string | null
          start_date: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vehicle_id: string
        }
        Insert: {
          additional_services?: Json | null
          confirmed_at?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          driver_license_verified?: boolean
          end_date: string
          id?: string
          insurance_type?: string | null
          payment_status?: string
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location: string
          rental_duration_type: string
          return_coordinates?: Json | null
          return_location?: string | null
          returned_at?: string | null
          security_deposit?: number
          special_requests?: string | null
          start_date: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vehicle_id: string
        }
        Update: {
          additional_services?: Json | null
          confirmed_at?: string | null
          contract_signed?: boolean
          created_at?: string
          currency?: string
          driver_license_verified?: boolean
          end_date?: string
          id?: string
          insurance_type?: string | null
          payment_status?: string
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string
          rental_duration_type?: string
          return_coordinates?: Json | null
          return_location?: string | null
          returned_at?: string | null
          security_deposit?: number
          special_requests?: string | null
          start_date?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_bookings_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_city_pricing: {
        Row: {
          base_delivery_fee: number | null
          category_id: string | null
          city: string
          created_at: string | null
          id: string
          multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          base_delivery_fee?: number | null
          category_id?: string | null
          city: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          base_delivery_fee?: number | null
          category_id?: string | null
          city?: string
          created_at?: string | null
          id?: string
          multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_city_pricing_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_equipment_types: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_premium: boolean | null
          name: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_premium?: boolean | null
          name?: string
        }
        Relationships: []
      }
      rental_payment_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string
          id: string
          sensitive_data_accessed: Json | null
          target_payment_id: string
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string
          id?: string
          sensitive_data_accessed?: Json | null
          target_payment_id: string
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string
          id?: string
          sensitive_data_accessed?: Json | null
          target_payment_id?: string
        }
        Relationships: []
      }
      rental_subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          partner_id: string
          payment_date: string | null
          payment_method: string
          phone_number: string | null
          provider: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          partner_id: string
          payment_date?: string | null
          payment_method?: string
          phone_number?: string | null
          provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          partner_id?: string
          payment_date?: string | null
          payment_method?: string
          phone_number?: string | null
          provider?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "partner_rental_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_subscription_plans: {
        Row: {
          category_id: string
          created_at: string
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          monthly_price: number
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          monthly_price?: number
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_subscription_plans_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_vehicle_categories: {
        Row: {
          city: string | null
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          priority: number | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          priority?: number | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          priority?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      rental_vehicles: {
        Row: {
          available_cities: string[] | null
          brand: string
          category_id: string
          city: string | null
          comfort_level: string | null
          created_at: string
          currency: string
          daily_rate: number
          equipment: Json | null
          features: Json | null
          fuel_type: string
          hourly_rate: number
          id: string
          images: Json | null
          is_active: boolean
          is_available: boolean
          license_plate: string
          location_address: string | null
          location_coordinates: Json | null
          model: string
          moderated_at: string | null
          moderation_status: string | null
          moderator_id: string | null
          name: string
          partner_id: string | null
          partner_user_id: string | null
          rejection_reason: string | null
          seats: number
          security_deposit: number
          transmission: string
          updated_at: string
          vehicle_type: string
          weekly_rate: number
          year: number
        }
        Insert: {
          available_cities?: string[] | null
          brand: string
          category_id: string
          city?: string | null
          comfort_level?: string | null
          created_at?: string
          currency?: string
          daily_rate?: number
          equipment?: Json | null
          features?: Json | null
          fuel_type?: string
          hourly_rate?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          license_plate: string
          location_address?: string | null
          location_coordinates?: Json | null
          model: string
          moderated_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          name: string
          partner_id?: string | null
          partner_user_id?: string | null
          rejection_reason?: string | null
          seats?: number
          security_deposit?: number
          transmission?: string
          updated_at?: string
          vehicle_type: string
          weekly_rate?: number
          year: number
        }
        Update: {
          available_cities?: string[] | null
          brand?: string
          category_id?: string
          city?: string | null
          comfort_level?: string | null
          created_at?: string
          currency?: string
          daily_rate?: number
          equipment?: Json | null
          features?: Json | null
          fuel_type?: string
          hourly_rate?: number
          id?: string
          images?: Json | null
          is_active?: boolean
          is_available?: boolean
          license_plate?: string
          location_address?: string | null
          location_coordinates?: Json | null
          model?: string
          moderated_at?: string | null
          moderation_status?: string | null
          moderator_id?: string | null
          name?: string
          partner_id?: string | null
          partner_user_id?: string | null
          rejection_reason?: string | null
          seats?: number
          security_deposit?: number
          transmission?: string
          updated_at?: string
          vehicle_type?: string
          weekly_rate?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "rental_vehicles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "rental_vehicle_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          accepted_at: string | null
          created_at: string
          driver_id: string
          expires_at: string | null
          id: string
          ride_request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          driver_id: string
          expires_at?: string | null
          id?: string
          ride_request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          driver_id?: string
          expires_at?: string | null
          id?: string
          ride_request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ride_requests: {
        Row: {
          acceptance_time: string | null
          assigned_driver_id: string | null
          cancellation_reason: string | null
          cancellation_time: string | null
          completion_time: string | null
          created_at: string
          customer_boarded_at: string | null
          destination: string
          destination_coordinates: Json
          destination_zone_id: string | null
          dispatch_time: string | null
          driver_arrived_at: string | null
          estimated_price: number | null
          final_price: number | null
          id: string
          pickup_coordinates: Json
          pickup_location: string
          pickup_time: string | null
          pickup_zone_id: string | null
          request_time: string
          status: string
          surge_price: number | null
          updated_at: string
          user_id: string
          vehicle_class: string
          waiting_fee_amount: number | null
          waiting_time_minutes: number | null
        }
        Insert: {
          acceptance_time?: string | null
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancellation_time?: string | null
          completion_time?: string | null
          created_at?: string
          customer_boarded_at?: string | null
          destination: string
          destination_coordinates: Json
          destination_zone_id?: string | null
          dispatch_time?: string | null
          driver_arrived_at?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          pickup_coordinates: Json
          pickup_location: string
          pickup_time?: string | null
          pickup_zone_id?: string | null
          request_time?: string
          status?: string
          surge_price?: number | null
          updated_at?: string
          user_id: string
          vehicle_class?: string
          waiting_fee_amount?: number | null
          waiting_time_minutes?: number | null
        }
        Update: {
          acceptance_time?: string | null
          assigned_driver_id?: string | null
          cancellation_reason?: string | null
          cancellation_time?: string | null
          completion_time?: string | null
          created_at?: string
          customer_boarded_at?: string | null
          destination?: string
          destination_coordinates?: Json
          destination_zone_id?: string | null
          dispatch_time?: string | null
          driver_arrived_at?: string | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          pickup_coordinates?: Json
          pickup_location?: string
          pickup_time?: string | null
          pickup_zone_id?: string | null
          request_time?: string
          status?: string
          surge_price?: number | null
          updated_at?: string
          user_id?: string
          vehicle_class?: string
          waiting_fee_amount?: number | null
          waiting_time_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_destination_zone_id_fkey"
            columns: ["destination_zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_requests_pickup_zone_id_fkey"
            columns: ["pickup_zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          created_at: string
          id: string
          is_active: boolean
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          created_at?: string
          id?: string
          is_active?: boolean
          permission: Database["public"]["Enums"]["permission"]
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          created_at?: string
          id?: string
          is_active?: boolean
          permission?: Database["public"]["Enums"]["permission"]
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sensitive_data_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          accessed_columns: string[] | null
          created_at: string
          id: string
          ip_address: unknown | null
          target_record_id: string | null
          target_table: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          accessed_columns?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          target_record_id?: string | null
          target_table: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          accessed_columns?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown | null
          target_record_id?: string | null
          target_table?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      service_zones: {
        Row: {
          base_price_multiplier: number
          city: string
          coordinates: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          maintenance_end: string | null
          maintenance_start: string | null
          metadata: Json | null
          name: string
          status: string | null
          surge_multiplier: number
          updated_at: string
          updated_by: string | null
          zone_type: string
        }
        Insert: {
          base_price_multiplier?: number
          city?: string
          coordinates: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          metadata?: Json | null
          name: string
          status?: string | null
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
          zone_type?: string
        }
        Update: {
          base_price_multiplier?: number
          city?: string
          coordinates?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          maintenance_end?: string | null
          maintenance_start?: string | null
          metadata?: Json | null
          name?: string
          status?: string | null
          surge_multiplier?: number
          updated_at?: string
          updated_by?: string | null
          zone_type?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          duration_type: string
          features: Json
          id: string
          is_active: boolean
          max_rides_per_day: number | null
          name: string
          price: number
          priority_level: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_type: string
          features?: Json
          id?: string
          is_active?: boolean
          max_rides_per_day?: number | null
          name: string
          price: number
          priority_level?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          duration_type?: string
          features?: Json
          id?: string
          is_active?: boolean
          max_rides_per_day?: number | null
          name?: string
          price?: number
          priority_level?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_internal: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_internal?: boolean
          message?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "enhanced_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          data: Json | null
          expires_at: string | null
          id: string
          is_read: boolean
          is_system_wide: boolean
          message: string
          notification_type: string
          priority: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_system_wide?: boolean
          message: string
          notification_type: string
          priority?: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          expires_at?: string | null
          id?: string
          is_read?: boolean
          is_system_wide?: boolean
          message?: string
          notification_type?: string
          priority?: string
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_performance_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string | null
          unit: string | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string | null
          unit?: string | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      team_accounts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          invited_at: string
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_at?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_at?: string
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_requests: {
        Row: {
          company_name: string
          contact_email: string
          created_at: string
          id: string
          industry: string | null
          metadata: Json | null
          phone: string | null
          rejection_reason: string | null
          request_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          team_size: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_email: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          request_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string
          created_at?: string
          id?: string
          industry?: string | null
          metadata?: Json | null
          phone?: string | null
          rejection_reason?: string | null
          request_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          team_size?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transport_bookings: {
        Row: {
          actual_price: number | null
          booking_time: string
          completion_time: string | null
          created_at: string
          destination: string
          destination_coordinates: Json | null
          driver_arrived_at: string | null
          driver_assigned_at: string | null
          driver_id: string | null
          estimated_price: number | null
          id: string
          intermediate_stops: Json | null
          pickup_coordinates: Json | null
          pickup_location: string
          pickup_time: string | null
          status: string | null
          surge_multiplier: number | null
          total_distance: number | null
          total_duration: number | null
          trip_started_at: string | null
          updated_at: string
          user_id: string
          vehicle_type: string
        }
        Insert: {
          actual_price?: number | null
          booking_time?: string
          completion_time?: string | null
          created_at?: string
          destination: string
          destination_coordinates?: Json | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          intermediate_stops?: Json | null
          pickup_coordinates?: Json | null
          pickup_location: string
          pickup_time?: string | null
          status?: string | null
          surge_multiplier?: number | null
          total_distance?: number | null
          total_duration?: number | null
          trip_started_at?: string | null
          updated_at?: string
          user_id: string
          vehicle_type: string
        }
        Update: {
          actual_price?: number | null
          booking_time?: string
          completion_time?: string | null
          created_at?: string
          destination?: string
          destination_coordinates?: Json | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          intermediate_stops?: Json | null
          pickup_coordinates?: Json | null
          pickup_location?: string
          pickup_time?: string | null
          status?: string | null
          surge_multiplier?: number | null
          total_distance?: number | null
          total_duration?: number | null
          trip_started_at?: string | null
          updated_at?: string
          user_id?: string
          vehicle_type?: string
        }
        Relationships: []
      }
      trip_messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id: string
          sender_type: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: []
      }
      unified_conversations: {
        Row: {
          context_id: string | null
          context_type: string
          created_at: string
          id: string
          last_message_at: string | null
          metadata: Json | null
          participant_1: string
          participant_2: string
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          context_id?: string | null
          context_type: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          participant_1: string
          participant_2: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          context_id?: string | null
          context_type?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          metadata?: Json | null
          participant_1?: string
          participant_2?: string
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      unified_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          metadata: Json | null
          reply_to_id: string | null
          sender_id: string
          updated_at: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id: string
          updated_at?: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          metadata?: Json | null
          reply_to_id?: string | null
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "unified_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "unified_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unified_messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "unified_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          chat_messages: boolean
          created_at: string
          delivery_updates: boolean
          digest_frequency: string
          driver_updates: boolean
          id: string
          marketplace_updates: boolean
          payment_alerts: boolean
          priority_only: boolean
          promotions: boolean
          push_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          ride_updates: boolean
          sound_enabled: boolean
          system_alerts: boolean
          updated_at: string
          user_id: string
          vibration_enabled: boolean
        }
        Insert: {
          chat_messages?: boolean
          created_at?: string
          delivery_updates?: boolean
          digest_frequency?: string
          driver_updates?: boolean
          id?: string
          marketplace_updates?: boolean
          payment_alerts?: boolean
          priority_only?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          ride_updates?: boolean
          sound_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id: string
          vibration_enabled?: boolean
        }
        Update: {
          chat_messages?: boolean
          created_at?: string
          delivery_updates?: boolean
          digest_frequency?: string
          driver_updates?: boolean
          id?: string
          marketplace_updates?: boolean
          payment_alerts?: boolean
          priority_only?: boolean
          promotions?: boolean
          push_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          ride_updates?: boolean
          sound_enabled?: boolean
          system_alerts?: boolean
          updated_at?: string
          user_id?: string
          vibration_enabled?: boolean
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_label: string | null
          action_url: string | null
          admin_notification_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_read: boolean
          priority: string
          read_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          action_url?: string | null
          admin_notification_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          priority?: string
          read_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          action_url?: string | null
          admin_notification_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_read?: boolean
          priority?: string
          read_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_places: {
        Row: {
          address: string
          coordinates: Json | null
          created_at: string
          id: string
          last_used: string
          name: string
          place_type: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          address: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          last_used?: string
          name: string
          place_type?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          address?: string
          coordinates?: Json | null
          created_at?: string
          id?: string
          last_used?: string
          name?: string
          place_type?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          delivery_id: string | null
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          delivery_id?: string | null
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role"] | null
          assigned_at: string
          assigned_by: string | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role"] | null
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          currency: string
          dark_mode: boolean
          email_notifications: boolean
          id: string
          language: string
          location_sharing: boolean
          notifications_enabled: boolean
          push_notifications: boolean
          sms_notifications: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          location_sharing?: boolean
          notifications_enabled?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          dark_mode?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          location_sharing?: boolean
          notifications_enabled?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_verification: {
        Row: {
          created_at: string | null
          id: string
          identity_verified: boolean | null
          phone_verified: boolean | null
          updated_at: string | null
          user_id: string
          verification_documents: Json | null
          verification_level: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          updated_at?: string | null
          user_id: string
          verification_documents?: Json | null
          verification_level?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          updated_at?: string | null
          user_id?: string
          verification_documents?: Json | null
          verification_level?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string
          id: string
          identity_document_url: string | null
          identity_verified: boolean | null
          phone_verified: boolean | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          identity_document_url?: string | null
          identity_verified?: boolean | null
          phone_verified?: boolean | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      validation_history: {
        Row: {
          action: string
          comments: string | null
          created_at: string
          id: string
          request_id: string
          validation_type: string
          validator_id: string
        }
        Insert: {
          action: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id: string
          validation_type: string
          validator_id: string
        }
        Update: {
          action?: string
          comments?: string | null
          created_at?: string
          id?: string
          request_id?: string
          validation_type?: string
          validator_id?: string
        }
        Relationships: []
      }
      vendor_earnings: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          currency: string
          earnings_type: string
          id: string
          order_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          earnings_type?: string
          id?: string
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          currency?: string
          earnings_type?: string
          id?: string
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_financial_access_logs: {
        Row: {
          access_reason: string | null
          access_type: string
          accessed_by: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          sensitive_data_accessed: Json | null
          target_vendor_id: string
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          access_type: string
          accessed_by: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_vendor_id: string
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          access_type?: string
          accessed_by?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          sensitive_data_accessed?: Json | null
          target_vendor_id?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      vendor_notifications: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          id: string
          is_acknowledged: boolean
          is_read: boolean
          message: string
          metadata: Json | null
          notification_type: string
          order_id: string
          read_at: string | null
          sound_played: boolean
          title: string
          vendor_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          message: string
          metadata?: Json | null
          notification_type: string
          order_id: string
          read_at?: string | null
          sound_played?: boolean
          title: string
          vendor_id: string
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          id?: string
          is_acknowledged?: boolean
          is_read?: boolean
          message?: string
          metadata?: Json | null
          notification_type?: string
          order_id?: string
          read_at?: string | null
          sound_played?: boolean
          title?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_subscriptions: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          is_active: boolean
          notification_preferences: Json | null
          subscribed_at: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          subscribed_at?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          is_active?: boolean
          notification_preferences?: Json | null
          subscribed_at?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string
          id: string
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          vendor_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          vendor_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          vendor_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      vendor_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          last_withdrawal_date: string | null
          total_earned: number
          total_withdrawn: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          last_withdrawal_date?: string | null
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          last_withdrawal_date?: string | null
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: []
      }
      vendor_withdrawals: {
        Row: {
          amount: number
          created_at: string
          currency: string
          fees_amount: number
          id: string
          net_amount: number
          phone_number: string
          processed_at: string | null
          provider_reference: string | null
          status: string
          updated_at: string
          vendor_id: string
          wallet_id: string
          withdrawal_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          fees_amount?: number
          id?: string
          net_amount: number
          phone_number: string
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          wallet_id: string
          withdrawal_method: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          fees_amount?: number
          id?: string
          net_amount?: number
          phone_number?: string
          processed_at?: string | null
          provider_reference?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          wallet_id?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          currency: string
          description: string
          id: string
          payment_method: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          currency?: string
          description: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          currency?: string
          description?: string
          id?: string
          payment_method?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: []
      }
      withdrawal_requests: {
        Row: {
          amount: number
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          kwenda_pay_phone: string | null
          mobile_money_phone: string | null
          mobile_money_provider: string | null
          processed_at: string | null
          status: string
          transaction_reference: string | null
          updated_at: string
          user_id: string
          user_type: string
          withdrawal_method: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kwenda_pay_phone?: string | null
          mobile_money_phone?: string | null
          mobile_money_provider?: string | null
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id: string
          user_type: string
          withdrawal_method?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          kwenda_pay_phone?: string | null
          mobile_money_phone?: string | null
          mobile_money_provider?: string | null
          processed_at?: string | null
          status?: string
          transaction_reference?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string
          withdrawal_method?: string
        }
        Relationships: []
      }
      zone_analytics: {
        Row: {
          active_drivers: number
          average_wait_time: number
          city: string
          country_code: string
          created_at: string
          customer_satisfaction: number
          date: string
          id: string
          peak_hours: Json | null
          total_revenue: number
          total_rides: number
          zone_name: string
        }
        Insert: {
          active_drivers?: number
          average_wait_time?: number
          city: string
          country_code: string
          created_at?: string
          customer_satisfaction?: number
          date: string
          id?: string
          peak_hours?: Json | null
          total_revenue?: number
          total_rides?: number
          zone_name: string
        }
        Update: {
          active_drivers?: number
          average_wait_time?: number
          city?: string
          country_code?: string
          created_at?: string
          customer_satisfaction?: number
          date?: string
          id?: string
          peak_hours?: Json | null
          total_revenue?: number
          total_rides?: number
          zone_name?: string
        }
        Relationships: []
      }
      zone_pricing_rules: {
        Row: {
          base_price: number
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          special_pricing: Json | null
          surge_multiplier: number
          time_based_pricing: Json | null
          updated_at: string
          updated_by: string | null
          valid_from: string
          valid_until: string | null
          vehicle_class: string
          zone_id: string
        }
        Insert: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          special_pricing?: Json | null
          surge_multiplier?: number
          time_based_pricing?: Json | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
          vehicle_class?: string
          zone_id: string
        }
        Update: {
          base_price?: number
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          special_pricing?: Json | null
          surge_multiplier?: number
          time_based_pricing?: Json | null
          updated_at?: string
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
          vehicle_class?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_pricing_rules_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      zone_statistics: {
        Row: {
          active_drivers: number | null
          available_drivers: number | null
          average_trip_duration: number | null
          average_wait_time: number | null
          calculated_at: string
          cancellation_rate: number | null
          completion_rate: number | null
          customer_satisfaction_avg: number | null
          customer_satisfaction_count: number | null
          date: string
          hour_of_day: number | null
          id: string
          metadata: Json | null
          peak_demand_multiplier: number | null
          total_deliveries: number | null
          total_revenue: number | null
          total_rides: number | null
          zone_id: string
        }
        Insert: {
          active_drivers?: number | null
          available_drivers?: number | null
          average_trip_duration?: number | null
          average_wait_time?: number | null
          calculated_at?: string
          cancellation_rate?: number | null
          completion_rate?: number | null
          customer_satisfaction_avg?: number | null
          customer_satisfaction_count?: number | null
          date?: string
          hour_of_day?: number | null
          id?: string
          metadata?: Json | null
          peak_demand_multiplier?: number | null
          total_deliveries?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          zone_id: string
        }
        Update: {
          active_drivers?: number | null
          available_drivers?: number | null
          average_trip_duration?: number | null
          average_wait_time?: number | null
          calculated_at?: string
          cancellation_rate?: number | null
          completion_rate?: number | null
          customer_satisfaction_avg?: number | null
          customer_satisfaction_count?: number | null
          date?: string
          hour_of_day?: number | null
          id?: string
          metadata?: Json | null
          peak_demand_multiplier?: number | null
          total_deliveries?: number | null
          total_revenue?: number | null
          total_rides?: number | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zone_statistics_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "service_zones"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_delivery_estimate: {
        Args: { order_id_param: string }
        Returns: string
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_distance_meters: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      calculate_rental_price: {
        Args: {
          base_price: number
          category_id_param?: string
          city_name: string
        }
        Returns: number
      }
      calculate_surge_pricing: {
        Args: { vehicle_class_param: string; zone_id_param: string }
        Returns: number
      }
      calculate_zone_statistics: {
        Args: {
          date_param?: string
          hour_param?: number
          zone_id_param: string
        }
        Returns: undefined
      }
      check_driver_location_access: {
        Args: { target_driver_id: string }
        Returns: boolean
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_support_ticket: {
        Args: {
          p_category: string
          p_description: string
          p_metadata?: Json
          p_priority?: string
          p_subject: string
          p_user_id: string
        }
        Returns: {
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json
          priority: string
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }[]
      }
      ensure_user_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          is_public: boolean | null
          last_seen: string | null
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
      }
      find_nearby_drivers: {
        Args: {
          max_distance_km?: number
          pickup_lat: number
          pickup_lng: number
          vehicle_class_filter?: string
        }
        Returns: {
          distance_km: number
          driver_id: string
          estimated_arrival_minutes: number
          rating_average: number
          vehicle_class: string
        }[]
      }
      generate_driver_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_lottery_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ticket_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      geocode_location: {
        Args: { query_text: string }
        Returns: Json
      }
      get_anonymized_vendor_performance: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_monthly_earnings: number
          avg_orders_per_month: number
          performance_tier: string
          vendor_count: number
        }[]
      }
      get_delivery_zone_info: {
        Args: { assignment_id_param: string }
        Returns: {
          assignment_id: string
          delivery_zone: string
          estimated_distance_km: number
          estimated_duration_minutes: number
          order_id: string
          pickup_zone: string
          special_requirements: string
          status: string
        }[]
      }
      get_driver_delivery_coordinates: {
        Args: { assignment_id_param: string }
        Returns: {
          delivery_address: string
          delivery_contact: string
          delivery_lat: number
          delivery_lng: number
          pickup_address: string
          pickup_contact: string
          pickup_lat: number
          pickup_lng: number
        }[]
      }
      get_driver_location_with_audit: {
        Args: { target_driver_id: string }
        Returns: {
          driver_id: string
          is_available: boolean
          is_online: boolean
          last_ping: string
          latitude: number
          longitude: number
          vehicle_class: string
        }[]
      }
      get_driver_zones: {
        Args: { zone_radius_km?: number }
        Returns: {
          average_wait_time_minutes: number
          driver_count: number
          zone_center_lat: number
          zone_center_lng: number
        }[]
      }
      get_edge_function_performance_stats: {
        Args: { p_function_name?: string; p_hours_back?: number }
        Returns: {
          avg_execution_time_ms: number
          error_rate: number
          function_name: string
          p95_execution_time_ms: number
          success_rate: number
          total_calls: number
        }[]
      }
      get_market_benchmark_stats: {
        Args: { category_filter?: string }
        Returns: {
          avg_earnings_per_vendor: number
          median_order_value: number
          top_25_percent_threshold: number
          total_active_vendors: number
        }[]
      }
      get_notification_stats: {
        Args: { admin_id?: string }
        Returns: Json
      }
      get_performance_trends: {
        Args: { p_hours_back?: number; p_metric_type?: string }
        Returns: {
          avg_value: number
          data_points: number
          max_value: number
          metric_name: string
          metric_type: string
          min_value: number
          trend_direction: string
        }[]
      }
      get_protected_admin_info: {
        Args: { admin_id_param: string }
        Returns: {
          admin_level: string
          created_at: string
          department: string
          display_name: string
          is_active: boolean
          user_id: string
        }[]
      }
      get_protected_user_info: {
        Args: { user_id_param: string }
        Returns: {
          avatar_url: string
          display_name: string
          member_since: string
          user_id: string
          user_type: string
        }[]
      }
      get_public_chauffeur_info: {
        Args: { chauffeur_id: string }
        Returns: {
          display_name: string
          id: string
          is_active: boolean
          rating_average: number
          total_rides: number
          vehicle_color: string
          vehicle_model: string
          vehicle_type: string
          verification_status: string
        }[]
      }
      get_safe_user_info: {
        Args: { user_id_param: string }
        Returns: {
          avatar_url: string
          display_name: string
          member_since: string
          user_id: string
          user_type: string
        }[]
      }
      get_secure_financial_summary: {
        Args: { user_id_param: string }
        Returns: {
          available_balance: number
          last_transaction_date: string
          pending_amount: number
          total_earnings: number
        }[]
      }
      get_secure_vendor_earnings: {
        Args:
          | {
              limit_records?: number
              offset_records?: number
              vendor_filter?: string
            }
          | { vendor_id_param?: string }
        Returns: {
          amount: number
          confirmed_at: string
          created_at: string
          currency: string
          earnings_type: string
          id: string
          order_id: string
          paid_at: string
          status: string
          vendor_id: string
        }[]
      }
      get_secure_vendor_earnings_summary: {
        Args: { period_days?: number }
        Returns: {
          average_order_value: number
          last_payment_date: string
          pending_amount: number
          total_earnings: number
          total_orders: number
        }[]
      }
      get_security_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          admin_access_count: number
          failed_login_attempts: number
          financial_access_count: number
          last_24h_violations: number
          suspicious_activities: number
        }[]
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          admin_role: string
          permissions: string[]
          role: string
        }[]
      }
      get_vendor_dashboard_data: {
        Args: Record<PropertyKey, never>
        Returns: {
          average_order_value: number
          current_month_earnings: number
          last_month_earnings: number
          pending_payments: number
          top_selling_category: string
          total_orders_this_month: number
        }[]
      }
      get_vendor_earnings_summary: {
        Args: { period_days?: number; vendor_id_param?: string }
        Returns: {
          average_order_value: number
          last_payment_date: string
          pending_amount: number
          total_earnings: number
          total_orders: number
        }[]
      }
      get_zone_for_coordinates: {
        Args: { lat: number; lng: number }
        Returns: string
      }
      get_zone_pricing: {
        Args: {
          datetime_param?: string
          vehicle_class_param?: string
          zone_id_param: string
        }
        Returns: {
          base_price: number
          maximum_fare: number
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          surge_multiplier: number
        }[]
      }
      has_permission: {
        Args: { permission_param: string; user_id_param: string }
        Returns: boolean
      }
      intelligent_places_search: {
        Args:
          | {
              include_nearby?: boolean
              max_results?: number
              search_city?: string
              search_query?: string
              user_latitude?: number
              user_longitude?: number
            }
          | {
              max_results?: number
              min_hierarchy_level?: number
              search_query: string
              user_city?: string
              user_country_code?: string
              user_lat?: number
              user_lng?: number
            }
        Returns: {
          aliases: string[]
          category: string
          city: string
          commune: string
          country_code: string
          distance_km: number
          hierarchy_level: number
          id: string
          is_popular: boolean
          latitude: number
          longitude: number
          name: string
          name_fr: string
          name_local: string
          place_type: string
          popularity_score: number
          relevance_score: number
          search_keywords: string[]
        }[]
      }
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_vehicle_subscription_active: {
        Args: { vehicle_id_param: string }
        Returns: boolean
      }
      link_payment_to_subscription: {
        Args: { payment_id: string; subscription_id: string }
        Returns: boolean
      }
      log_driver_location_access: {
        Args: {
          p_access_reason?: string
          p_access_type: string
          p_driver_id: string
        }
        Returns: undefined
      }
      log_edge_function_performance: {
        Args: {
          p_error_message?: string
          p_execution_time_ms: number
          p_function_name: string
          p_request_id?: string
          p_status_code?: number
          p_user_id?: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args: {
          p_access_reason?: string
          p_access_type?: string
          p_accessed_columns?: string[]
          p_target_record_id?: string
          p_target_table: string
        }
        Returns: undefined
      }
      process_escrow_release: {
        Args: { escrow_id: string }
        Returns: boolean
      }
      process_orange_money_payment: {
        Args: {
          p_amount: number
          p_currency: string
          p_transaction_ref: string
          p_user_id: string
        }
        Returns: string
      }
      record_performance_metric: {
        Args: {
          p_metadata?: Json
          p_metric_name: string
          p_metric_type: string
          p_metric_value: number
          p_unit?: string
        }
        Returns: string
      }
      search_places: {
        Args: {
          max_results?: number
          search_query: string
          user_city?: string
          user_country_code?: string
        }
        Returns: {
          category: string
          city: string
          commune: string
          country_code: string
          id: string
          is_popular: boolean
          latitude: number
          longitude: number
          name: string
          name_fr: string
          name_local: string
          place_type: string
          relevance_score: number
          search_keywords: string[]
        }[]
      }
      search_users_protected: {
        Args: { limit_results?: number; search_term: string }
        Returns: {
          masked_name: string
          user_id: string
          user_type: string
        }[]
      }
      security_monitor_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          failed_auth_attempts: number
          recent_admin_access: number
          sensitive_data_access: number
          suspicious_patterns: number
        }[]
      }
      user_exists: {
        Args: { user_id_param: string }
        Returns: boolean
      }
    }
    Enums: {
      admin_role:
        | "super_admin"
        | "admin_financier"
        | "admin_transport"
        | "admin_marketplace"
        | "admin_support"
        | "moderator"
      permission:
        | "users_read"
        | "users_write"
        | "users_delete"
        | "drivers_read"
        | "drivers_write"
        | "drivers_validate"
        | "partners_read"
        | "partners_write"
        | "partners_validate"
        | "finance_read"
        | "finance_write"
        | "finance_admin"
        | "transport_read"
        | "transport_write"
        | "transport_admin"
        | "marketplace_read"
        | "marketplace_write"
        | "marketplace_moderate"
        | "support_read"
        | "support_write"
        | "support_admin"
        | "analytics_read"
        | "analytics_admin"
        | "system_admin"
        | "notifications_read"
        | "notifications_write"
        | "notifications_admin"
        | "zones_read"
        | "zones_write"
        | "zones_admin"
        | "drivers_admin"
      user_role: "client" | "driver" | "partner" | "admin"
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
      admin_role: [
        "super_admin",
        "admin_financier",
        "admin_transport",
        "admin_marketplace",
        "admin_support",
        "moderator",
      ],
      permission: [
        "users_read",
        "users_write",
        "users_delete",
        "drivers_read",
        "drivers_write",
        "drivers_validate",
        "partners_read",
        "partners_write",
        "partners_validate",
        "finance_read",
        "finance_write",
        "finance_admin",
        "transport_read",
        "transport_write",
        "transport_admin",
        "marketplace_read",
        "marketplace_write",
        "marketplace_moderate",
        "support_read",
        "support_write",
        "support_admin",
        "analytics_read",
        "analytics_admin",
        "system_admin",
        "notifications_read",
        "notifications_write",
        "notifications_admin",
        "zones_read",
        "zones_write",
        "zones_admin",
        "drivers_admin",
      ],
      user_role: ["client", "driver", "partner", "admin"],
    },
  },
} as const
