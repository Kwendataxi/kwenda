export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
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
      delivery_orders: {
        Row: {
          actual_price: number | null
          created_at: string
          delivery_coordinates: Json | null
          delivery_location: string
          delivery_time: string | null
          delivery_type: string
          driver_id: string | null
          estimated_price: number | null
          id: string
          loading_assistance: boolean | null
          order_time: string
          package_type: string | null
          pickup_coordinates: Json | null
          pickup_location: string
          pickup_time: string | null
          status: string | null
          updated_at: string
          user_id: string
          vehicle_size: string | null
        }
        Insert: {
          actual_price?: number | null
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_location: string
          delivery_time?: string | null
          delivery_type: string
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          pickup_coordinates?: Json | null
          pickup_location: string
          pickup_time?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          vehicle_size?: string | null
        }
        Update: {
          actual_price?: number | null
          created_at?: string
          delivery_coordinates?: Json | null
          delivery_location?: string
          delivery_time?: string | null
          delivery_type?: string
          driver_id?: string | null
          estimated_price?: number | null
          id?: string
          loading_assistance?: boolean | null
          order_time?: string
          package_type?: string | null
          pickup_coordinates?: Json | null
          pickup_location?: string
          pickup_time?: string | null
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
      driver_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          is_available: boolean
          is_online: boolean
          last_ping: string
          latitude: number
          longitude: number
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
          last_ping?: string
          latitude: number
          longitude: number
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
          last_ping?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          updated_at?: string
          vehicle_class?: string | null
        }
        Relationships: []
      }
      driver_profiles: {
        Row: {
          created_at: string
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
          buyer_id: string
          completed_at: string | null
          confirmed_at: string | null
          created_at: string
          delivered_at: string | null
          delivery_address: string | null
          delivery_coordinates: Json | null
          delivery_method: string
          id: string
          notes: string | null
          payment_status: string
          product_id: string
          quantity: number
          seller_id: string
          status: string
          total_amount: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_coordinates?: Json | null
          delivery_method?: string
          id?: string
          notes?: string | null
          payment_status?: string
          product_id: string
          quantity?: number
          seller_id: string
          status?: string
          total_amount: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string
          delivered_at?: string | null
          delivery_address?: string | null
          delivery_coordinates?: Json | null
          delivery_method?: string
          id?: string
          notes?: string | null
          payment_status?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          status?: string
          total_amount?: number
          unit_price?: number
          updated_at?: string
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
          price?: number
          seller_id?: string
          status?: string | null
          subcategory?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
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
      pricing_rules: {
        Row: {
          base_price: number
          city: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          minimum_fare: number
          price_per_km: number
          price_per_minute: number
          service_type: string
          surge_multiplier: number
          updated_at: string
          vehicle_class: string
        }
        Insert: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
        }
        Update: {
          base_price?: number
          city?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          minimum_fare?: number
          price_per_km?: number
          price_per_minute?: number
          service_type?: string
          surge_multiplier?: number
          updated_at?: string
          vehicle_class?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          phone_number: string | null
          updated_at: string
          user_id: string
          user_type: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          phone_number?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
        }
        Relationships: []
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
      team_accounts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          settings?: Json | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_driver_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
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
