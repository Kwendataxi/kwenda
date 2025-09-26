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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      booking_reports: {
        Row: {
          admin_notes: string | null
          booking_id: string
          created_at: string | null
          driver_id: string | null
          id: string
          reason: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          booking_id: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          reason: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          booking_id?: string
          created_at?: string | null
          driver_id?: string | null
          id?: string
          reason?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      business_accounts: {
        Row: {
          billing_address: Json | null
          business_type: string | null
          company_name: string
          company_registration: string | null
          created_at: string
          currency: string
          employee_count: number | null
          id: string
          industry: string | null
          monthly_budget: number | null
          owner_id: string
          status: string
          subscription_plan: string | null
          tax_number: string | null
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          billing_address?: Json | null
          business_type?: string | null
          company_name: string
          company_registration?: string | null
          created_at?: string
          currency?: string
          employee_count?: number | null
          id?: string
          industry?: string | null
          monthly_budget?: number | null
          owner_id: string
          status?: string
          subscription_plan?: string | null
          tax_number?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          billing_address?: Json | null
          business_type?: string | null
          company_name?: string
          company_registration?: string | null
          created_at?: string
          currency?: string
          employee_count?: number | null
          id?: string
          industry?: string | null
          monthly_budget?: number | null
          owner_id?: string
          status?: string
          subscription_plan?: string | null
          tax_number?: string | null
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      business_team_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          permissions: Json | null
          role: string
          status: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_team_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_accounts"
            referencedColumns: ["id"]
          },
        ]
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
          documents: Json | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          has_own_vehicle: boolean | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          is_active: boolean | null
          license_expiry: string | null
          license_number: string | null
          migrated_at: string | null
          migrated_service_type: string | null
          migration_status: string | null
          phone_number: string | null
          profile_photo_url: string | null
          rating_average: number | null
          rating_count: number | null
          role: string | null
          service_areas: string[] | null
          service_type: string | null
          total_rides: number | null
          updated_at: string | null
          user_id: string
          vehicle_class: string | null
          vehicle_color: string | null
          vehicle_make: string | null
          vehicle_model: string | null
          vehicle_photo_url: string | null
          vehicle_plate: string | null
          vehicle_type: string | null
          vehicle_year: number | null
          verification_level: string | null
          verification_status: string | null
        }
        Insert: {
          bank_account_number?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          documents?: Json | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          migrated_at?: string | null
          migrated_service_type?: string | null
          migration_status?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: string | null
          service_areas?: string[] | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string | null
          user_id: string
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_level?: string | null
          verification_status?: string | null
        }
        Update: {
          bank_account_number?: string | null
          created_at?: string | null
          delivery_capacity?: string | null
          display_name?: string | null
          documents?: Json | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          has_own_vehicle?: boolean | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          is_active?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          migrated_at?: string | null
          migrated_service_type?: string | null
          migration_status?: string | null
          phone_number?: string | null
          profile_photo_url?: string | null
          rating_average?: number | null
          rating_count?: number | null
          role?: string | null
          service_areas?: string[] | null
          service_type?: string | null
          total_rides?: number | null
          updated_at?: string | null
          user_id?: string
          vehicle_class?: string | null
          vehicle_color?: string | null
          vehicle_make?: string | null
          vehicle_model?: string | null
          vehicle_photo_url?: string | null
          vehicle_plate?: string | null
          vehicle_type?: string | null
          vehicle_year?: number | null
          verification_level?: string | null
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
      commission_configuration: {
        Row: {
          created_at: string
          created_by: string | null
          driver_commission_rate: number
          id: string
          is_active: boolean
          partner_commission_rate: number
          platform_commission_rate: number
          service_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          driver_commission_rate?: number
          id?: string
          is_active?: boolean
          partner_commission_rate?: number
          platform_commission_rate?: number
          service_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          driver_commission_rate?: number
          id?: string
          is_active?: boolean
          partner_commission_rate?: number
          platform_commission_rate?: number
          service_type?: string
          updated_at?: string
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
      data_migration_logs: {
        Row: {
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          migration_data: Json | null
          migration_type: string
          success: boolean | null
          target_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          migration_data?: Json | null
          migration_type: string
          success?: boolean | null
          target_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          migration_data?: Json | null
          migration_type?: string
          success?: boolean | null
          target_id?: string | null
        }
        Relationships: []
      }
      delivery_chat_messages: {
        Row: {
          delivery_order_id: string
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_type: string
          sent_at: string
        }
        Insert: {
          delivery_order_id: string
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          sent_at?: string
        }
        Update: {
          delivery_order_id?: string
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_chat_messages_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
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
      delivery_notifications: {
        Row: {
          created_at: string
          delivery_order_id: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type: string
          read: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_order_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_order_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?: string
          read?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notifications_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          actual_price: number | null
          cancelled_at: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_coordinates: Json | null
          delivery_google_address: string | null
          delivery_google_place_id: string | null
          delivery_google_place_name: string | null
          delivery_location: string
          delivery_photo_url: string | null
          delivery_proof: Json | null
          delivery_time: string | null
          delivery_type: string
          driver_assigned_at: string | null
          driver_id: string | null
          driver_notes: string | null
          estimated_price: number | null
          google_geocoded_at: string | null
          id: string
          in_transit_at: string | null
          loading_assistance: boolean | null
          order_time: string
          package_type: string | null
          package_weight: number | null
          picked_up_at: string | null
          pickup_coordinates: Json | null
          pickup_google_address: string | null
          pickup_google_place_id: string | null
          pickup_google_place_name: string | null
          pickup_location: string
          pickup_time: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_signature: string | null
          sender_name: string | null
          sender_phone: string | null
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
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          delivery_location: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location: string
          pickup_time?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_signature?: string | null
          sender_name?: string | null
          sender_phone?: string | null
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
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          delivery_location?: string
          delivery_photo_url?: string | null
          delivery_proof?: Json | null
          delivery_time?: string | null
          delivery_type?: string
          driver_assigned_at?: string | null
          driver_id?: string | null
          driver_notes?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          in_transit_at?: string | null
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          package_weight?: number | null
          picked_up_at?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location?: string
          pickup_time?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_signature?: string | null
          sender_name?: string | null
          sender_phone?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vehicle_size?: string | null
        }
        Relationships: []
      }
      delivery_pricing_config: {
        Row: {
          base_price: number
          city: string
          created_at: string | null
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          service_type: string
          surge_multiplier: number | null
          updated_at: string | null
        }
        Insert: {
          base_price?: number
          city?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type: string
          surge_multiplier?: number | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          city?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type?: string
          surge_multiplier?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      delivery_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          delivery_order_id: string
          id: string
          location_coordinates: Json | null
          metadata: Json | null
          notes: string | null
          previous_status: string | null
          status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          delivery_order_id: string
          id?: string
          location_coordinates?: Json | null
          metadata?: Json | null
          notes?: string | null
          previous_status?: string | null
          status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          delivery_order_id?: string
          id?: string
          location_coordinates?: Json | null
          metadata?: Json | null
          notes?: string | null
          previous_status?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_status_history_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
        ]
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
      driver_codes_enhanced: {
        Row: {
          code: string
          code_type: string
          created_at: string
          created_by: string | null
          driver_id: string
          expires_at: string | null
          id: string
          is_active: boolean
          partner_id: string | null
          updated_at: string
          usage_count: number | null
          usage_limit: number | null
        }
        Insert: {
          code: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          driver_id: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Update: {
          code?: string
          code_type?: string
          created_at?: string
          created_by?: string | null
          driver_id?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string | null
          updated_at?: string
          usage_count?: number | null
          usage_limit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_codes_enhanced_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
        ]
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
          geocode_source: string | null
          google_address: string | null
          google_geocoded_at: string | null
          google_place_id: string | null
          google_place_name: string | null
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
          geocode_source?: string | null
          google_address?: string | null
          google_geocoded_at?: string | null
          google_place_id?: string | null
          google_place_name?: string | null
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
          geocode_source?: string | null
          google_address?: string | null
          google_geocoded_at?: string | null
          google_place_id?: string | null
          google_place_name?: string | null
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
      driver_online_status_table: {
        Row: {
          last_updated: string | null
          online_drivers: number | null
          total_drivers: number | null
          vehicle_class: string | null
        }
        Insert: {
          last_updated?: string | null
          online_drivers?: number | null
          total_drivers?: number | null
          vehicle_class?: string | null
        }
        Update: {
          last_updated?: string | null
          online_drivers?: number | null
          total_drivers?: number | null
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
      driver_ratings: {
        Row: {
          booking_id: string
          created_at: string | null
          driver_id: string
          feedback: string | null
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          driver_id: string
          feedback?: string | null
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          driver_id?: string
          feedback?: string | null
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
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
      driver_service_associations: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string | null
          driver_id: string
          id: string
          is_active: boolean | null
          migration_source: string | null
          notes: string | null
          service_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          driver_id: string
          id?: string
          is_active?: boolean | null
          migration_source?: string | null
          notes?: string | null
          service_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string | null
          driver_id?: string
          id?: string
          is_active?: boolean | null
          migration_source?: string | null
          notes?: string | null
          service_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_service_associations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "service_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_service_preferences: {
        Row: {
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          languages: string[] | null
          max_distance_km: number | null
          minimum_fare: number | null
          preferred_zones: string[] | null
          service_types: string[]
          special_services: string[] | null
          updated_at: string
          vehicle_classes: string[] | null
          work_schedule: Json | null
        }
        Insert: {
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_distance_km?: number | null
          minimum_fare?: number | null
          preferred_zones?: string[] | null
          service_types?: string[]
          special_services?: string[] | null
          updated_at?: string
          vehicle_classes?: string[] | null
          work_schedule?: Json | null
        }
        Update: {
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          languages?: string[] | null
          max_distance_km?: number | null
          minimum_fare?: number | null
          preferred_zones?: string[] | null
          service_types?: string[]
          special_services?: string[] | null
          updated_at?: string
          vehicle_classes?: string[] | null
          work_schedule?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_service_preferences_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
        ]
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
      driver_vehicle_associations: {
        Row: {
          approval_status: string
          approved_by: string | null
          association_type: string
          created_at: string
          created_by: string | null
          driver_id: string
          end_date: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          notes: string | null
          partner_id: string | null
          start_date: string
          updated_at: string
          vehicle_details: Json | null
          vehicle_id: string | null
        }
        Insert: {
          approval_status?: string
          approved_by?: string | null
          association_type: string
          created_at?: string
          created_by?: string | null
          driver_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          start_date?: string
          updated_at?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Update: {
          approval_status?: string
          approved_by?: string | null
          association_type?: string
          created_at?: string
          created_by?: string | null
          driver_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          notes?: string | null
          partner_id?: string | null
          start_date?: string
          updated_at?: string
          vehicle_details?: Json | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_vehicle_associations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "driver_vehicle_associations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["user_id"]
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
      emergency_alerts: {
        Row: {
          acknowledged_at: string | null
          alert_type: string
          auto_notifications_sent: Json | null
          created_at: string
          emergency_contacts: Json | null
          id: string
          location: Json
          priority_level: number
          resolution_notes: string | null
          resolved_at: string | null
          responder_id: string | null
          status: string
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          alert_type?: string
          auto_notifications_sent?: Json | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          location: Json
          priority_level?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          alert_type?: string
          auto_notifications_sent?: Json | null
          created_at?: string
          emergency_contacts?: Json | null
          id?: string
          location?: Json
          priority_level?: number
          resolution_notes?: string | null
          resolved_at?: string | null
          responder_id?: string | null
          status?: string
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      encryption_keys: {
        Row: {
          algorithm: string
          created_at: string
          created_by: string | null
          encrypted_key: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_identifier: string
          key_type: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_identifier: string
          key_type: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          created_by?: string | null
          encrypted_key?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_identifier?: string
          key_type?: string
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
      function_monitoring_logs: {
        Row: {
          created_at: string
          error_count: number | null
          function_name: string
          id: string
          metadata: Json | null
          response_time_ms: number | null
          status: string
          success_rate: number | null
        }
        Insert: {
          created_at?: string
          error_count?: number | null
          function_name: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status: string
          success_rate?: number | null
        }
        Update: {
          created_at?: string
          error_count?: number | null
          function_name?: string
          id?: string
          metadata?: Json | null
          response_time_ms?: number | null
          status?: string
          success_rate?: number | null
        }
        Relationships: []
      }
      geolocation_audit_trail: {
        Row: {
          action_type: string
          created_at: string
          encrypted_payload: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          location_data: Json | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          risk_score: number | null
          session_id: string | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          encrypted_payload?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_score?: number | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          encrypted_payload?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          location_data?: Json | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_score?: number | null
          session_id?: string | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      intelligent_places: {
        Row: {
          avenue: string | null
          category: string
          city: string
          commune: string | null
          country_code: string | null
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
          country_code?: string | null
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
          country_code?: string | null
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
      ip_geolocation_cache: {
        Row: {
          accuracy: number | null
          city: string | null
          country_code: string | null
          country_name: string | null
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          latitude: number | null
          longitude: number | null
          provider: string | null
        }
        Insert: {
          accuracy?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address: unknown
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
        }
        Update: {
          accuracy?: number | null
          city?: string | null
          country_code?: string | null
          country_name?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          latitude?: number | null
          longitude?: number | null
          provider?: string | null
        }
        Relationships: []
      }
      location_access_audit: {
        Row: {
          access_type: string
          accessed_by: string | null
          created_at: string | null
          drivers_found: number | null
          id: string
          ip_address: unknown | null
          search_coordinates: Json | null
          search_radius_km: number | null
          user_agent: string | null
        }
        Insert: {
          access_type: string
          accessed_by?: string | null
          created_at?: string | null
          drivers_found?: number | null
          id?: string
          ip_address?: unknown | null
          search_coordinates?: Json | null
          search_radius_km?: number | null
          user_agent?: string | null
        }
        Update: {
          access_type?: string
          accessed_by?: string | null
          created_at?: string | null
          drivers_found?: number | null
          id?: string
          ip_address?: unknown | null
          search_coordinates?: Json | null
          search_radius_km?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      location_search_cache: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          provider: string | null
          query: string
          region: string | null
          result_count: number | null
          results: Json
          search_key: string
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string | null
          query: string
          region?: string | null
          result_count?: number | null
          results?: Json
          search_key: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          provider?: string | null
          query?: string
          region?: string | null
          result_count?: number | null
          results?: Json
          search_key?: string
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
      partner_audit_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_status: string | null
          old_status: string | null
          partner_id: string
          reason: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          partner_id: string
          reason?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_status?: string | null
          old_status?: string | null
          partner_id?: string
          reason?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_audit_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["id"]
          },
        ]
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
      partner_driver_requests: {
        Row: {
          created_at: string | null
          driver_id: string | null
          id: string
          partner_id: string | null
          request_message: string | null
          responded_at: string | null
          response_message: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          partner_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_id?: string | null
          id?: string
          partner_id?: string | null
          request_message?: string | null
          responded_at?: string | null
          response_message?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_driver_requests_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "chauffeurs"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "partner_driver_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partenaires"
            referencedColumns: ["user_id"]
          },
        ]
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
      partner_security_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
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
      pricing_configs: {
        Row: {
          active: boolean
          base_price: number
          city: string
          created_at: string
          currency: string
          id: string
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          service_type: string
          surge_multiplier: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type: string
          surge_multiplier?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
        }
        Relationships: []
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
      promo_code_usage: {
        Row: {
          currency: string
          discount_amount: number
          id: string
          order_id: string | null
          order_type: string
          promo_code_id: string
          used_at: string
          user_id: string
        }
        Insert: {
          currency?: string
          discount_amount: number
          id?: string
          order_id?: string | null
          order_type: string
          promo_code_id: string
          used_at?: string
          user_id: string
        }
        Update: {
          currency?: string
          discount_amount?: number
          id?: string
          order_id?: string | null
          order_type?: string
          promo_code_id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_code_usage_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applicable_services: string[] | null
          code: string
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_published: boolean
          max_discount_amount: number | null
          min_order_amount: number | null
          scheduled_publish_at: string | null
          title: string
          updated_at: string
          usage_count: number
          usage_limit: number | null
          user_limit: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          applicable_services?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          is_published?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          scheduled_publish_at?: string | null
          title: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          applicable_services?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_published?: boolean
          max_discount_amount?: number | null
          min_order_amount?: number | null
          scheduled_publish_at?: string | null
          title?: string
          updated_at?: string
          usage_count?: number
          usage_limit?: number | null
          user_limit?: number | null
          valid_from?: string
          valid_until?: string
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
      push_notification_analytics: {
        Row: {
          created_at: string
          device_info: Json | null
          event_type: string
          id: string
          notification_data: Json | null
          notification_id: string | null
          timestamp: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_info?: Json | null
          event_type: string
          id?: string
          notification_data?: Json | null
          notification_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_info?: Json | null
          event_type?: string
          id?: string
          notification_data?: Json | null
          notification_id?: string | null
          timestamp?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_notification_queue: {
        Row: {
          body: string
          created_at: string
          data: Json | null
          error_message: string | null
          id: string
          max_retries: number
          metadata: Json | null
          priority: string
          processed_at: string | null
          recipients: string[]
          retry_count: number
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients: string[]
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          data?: Json | null
          error_message?: string | null
          id?: string
          max_retries?: number
          metadata?: Json | null
          priority?: string
          processed_at?: string | null
          recipients?: string[]
          retry_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      push_notification_tokens: {
        Row: {
          created_at: string
          device_id: string | null
          device_name: string | null
          id: string
          is_active: boolean
          last_used: string | null
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          platform: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_used?: string | null
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      referral_system: {
        Row: {
          completed_at: string | null
          created_at: string
          currency: string
          id: string
          referee_id: string
          referee_reward_amount: number | null
          referral_code: string
          referrer_id: string
          referrer_reward_amount: number | null
          rewarded_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          referee_id: string
          referee_reward_amount?: number | null
          referral_code: string
          referrer_id: string
          referrer_reward_amount?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          currency?: string
          id?: string
          referee_id?: string
          referee_reward_amount?: number | null
          referral_code?: string
          referrer_id?: string
          referrer_reward_amount?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Relationships: []
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
      saved_addresses: {
        Row: {
          address_line: string
          address_type: string | null
          city: string
          commune: string | null
          coordinates: Json | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          last_used_at: string | null
          quartier: string | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          address_line: string
          address_type?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          last_used_at?: string | null
          quartier?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          address_line?: string
          address_type?: string | null
          city?: string
          commune?: string | null
          coordinates?: Json | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          last_used_at?: string | null
          quartier?: string | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          created_at: string | null
          error_message: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          risk_level: string | null
          success: boolean | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          risk_level?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          risk_level?: string | null
          success?: boolean | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_data_access_audit: {
        Row: {
          accessed_user_data: string | null
          created_at: string | null
          id: string
          ip_address: unknown | null
          operation: string
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_user_data?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          operation: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_user_data?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          operation?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
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
      service_change_requests: {
        Row: {
          created_at: string
          current_service_type: string
          driver_id: string
          id: string
          justification_documents: Json | null
          reason: string | null
          requested_at: string
          requested_service_type: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_comments: string | null
          service_category: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_service_type: string
          driver_id: string
          id?: string
          justification_documents?: Json | null
          reason?: string | null
          requested_at?: string
          requested_service_type: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          service_category: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_service_type?: string
          driver_id?: string
          id?: string
          justification_documents?: Json | null
          reason?: string | null
          requested_at?: string
          requested_service_type?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_comments?: string | null
          service_category?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_configurations: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean
          requirements: Json | null
          service_category: string
          service_type: string
          updated_at: string
          vehicle_requirements: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          service_category: string
          service_type: string
          updated_at?: string
          vehicle_requirements?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean
          requirements?: Json | null
          service_category?: string
          service_type?: string
          updated_at?: string
          vehicle_requirements?: Json | null
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          base_price: number
          city: string
          commission_rate: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          is_active: boolean
          maximum_fare: number | null
          minimum_fare: number
          price_per_km: number
          price_per_minute: number | null
          service_category: string
          service_type: string
          surge_multiplier: number | null
          updated_at: string
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          base_price?: number
          city?: string
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number | null
          service_category: string
          service_type: string
          surge_multiplier?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          base_price?: number
          city?: string
          commission_rate?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          is_active?: boolean
          maximum_fare?: number | null
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number | null
          service_category?: string
          service_type?: string
          surge_multiplier?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string | null
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
      support_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
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
          delivery_google_address: string | null
          delivery_google_place_id: string | null
          delivery_google_place_name: string | null
          destination: string
          destination_coordinates: Json | null
          driver_arrived_at: string | null
          driver_assigned_at: string | null
          driver_id: string | null
          estimated_price: number | null
          google_geocoded_at: string | null
          id: string
          intermediate_stops: Json | null
          notes: string | null
          pickup_coordinates: Json | null
          pickup_google_address: string | null
          pickup_google_place_id: string | null
          pickup_google_place_name: string | null
          pickup_location: string
          pickup_time: string | null
          rated: boolean | null
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
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          destination: string
          destination_coordinates?: Json | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          intermediate_stops?: Json | null
          notes?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location: string
          pickup_time?: string | null
          rated?: boolean | null
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
          delivery_google_address?: string | null
          delivery_google_place_id?: string | null
          delivery_google_place_name?: string | null
          destination?: string
          destination_coordinates?: Json | null
          driver_arrived_at?: string | null
          driver_assigned_at?: string | null
          driver_id?: string | null
          estimated_price?: number | null
          google_geocoded_at?: string | null
          id?: string
          intermediate_stops?: Json | null
          notes?: string | null
          pickup_coordinates?: Json | null
          pickup_google_address?: string | null
          pickup_google_place_id?: string | null
          pickup_google_place_name?: string | null
          pickup_location?: string
          pickup_time?: string | null
          rated?: boolean | null
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
      transport_chat_messages: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          message: string
          message_type: string
          metadata: Json | null
          read_at: string | null
          sender_id: string
          sender_type: string
          sent_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          message: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id: string
          sender_type: string
          sent_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
          sent_at?: string | null
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
      trip_share_links: {
        Row: {
          created_at: string
          created_by: string | null
          encrypted_data: string
          expires_at: string
          id: string
          is_active: boolean
          share_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          encrypted_data: string
          expires_at: string
          id?: string
          is_active?: boolean
          share_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          encrypted_data?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          share_id?: string
          trip_id?: string
          updated_at?: string
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
      unified_notifications: {
        Row: {
          category: string
          channels: string[]
          correlation_id: string | null
          created_at: string
          data: Json | null
          delivered_at: string | null
          delivery_status: Json
          expires_at: string | null
          id: string
          is_read: boolean
          max_retries: number
          message: string
          next_retry_at: string | null
          notification_type: string
          priority: string
          read_at: string | null
          reference_id: string | null
          reference_type: string | null
          retry_count: number
          sent_at: string | null
          source_event: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          channels?: string[]
          correlation_id?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_status?: Json
          expires_at?: string | null
          id?: string
          is_read?: boolean
          max_retries?: number
          message: string
          next_retry_at?: string | null
          notification_type: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          sent_at?: string | null
          source_event?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          channels?: string[]
          correlation_id?: string | null
          created_at?: string
          data?: Json | null
          delivered_at?: string | null
          delivery_status?: Json
          expires_at?: string | null
          id?: string
          is_read?: boolean
          max_retries?: number
          message?: string
          next_retry_at?: string | null
          notification_type?: string
          priority?: string
          read_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          retry_count?: number
          sent_at?: string | null
          source_event?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_location_preferences: {
        Row: {
          auto_save_favorites: boolean | null
          created_at: string | null
          id: string
          location_sharing: boolean | null
          preferred_city: string | null
          preferred_language: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_save_favorites?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_save_favorites?: boolean | null
          created_at?: string | null
          id?: string
          location_sharing?: boolean | null
          preferred_city?: string | null
          preferred_language?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_loyalty_points: {
        Row: {
          created_at: string
          current_points: number
          id: string
          loyalty_level: string
          total_earned_points: number
          total_spent_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_points?: number
          id?: string
          loyalty_level?: string
          total_earned_points?: number
          total_spent_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_points?: number
          id?: string
          loyalty_level?: string
          total_earned_points?: number
          total_spent_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_preferences: {
        Row: {
          app_theme: string
          auto_save_addresses: boolean
          created_at: string
          currency: string
          default_payment_method: string | null
          id: string
          language: string
          notification_preferences: Json
          share_location: boolean
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_theme?: string
          auto_save_addresses?: boolean
          created_at?: string
          currency?: string
          default_payment_method?: string | null
          id?: string
          language?: string
          notification_preferences?: Json
          share_location?: boolean
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_theme?: string
          auto_save_addresses?: boolean
          created_at?: string
          currency?: string
          default_payment_method?: string | null
          id?: string
          language?: string
          notification_preferences?: Json
          share_location?: boolean
          timezone?: string
          updated_at?: string
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
      user_recent_searches: {
        Row: {
          created_at: string | null
          id: string
          last_searched_at: string | null
          result_address: string | null
          result_latitude: number | null
          result_longitude: number | null
          search_count: number | null
          search_query: string
          selected: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          result_address?: string | null
          result_latitude?: number | null
          result_longitude?: number | null
          search_count?: number | null
          search_query: string
          selected?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_searched_at?: string | null
          result_address?: string | null
          result_latitude?: number | null
          result_longitude?: number | null
          search_count?: number | null
          search_query?: string
          selected?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          description: string
          expires_at: string | null
          id: string
          is_claimed: boolean
          points_required: number | null
          promo_code_id: string | null
          reward_type: string
          reward_value: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          description: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          points_required?: number | null
          promo_code_id?: string | null
          reward_type: string
          reward_value?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          is_claimed?: boolean
          points_required?: number | null
          promo_code_id?: string | null
          reward_type?: string
          reward_value?: number
          title?: string
          updated_at?: string
          user_id?: string
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
      user_saved_places: {
        Row: {
          address: string
          created_at: string | null
          id: string
          last_used_at: string | null
          latitude: number
          longitude: number
          metadata: Json | null
          name: string
          place_type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          latitude: number
          longitude: number
          metadata?: Json | null
          name: string
          place_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          latitude?: number
          longitude?: number
          metadata?: Json | null
          name?: string
          place_type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          created_at: string
          data_sharing_consent: boolean
          id: string
          location_tracking: boolean
          login_notifications: boolean
          marketing_consent: boolean
          privacy_mode: boolean
          transaction_notifications: boolean
          two_factor_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_sharing_consent?: boolean
          id?: string
          location_tracking?: boolean
          login_notifications?: boolean
          marketing_consent?: boolean
          privacy_mode?: boolean
          transaction_notifications?: boolean
          two_factor_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_sharing_consent?: boolean
          id?: string
          location_tracking?: boolean
          login_notifications?: boolean
          marketing_consent?: boolean
          privacy_mode?: boolean
          transaction_notifications?: boolean
          two_factor_enabled?: boolean
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
      webhook_audit_logs: {
        Row: {
          correlation_id: string | null
          created_at: string
          error_message: string | null
          event_type: string
          execution_time_ms: number | null
          id: string
          ip_address: unknown | null
          payload: Json
          response_data: Json | null
          response_status: number | null
          retry_count: number
          success: boolean
          user_agent: string | null
          user_id: string | null
          webhook_type: string
        }
        Insert: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown | null
          payload?: Json
          response_data?: Json | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          webhook_type: string
        }
        Update: {
          correlation_id?: string | null
          created_at?: string
          error_message?: string | null
          event_type?: string
          execution_time_ms?: number | null
          id?: string
          ip_address?: unknown | null
          payload?: Json
          response_data?: Json | null
          response_status?: number | null
          retry_count?: number
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
          webhook_type?: string
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
      monitoring_stats: {
        Row: {
          avg_response_time: number | null
          error_rate_percent: number | null
          failed_calls: number | null
          function_name: string | null
          last_check: string | null
          successful_calls: number | null
          total_calls: number | null
        }
        Relationships: []
      }
      security_configuration_status: {
        Row: {
          component: string | null
          description: string | null
          security_note: string | null
          status: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_cancel_subscription: {
        Args: {
          p_reason?: string
          p_subscription_id: string
          p_subscription_type: string
        }
        Returns: Json
      }
      admin_extend_subscription: {
        Args: {
          p_days: number
          p_subscription_id: string
          p_subscription_type: string
        }
        Returns: Json
      }
      anonymize_old_location_data: {
        Args: { days_old?: number }
        Returns: number
      }
      audit_security_definer_functions: {
        Args: Record<PropertyKey, never>
        Returns: {
          function_name: string
          risk_level: string
          security_justification: string
        }[]
      }
      auto_monitor_edge_functions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      automated_security_maintenance: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_delivery_estimate: {
        Args: { order_id_param: string }
        Returns: string
      }
      calculate_delivery_price: {
        Args: {
          city_param?: string
          delivery_type_param: string
          distance_km_param: number
        }
        Returns: Json
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
      calculate_risk_score: {
        Args: {
          p_action_type: string
          p_time_window_hours?: number
          p_user_id: string
        }
        Returns: number
      }
      calculate_service_price: {
        Args: {
          p_city?: string
          p_distance_km: number
          p_duration_minutes?: number
          p_service_category: string
          p_service_type: string
        }
        Returns: Json
      }
      calculate_surge_pricing: {
        Args: { vehicle_class_param: string; zone_id_param: string }
        Returns: number
      }
      calculate_user_loyalty_points: {
        Args: { p_user_id: string }
        Returns: Json
      }
      calculate_zone_statistics: {
        Args: {
          date_param?: string
          hour_param?: number
          zone_id_param: string
        }
        Returns: undefined
      }
      check_admin_status_for_rls: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_driver_location_access: {
        Args: { target_driver_id: string }
        Returns: boolean
      }
      check_location_search_rate_limit: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_security_configuration: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          security_item: string
          status: string
        }[]
      }
      check_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          check_name: string
          details: string
          status: string
        }[]
      }
      check_super_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      check_user_admin_role_secure: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      cleanup_expired_location_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_trip_links: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_ip_geolocation_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_monitoring_logs: {
        Args: { days_to_keep?: number }
        Returns: number
      }
      cleanup_old_audit_logs: {
        Args: Record<PropertyKey, never> | { retention_days?: number }
        Returns: number
      }
      cleanup_old_geocode_data: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_old_notifications: {
        Args: { days_old?: number }
        Returns: number
      }
      cleanup_security_definer_views: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      cleanup_security_logs: {
        Args: { retention_days?: number }
        Returns: number
      }
      cleanup_security_vulnerabilities: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      cleanup_sensitive_data_automated: {
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
      create_trip_share_link: {
        Args: {
          p_encrypted_data: string
          p_expires_at: string
          p_share_id: string
          p_trip_id: string
        }
        Returns: string
      }
      deactivate_old_tokens: {
        Args: { p_platform: string; p_user_id: string }
        Returns: undefined
      }
      deactivate_trip_share_link: {
        Args: { p_share_id: string }
        Returns: boolean
      }
      delivery_status_manager: {
        Args: {
          additional_data?: Json
          driver_id_param?: string
          location_coords?: Json
          new_status: string
          order_id: string
        }
        Returns: Json
      }
      disable_user_notifications: {
        Args: { p_user_id: string }
        Returns: undefined
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
        Args:
          | {
              max_distance_km?: number
              pickup_lat: number
              pickup_lng: number
              vehicle_class_filter?: string
            }
          | {
              pickup_lat: number
              pickup_lng: number
              radius_km?: number
              service_type_param?: string
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
      find_nearby_drivers_secure: {
        Args:
          | {
              max_distance_km?: number
              user_lat: number
              user_lng: number
              vehicle_class_filter?: string
            }
          | {
              pickup_lat: number
              pickup_lng: number
              radius_km?: number
              service_type_param: string
              vehicle_class_filter?: string
            }
        Returns: {
          distance_km: number
          driver_id: string
          estimated_arrival_minutes: number
          is_available: boolean
          rating_average: number
          vehicle_class: string
        }[]
      }
      fix_invalid_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      generate_driver_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_driver_code_secure: {
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
      generate_security_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          details: string
          last_check: string
          recommendations: string
          status: string
        }[]
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
      get_available_drivers_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          avg_rating: number
          city: string
          total_available_drivers: number
          vehicle_class: string
        }[]
      }
      get_current_user_admin_status: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      get_driver_current_service: {
        Args: { p_driver_id: string }
        Returns: Json
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
      get_driver_exact_location_admin: {
        Args: { p_driver_id: string }
        Returns: {
          is_available: boolean
          is_online: boolean
          last_ping: string
          latitude: number
          longitude: number
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
      get_manual_security_tasks: {
        Args: Record<PropertyKey, never>
        Returns: {
          action: string
          location: string
          task: string
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
      get_migration_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_nearby_active_drivers_enhanced: {
        Args: {
          max_results?: number
          radius_km?: number
          search_lat: number
          search_lng: number
          vehicle_class_filter?: string
        }
        Returns: {
          distance_km: number
          driver_id: string
          is_verified: boolean
          last_ping: string
          vehicle_class: string
        }[]
      }
      get_notification_stats: {
        Args: { admin_id?: string }
        Returns: Json
      }
      get_partner_by_code: {
        Args: { driver_code: string }
        Returns: {
          commission_rate: number
          is_active: boolean
          partner_id: string
          partner_name: string
        }[]
      }
      get_partner_earnings_secure: {
        Args: { date_range?: string; partner_user_id: string }
        Returns: {
          driver_count: number
          total_bookings: number
          total_commission: number
          total_revenue: number
        }[]
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
      get_referral_reward_amount: {
        Args: { p_user_id: string }
        Returns: number
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
      get_security_alerts_current: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_type: string
          created_at: string
          message: string
          severity: string
          user_id: string
        }[]
      }
      get_security_compliance_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          category: string
          compliance_level: string
          details: string
          status: string
        }[]
      }
      get_security_dashboard_metrics: {
        Args: Record<PropertyKey, never>
        Returns: {
          alert_level: string
          description: string
          metric_name: string
          metric_value: string
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
      get_security_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_type: string
          details: string
          status: string
        }[]
      }
      get_service_price: {
        Args: {
          p_base_distance?: number
          p_city?: string
          p_service_type: string
        }
        Returns: Json
      }
      get_transport_chat_messages: {
        Args: { p_booking_id: string }
        Returns: {
          booking_id: string
          id: string
          message: string
          message_type: string
          metadata: Json
          read_at: string
          sender_id: string
          sender_type: string
          sent_at: string
        }[]
      }
      get_trip_share_data: {
        Args: { p_share_id: string }
        Returns: {
          created_at: string
          encrypted_data: string
          expires_at: string
          id: string
          is_active: boolean
          share_id: string
          trip_id: string
        }[]
      }
      get_user_role: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_role_secure: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_roles: {
        Args: { p_user_id: string }
        Returns: {
          admin_role: string
          permissions: string[]
          role: string
        }[]
      }
      get_user_type: {
        Args: { p_user_id: string }
        Returns: string
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
      has_admin_permission: {
        Args: { permission_name: string }
        Returns: boolean
      }
      has_permission: {
        Args: { p_permission: string; p_user_id: string }
        Returns: boolean
      }
      has_user_role: {
        Args: { check_role: string }
        Returns: boolean
      }
      increment_address_usage: {
        Args: { address_id: string }
        Returns: undefined
      }
      insert_booking_report: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_reason: string
          p_user_id: string
        }
        Returns: string
      }
      insert_driver_rating: {
        Args: {
          p_booking_id: string
          p_driver_id: string
          p_feedback?: string
          p_rating: number
          p_user_id: string
        }
        Returns: string
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
      intelligent_places_search_enhanced: {
        Args: {
          include_nearby?: boolean
          max_results?: number
          search_city?: string
          search_query?: string
          user_latitude?: number
          user_longitude?: number
        }
        Returns: {
          avenue: string
          badge: string
          category: string
          city: string
          commune: string
          distance_meters: number
          formatted_address: string
          hierarchy_level: number
          id: string
          latitude: number
          longitude: number
          name: string
          popularity_score: number
          quartier: string
          relevance_score: number
          subcategory: string
          subtitle: string
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
      is_user_admin_secure: {
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
      log_driver_registration_attempt: {
        Args:
          | { p_email: string; p_error_message?: string; p_success: boolean }
          | {
              p_error_message?: string
              p_registration_data?: Json
              p_success: boolean
              p_user_id: string
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
      log_geolocation_access: {
        Args: {
          p_action_type: string
          p_encrypted_payload?: string
          p_location_data?: Json
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: undefined
      }
      log_location_access: {
        Args: {
          access_type_param: string
          drivers_found_count?: number
          search_lat?: number
          search_lng?: number
          search_radius?: number
        }
        Returns: undefined
      }
      log_notification_event: {
        Args: {
          p_event_type: string
          p_notification_data: Json
          p_user_id: string
        }
        Returns: undefined
      }
      log_partner_audit_event: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_new_status?: string
          p_old_status?: string
          p_partner_id: string
          p_reason?: string
        }
        Returns: string
      }
      log_security_audit: {
        Args: { action_type: string; table_accessed: string; user_data?: Json }
        Returns: undefined
      }
      log_security_event: {
        Args:
          | {
              p_action_type: string
              p_error_message?: string
              p_metadata?: Json
              p_resource_id?: string
              p_resource_type: string
              p_success?: boolean
            }
          | { p_details?: Json; p_event_type: string; p_severity?: string }
        Returns: undefined
      }
      log_sensitive_access: {
        Args: {
          p_accessed_user_data?: string
          p_operation: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_sensitive_access_enhanced: {
        Args: {
          p_operation: string
          p_table_name: string
          p_target_user_id?: string
        }
        Returns: boolean
      }
      log_sensitive_access_secure: {
        Args: {
          p_accessed_user_data?: string
          p_metadata?: Json
          p_operation: string
          p_table_name: string
        }
        Returns: string
      }
      log_sensitive_data_access: {
        Args:
          | {
              p_access_reason?: string
              p_access_type?: string
              p_accessed_columns?: string[]
              p_target_record_id?: string
              p_target_table: string
            }
          | {
              p_accessed_user_id?: string
              p_metadata?: Json
              p_operation: string
              p_table_name: string
            }
        Returns: undefined
      }
      log_subscription_access: {
        Args: {
          p_operation: string
          p_subscription_id?: string
          p_table_name: string
        }
        Returns: undefined
      }
      log_system_activity: {
        Args: {
          p_activity_type: string
          p_description: string
          p_metadata?: Json
        }
        Returns: string
      }
      maintain_security_compliance: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          recommendation: string
          status: string
        }[]
      }
      map_legacy_data_to_service: {
        Args: { p_delivery_capacity?: string; p_vehicle_type?: string }
        Returns: string
      }
      mark_message_as_read: {
        Args: { p_message_id: string }
        Returns: undefined
      }
      migrate_coordinates_to_google_addresses: {
        Args: Record<PropertyKey, never>
        Returns: {
          processed_bookings: number
          processed_deliveries: number
          processed_drivers: number
        }[]
      }
      monitor_security_events: {
        Args: Record<PropertyKey, never>
        Returns: {
          event_count: number
          event_type: string
          last_occurrence: string
          severity: string
        }[]
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
      refresh_driver_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_security_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      run_security_maintenance: {
        Args: Record<PropertyKey, never>
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
      security_audit_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          category: string
          details: string
          status: string
        }[]
      }
      security_definer_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          recommendation: string
          status: string
          view_count: number
        }[]
      }
      security_diagnostic: {
        Args: Record<PropertyKey, never>
        Returns: {
          check_name: string
          recommendation: string
          result: string
        }[]
      }
      security_health_check: {
        Args: Record<PropertyKey, never>
        Returns: {
          action_required: string
          check_type: string
          details: string
          status: string
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
      send_transport_chat_message: {
        Args: {
          p_booking_id: string
          p_message: string
          p_message_type?: string
          p_sender_id: string
        }
        Returns: string
      }
      update_trip_share_location: {
        Args: { p_encrypted_data: string; p_share_id: string }
        Returns: boolean
      }
      upsert_push_token: {
        Args: { p_platform: string; p_token: string; p_user_id: string }
        Returns: undefined
      }
      user_exists: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      validate_and_fix_delivery_coordinates: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      validate_booking_coordinates: {
        Args: { delivery_coords: Json; pickup_coords: Json }
        Returns: Json
      }
      validate_driver_registration_data: {
        Args:
          | {
              p_email: string
              p_license_number: string
              p_phone_number: string
              p_user_id?: string
              p_vehicle_plate: string
            }
          | {
              p_email: string
              p_license_number: string
              p_phone_number: string
              p_vehicle_plate?: string
            }
          | { registration_data: Json }
        Returns: Json
      }
      validate_google_address: {
        Args: { address_text: string }
        Returns: boolean
      }
      validate_partner_registration_secure: {
        Args: {
          p_commission_rate?: number
          p_company_name: string
          p_email: string
          p_phone_number: string
        }
        Returns: Json
      }
      validate_service_requirements: {
        Args: { p_requirements: Json; p_service_type: string }
        Returns: Json
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
      delivery_service_type: "flash" | "flex" | "maxicharge"
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
      taxi_service_type: "moto" | "eco" | "confort" | "premium"
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
      delivery_service_type: ["flash", "flex", "maxicharge"],
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
      taxi_service_type: ["moto", "eco", "confort", "premium"],
      user_role: ["client", "driver", "partner", "admin"],
    },
  },
} as const
