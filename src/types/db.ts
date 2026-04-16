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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      analysis_files: {
        Row: {
          column_count: number | null
          columns: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          last_analyzed_at: string | null
          metadata: Json | null
          mime_type: string
          name: string
          org_id: string
          preview: Json | null
          row_count: number | null
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          metadata?: Json | null
          mime_type: string
          name: string
          org_id: string
          preview?: Json | null
          row_count?: number | null
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Update: {
          column_count?: number | null
          columns?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_analyzed_at?: string | null
          metadata?: Json | null
          mime_type?: string
          name?: string
          org_id?: string
          preview?: Json | null
          row_count?: number | null
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_files_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string
          id: number
          ip_hash: string | null
          name: string
          org_id: string | null
          properties: Json
          request_id: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          ip_hash?: string | null
          name: string
          org_id?: string | null
          properties?: Json
          request_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          ip_hash?: string | null
          name?: string
          org_id?: string | null
          properties?: Json
          request_id?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      assistants: {
        Row: {
          audience: string | null
          avatar_url: string | null
          banned_words: string[] | null
          business_name: string
          created_at: string
          custom_instructions: string | null
          deleted_at: string | null
          description: string | null
          goals: string[] | null
          id: string
          industry: string | null
          is_active: boolean
          is_default: boolean
          languages: string[]
          name: string
          org_id: string
          preferred_image_model: string | null
          preferred_text_model: string | null
          prompt_version_id: string | null
          services: string[] | null
          slug: string
          temperature: number | null
          tone: string[] | null
          updated_at: string
          visual_style: string | null
          voice_enabled: boolean
          voice_id: string | null
          voice_provider: string | null
          voice_speed: number | null
          website: string | null
          writing_style: string | null
        }
        Insert: {
          audience?: string | null
          avatar_url?: string | null
          banned_words?: string[] | null
          business_name: string
          created_at?: string
          custom_instructions?: string | null
          deleted_at?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_default?: boolean
          languages?: string[]
          name: string
          org_id: string
          preferred_image_model?: string | null
          preferred_text_model?: string | null
          prompt_version_id?: string | null
          services?: string[] | null
          slug: string
          temperature?: number | null
          tone?: string[] | null
          updated_at?: string
          visual_style?: string | null
          voice_enabled?: boolean
          voice_id?: string | null
          voice_provider?: string | null
          voice_speed?: number | null
          website?: string | null
          writing_style?: string | null
        }
        Update: {
          audience?: string | null
          avatar_url?: string | null
          banned_words?: string[] | null
          business_name?: string
          created_at?: string
          custom_instructions?: string | null
          deleted_at?: string | null
          description?: string | null
          goals?: string[] | null
          id?: string
          industry?: string | null
          is_active?: boolean
          is_default?: boolean
          languages?: string[]
          name?: string
          org_id?: string
          preferred_image_model?: string | null
          preferred_text_model?: string | null
          prompt_version_id?: string | null
          services?: string[] | null
          slug?: string
          temperature?: number | null
          tone?: string[] | null
          updated_at?: string
          visual_style?: string | null
          voice_enabled?: boolean
          voice_id?: string | null
          voice_provider?: string | null
          voice_speed?: number | null
          website?: string | null
          writing_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assistants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assistants_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_profile: {
        Row: {
          brand_name: string | null
          description: string | null
          first_prompt: string | null
          logo_url: string | null
          org_id: string
          updated_at: string
          user_role: string | null
          vibe: string | null
        }
        Insert: {
          brand_name?: string | null
          description?: string | null
          first_prompt?: string | null
          logo_url?: string | null
          org_id: string
          updated_at?: string
          user_role?: string | null
          vibe?: string | null
        }
        Update: {
          brand_name?: string | null
          description?: string | null
          first_prompt?: string | null
          logo_url?: string | null
          org_id?: string
          updated_at?: string
          user_role?: string | null
          vibe?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_profile_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_shares: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_viewed_at: string | null
          org_id: string
          revoked_at: string | null
          slug: string
          title: string | null
          updated_at: string
          user_id: string
          view_count: number
          visibility: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          org_id: string
          revoked_at?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
          user_id: string
          view_count?: number
          visibility?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_viewed_at?: string | null
          org_id?: string
          revoked_at?: string | null
          slug?: string
          title?: string | null
          updated_at?: string
          user_id?: string
          view_count?: number
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_shares_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_shares_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          agent_type: string | null
          assistant_id: string
          created_at: string
          deleted_at: string | null
          id: string
          is_archived: boolean
          is_starred: boolean
          last_message_at: string | null
          locale: string | null
          message_count: number
          org_id: string
          project_id: string | null
          summary: string | null
          title: string | null
          token_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string | null
          assistant_id: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_starred?: boolean
          last_message_at?: string | null
          locale?: string | null
          message_count?: number
          org_id: string
          project_id?: string | null
          summary?: string | null
          title?: string | null
          token_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string | null
          assistant_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_archived?: boolean
          is_starred?: boolean
          last_message_at?: string | null
          locale?: string | null
          message_count?: number
          org_id?: string
          project_id?: string | null
          summary?: string | null
          title?: string | null
          token_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_hash: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          org_id: string
          page_number: number | null
          section_heading: string | null
          token_count: number
          tsv: unknown
        }
        Insert: {
          chunk_index: number
          content: string
          content_hash: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          org_id: string
          page_number?: number | null
          section_heading?: string | null
          token_count: number
          tsv?: unknown
        }
        Update: {
          chunk_index?: number
          content?: string
          content_hash?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          org_id?: string
          page_number?: number | null
          section_heading?: string | null
          token_count?: number
          tsv?: unknown
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          assistant_scope: string[] | null
          checksum_sha256: string | null
          chunk_count: number
          created_at: string
          deleted_at: string | null
          description: string | null
          extracted_text_preview: string | null
          id: string
          mime_type: string
          org_id: string
          original_name: string
          processed_at: string | null
          processing_error: string | null
          project_id: string | null
          size_bytes: number
          status: Database["public"]["Enums"]["document_status"]
          storage_bucket: string
          storage_path: string
          tags: string[] | null
          title: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          assistant_scope?: string[] | null
          checksum_sha256?: string | null
          chunk_count?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          extracted_text_preview?: string | null
          id?: string
          mime_type: string
          org_id: string
          original_name: string
          processed_at?: string | null
          processing_error?: string | null
          project_id?: string | null
          size_bytes: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket?: string
          storage_path: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          assistant_scope?: string[] | null
          checksum_sha256?: string | null
          chunk_count?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          extracted_text_preview?: string | null
          id?: string
          mime_type?: string
          org_id?: string
          original_name?: string
          processed_at?: string | null
          processing_error?: string | null
          project_id?: string | null
          size_bytes?: number
          status?: Database["public"]["Enums"]["document_status"]
          storage_bucket?: string
          storage_path?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          details: Json | null
          fail_count: number
          id: string
          model: string
          pass_count: number
          prompt_version_id: string | null
          scores: Json | null
          started_at: string | null
          status: string
          suite_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          fail_count?: number
          id?: string
          model: string
          pass_count?: number
          prompt_version_id?: string | null
          scores?: Json | null
          started_at?: string | null
          status?: string
          suite_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          details?: Json | null
          fail_count?: number
          id?: string
          model?: string
          pass_count?: number
          prompt_version_id?: string | null
          scores?: Json | null
          started_at?: string | null
          status?: string
          suite_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "eval_runs_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eval_runs_suite_id_fkey"
            columns: ["suite_id"]
            isOneToOne: false
            referencedRelation: "eval_suites"
            referencedColumns: ["id"]
          },
        ]
      }
      eval_suites: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          test_cases: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          test_cases: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          test_cases?: Json
        }
        Relationships: []
      }
      feedback: {
        Row: {
          categories: string[] | null
          comment: string | null
          conversation_id: string | null
          created_at: string
          id: string
          image_id: string | null
          kind: Database["public"]["Enums"]["feedback_kind"]
          message_id: string | null
          org_id: string
          rating: number | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          kind: Database["public"]["Enums"]["feedback_kind"]
          message_id?: string | null
          org_id: string
          rating?: number | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          comment?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          image_id?: string | null
          kind?: Database["public"]["Enums"]["feedback_kind"]
          message_id?: string | null
          org_id?: string
          rating?: number | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      image_generations: {
        Row: {
          aspect_ratio: string
          assistant_id: string | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string
          enhanced_prompt: string | null
          error_message: string | null
          height: number | null
          id: string
          is_starred: boolean
          latency_ms: number | null
          message_id: string | null
          model: string
          negative_prompt: string | null
          org_id: string
          output_storage_paths: string[] | null
          output_urls: string[] | null
          parent_image_id: string | null
          preset: string | null
          prompt: string
          provider: string
          provider_job_id: string | null
          reference_mime_type: string | null
          reference_storage_path: string | null
          seed: number | null
          status: Database["public"]["Enums"]["image_status"]
          tags: string[] | null
          updated_at: string
          user_id: string | null
          width: number | null
        }
        Insert: {
          aspect_ratio?: string
          assistant_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          enhanced_prompt?: string | null
          error_message?: string | null
          height?: number | null
          id?: string
          is_starred?: boolean
          latency_ms?: number | null
          message_id?: string | null
          model: string
          negative_prompt?: string | null
          org_id: string
          output_storage_paths?: string[] | null
          output_urls?: string[] | null
          parent_image_id?: string | null
          preset?: string | null
          prompt: string
          provider: string
          provider_job_id?: string | null
          reference_mime_type?: string | null
          reference_storage_path?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          width?: number | null
        }
        Update: {
          aspect_ratio?: string
          assistant_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          enhanced_prompt?: string | null
          error_message?: string | null
          height?: number | null
          id?: string
          is_starred?: boolean
          latency_ms?: number | null
          message_id?: string | null
          model?: string
          negative_prompt?: string | null
          org_id?: string
          output_storage_paths?: string[] | null
          output_urls?: string[] | null
          parent_image_id?: string | null
          preset?: string | null
          prompt?: string
          provider?: string
          provider_job_id?: string | null
          reference_mime_type?: string | null
          reference_storage_path?: string | null
          seed?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "image_generations_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_parent_image_id_fkey"
            columns: ["parent_image_id"]
            isOneToOne: false
            referencedRelation: "image_generations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_generations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          composio_connection_id: string | null
          composio_entity_id: string | null
          connected_at: string | null
          created_at: string
          id: string
          last_used_at: string | null
          metadata: Json | null
          org_id: string
          provider: string
          scopes: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          composio_connection_id?: string | null
          composio_entity_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          org_id: string
          provider: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          composio_connection_id?: string | null
          composio_entity_id?: string | null
          connected_at?: string | null
          created_at?: string
          id?: string
          last_used_at?: string | null
          metadata?: Json | null
          org_id?: string
          provider?: string
          scopes?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "integrations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          role: Database["public"]["Enums"]["membership_role"]
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          org_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          token: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_due_usd: number | null
          amount_paid_usd: number | null
          created_at: string
          currency: string | null
          id: string
          org_id: string
          period_end: string | null
          period_start: string | null
          status: string | null
          stripe_hosted_invoice_url: string | null
          stripe_pdf_url: string | null
          subscription_id: string | null
        }
        Insert: {
          amount_due_usd?: number | null
          amount_paid_usd?: number | null
          created_at?: string
          currency?: string | null
          id: string
          org_id: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_hosted_invoice_url?: string | null
          stripe_pdf_url?: string | null
          subscription_id?: string | null
        }
        Update: {
          amount_due_usd?: number | null
          amount_paid_usd?: number | null
          created_at?: string
          currency?: string | null
          id?: string
          org_id?: string
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          stripe_hosted_invoice_url?: string | null
          stripe_pdf_url?: string | null
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          inngest_run_id: string | null
          kind: string
          org_id: string | null
          payload: Json | null
          started_at: string | null
          status: Database["public"]["Enums"]["job_status"]
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          inngest_run_id?: string | null
          kind: string
          org_id?: string | null
          payload?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          inngest_run_id?: string | null
          kind?: string
          org_id?: string | null
          payload?: Json | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["job_status"]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          org_id: string
          role: Database["public"]["Enums"]["membership_role"]
          status: Database["public"]["Enums"]["membership_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["membership_role"]
          status?: Database["public"]["Enums"]["membership_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          importance: number
          is_active: boolean
          org_id: string
          source: string | null
          source_conversation_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          importance?: number
          is_active?: boolean
          org_id: string
          source?: string | null
          source_conversation_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          importance?: number
          is_active?: boolean
          org_id?: string
          source?: string | null
          source_conversation_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      memory_entries: {
        Row: {
          assistant_id: string | null
          category: string
          confidence: number | null
          content: string
          context: string | null
          created_at: string
          embedding: string | null
          id: string
          is_hidden: boolean
          is_pinned: boolean
          last_used_at: string | null
          org_id: string
          scope: Database["public"]["Enums"]["memory_scope"]
          source: Database["public"]["Enums"]["memory_source"]
          source_conversation_id: string | null
          source_message_id: string | null
          updated_at: string
          use_count: number
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          category: string
          confidence?: number | null
          content: string
          context?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          last_used_at?: string | null
          org_id: string
          scope: Database["public"]["Enums"]["memory_scope"]
          source?: Database["public"]["Enums"]["memory_source"]
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string
          use_count?: number
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          category?: string
          confidence?: number | null
          content?: string
          context?: string | null
          created_at?: string
          embedding?: string | null
          id?: string
          is_hidden?: boolean
          is_pinned?: boolean
          last_used_at?: string | null
          org_id?: string
          scope?: Database["public"]["Enums"]["memory_scope"]
          source?: Database["public"]["Enums"]["memory_source"]
          source_conversation_id?: string | null
          source_message_id?: string | null
          updated_at?: string
          use_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "memory_entries_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_source_conversation_id_fkey"
            columns: ["source_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_source_message_id_fkey"
            columns: ["source_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memory_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_ids: string[] | null
          content: string | null
          content_parts: Json | null
          context_doc_chunks: string[] | null
          context_memories: string[] | null
          conversation_id: string
          cost_usd: number | null
          created_at: string
          error_code: string | null
          error_message: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          org_id: string
          output_tokens: number | null
          parent_message_id: string | null
          prompt_version_id: string | null
          provider: string | null
          role: Database["public"]["Enums"]["message_role"]
          status: Database["public"]["Enums"]["message_status"]
          tool_calls: Json | null
          tool_results: Json | null
          updated_at: string
          user_id: string | null
          voice_request_id: string | null
        }
        Insert: {
          attachment_ids?: string[] | null
          content?: string | null
          content_parts?: Json | null
          context_doc_chunks?: string[] | null
          context_memories?: string[] | null
          conversation_id: string
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          org_id: string
          output_tokens?: number | null
          parent_message_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          role: Database["public"]["Enums"]["message_role"]
          status?: Database["public"]["Enums"]["message_status"]
          tool_calls?: Json | null
          tool_results?: Json | null
          updated_at?: string
          user_id?: string | null
          voice_request_id?: string | null
        }
        Update: {
          attachment_ids?: string[] | null
          content?: string | null
          content_parts?: Json | null
          context_doc_chunks?: string[] | null
          context_memories?: string[] | null
          conversation_id?: string
          cost_usd?: number | null
          created_at?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          org_id?: string
          output_tokens?: number | null
          parent_message_id?: string | null
          prompt_version_id?: string | null
          provider?: string | null
          role?: Database["public"]["Enums"]["message_role"]
          status?: Database["public"]["Enums"]["message_status"]
          tool_calls?: Json | null
          tool_results?: Json | null
          updated_at?: string
          user_id?: string | null
          voice_request_id?: string | null
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
            foreignKeyName: "messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_prompt_version_id_fkey"
            columns: ["prompt_version_id"]
            isOneToOne: false
            referencedRelation: "prompt_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_state: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          current_step: number | null
          data: Json | null
          org_id: string | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          current_step?: number | null
          data?: Json | null
          org_id?: string | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          current_step?: number | null
          data?: Json | null
          org_id?: string | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_state_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_accent: string | null
          brand_primary: string | null
          country: string | null
          created_at: string
          custom_domain: string | null
          deleted_at: string | null
          id: string
          industry: string | null
          locale_default: string
          logo_url: string | null
          name: string
          onboarding_status: string
          owner_user_id: string
          size: string | null
          slug: string
          timezone: string
          updated_at: string
          website: string | null
        }
        Insert: {
          brand_accent?: string | null
          brand_primary?: string | null
          country?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          industry?: string | null
          locale_default?: string
          logo_url?: string | null
          name: string
          onboarding_status?: string
          owner_user_id: string
          size?: string | null
          slug: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          brand_accent?: string | null
          brand_primary?: string | null
          country?: string | null
          created_at?: string
          custom_domain?: string | null
          deleted_at?: string | null
          id?: string
          industry?: string | null
          locale_default?: string
          logo_url?: string | null
          name?: string
          onboarding_status?: string
          owner_user_id?: string
          size?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          entitlements: Json
          id: string
          is_default: boolean
          is_public: boolean
          name: string
          price_monthly_usd: number | null
          price_yearly_usd: number | null
          sort_order: number
          stripe_price_monthly_id: string | null
          stripe_price_yearly_id: string | null
          stripe_product_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entitlements?: Json
          id: string
          is_default?: boolean
          is_public?: boolean
          name: string
          price_monthly_usd?: number | null
          price_yearly_usd?: number | null
          sort_order?: number
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entitlements?: Json
          id?: string
          is_default?: boolean
          is_public?: boolean
          name?: string
          price_monthly_usd?: number | null
          price_yearly_usd?: number | null
          sort_order?: number
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_archived: boolean
          name: string
          org_id: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name: string
          org_id: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_archived?: boolean
          name?: string
          org_id?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_versions: {
        Row: {
          canary_weight: number | null
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          is_canary: boolean
          promoted_at: string | null
          slug: string
          version: number
        }
        Insert: {
          canary_weight?: number | null
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_canary?: boolean
          promoted_at?: string | null
          slug: string
          version: number
        }
        Update: {
          canary_weight?: number | null
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          is_canary?: boolean
          promoted_at?: string | null
          slug?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "prompt_versions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string | null
          cancel_at: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json
          org_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          billing_interval?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          org_id: string
          plan_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          billing_interval?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          org_id?: string
          plan_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          assistant_id: string | null
          cost_usd: number | null
          created_at: string
          id: number
          kind: Database["public"]["Enums"]["usage_kind"]
          metadata: Json | null
          org_id: string
          quantity: number
          source_id: string | null
          source_table: string | null
          user_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: number
          kind: Database["public"]["Enums"]["usage_kind"]
          metadata?: Json | null
          org_id: string
          quantity: number
          source_id?: string | null
          source_table?: string | null
          user_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          cost_usd?: number | null
          created_at?: string
          id?: number
          kind?: Database["public"]["Enums"]["usage_kind"]
          metadata?: Json | null
          org_id?: string
          quantity?: number
          source_id?: string | null
          source_table?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_periods: {
        Row: {
          chat_messages: number
          created_at: string
          document_storage_bytes: number
          documents_ingested: number
          embedding_tokens: number
          id: string
          image_generations: number
          last_updated_at: string
          org_id: string
          period_end: string
          period_start: string
          total_cost_usd: number
          voice_stt_seconds: number
          voice_tts_seconds: number
        }
        Insert: {
          chat_messages?: number
          created_at?: string
          document_storage_bytes?: number
          documents_ingested?: number
          embedding_tokens?: number
          id?: string
          image_generations?: number
          last_updated_at?: string
          org_id: string
          period_end: string
          period_start: string
          total_cost_usd?: number
          voice_stt_seconds?: number
          voice_tts_seconds?: number
        }
        Update: {
          chat_messages?: number
          created_at?: string
          document_storage_bytes?: number
          documents_ingested?: number
          embedding_tokens?: number
          id?: string
          image_generations?: number
          last_updated_at?: string
          org_id?: string
          period_end?: string
          period_start?: string
          total_cost_usd?: number
          voice_stt_seconds?: number
          voice_tts_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "usage_periods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_seen_at: string | null
          locale: string
          marketing_opt_in: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_seen_at?: string | null
          locale?: string
          marketing_opt_in?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_seen_at?: string | null
          locale?: string
          marketing_opt_in?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          aspect_ratio: string
          completed_at: string | null
          cost_usd: number | null
          created_at: string
          deleted_at: string | null
          duration_seconds: number
          error_message: string | null
          has_audio: boolean | null
          id: string
          metadata: Json | null
          model: string
          operation_name: string | null
          org_id: string
          project_id: string | null
          prompt: string
          resolution: string | null
          source_image_url: string | null
          status: string
          storage_path: string | null
          thumbnail_path: string | null
          user_id: string
        }
        Insert: {
          aspect_ratio?: string
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number
          error_message?: string | null
          has_audio?: boolean | null
          id?: string
          metadata?: Json | null
          model: string
          operation_name?: string | null
          org_id: string
          project_id?: string | null
          prompt: string
          resolution?: string | null
          source_image_url?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_path?: string | null
          user_id: string
        }
        Update: {
          aspect_ratio?: string
          completed_at?: string | null
          cost_usd?: number | null
          created_at?: string
          deleted_at?: string | null
          duration_seconds?: number
          error_message?: string | null
          has_audio?: boolean | null
          id?: string
          metadata?: Json | null
          model?: string
          operation_name?: string | null
          org_id?: string
          project_id?: string | null
          prompt?: string
          resolution?: string | null
          source_image_url?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_fingerprints: {
        Row: {
          avoided_phrases: string[] | null
          created_at: string
          example_messages: Json | null
          id: string
          last_analyzed_at: string | null
          org_id: string
          preferred_phrases: string[] | null
          sample_count: number
          sentence_length: string | null
          structural_preferences: string | null
          tone_summary: string | null
          updated_at: string
          user_id: string
          vocabulary_style: string | null
        }
        Insert: {
          avoided_phrases?: string[] | null
          created_at?: string
          example_messages?: Json | null
          id?: string
          last_analyzed_at?: string | null
          org_id: string
          preferred_phrases?: string[] | null
          sample_count?: number
          sentence_length?: string | null
          structural_preferences?: string | null
          tone_summary?: string | null
          updated_at?: string
          user_id: string
          vocabulary_style?: string | null
        }
        Update: {
          avoided_phrases?: string[] | null
          created_at?: string
          example_messages?: Json | null
          id?: string
          last_analyzed_at?: string | null
          org_id?: string
          preferred_phrases?: string[] | null
          sample_count?: number
          sentence_length?: string | null
          structural_preferences?: string | null
          tone_summary?: string | null
          updated_at?: string
          user_id?: string
          vocabulary_style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_fingerprints_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_requests: {
        Row: {
          assistant_id: string | null
          conversation_id: string | null
          cost_usd: number | null
          created_at: string
          error_message: string | null
          id: string
          input_audio_mime: string | null
          input_audio_storage_path: string | null
          input_duration_ms: number | null
          input_text: string | null
          kind: Database["public"]["Enums"]["voice_kind"]
          language: string | null
          latency_ms: number | null
          model: string | null
          org_id: string
          output_audio_mime: string | null
          output_audio_storage_path: string | null
          output_duration_ms: number | null
          output_text: string | null
          provider: string
          status: Database["public"]["Enums"]["voice_status"]
          updated_at: string
          user_id: string | null
          voice_id: string | null
        }
        Insert: {
          assistant_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_audio_mime?: string | null
          input_audio_storage_path?: string | null
          input_duration_ms?: number | null
          input_text?: string | null
          kind: Database["public"]["Enums"]["voice_kind"]
          language?: string | null
          latency_ms?: number | null
          model?: string | null
          org_id: string
          output_audio_mime?: string | null
          output_audio_storage_path?: string | null
          output_duration_ms?: number | null
          output_text?: string | null
          provider: string
          status?: Database["public"]["Enums"]["voice_status"]
          updated_at?: string
          user_id?: string | null
          voice_id?: string | null
        }
        Update: {
          assistant_id?: string | null
          conversation_id?: string | null
          cost_usd?: number | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_audio_mime?: string | null
          input_audio_storage_path?: string | null
          input_duration_ms?: number | null
          input_text?: string | null
          kind?: Database["public"]["Enums"]["voice_kind"]
          language?: string | null
          latency_ms?: number | null
          model?: string | null
          org_id?: string
          output_audio_mime?: string | null
          output_audio_storage_path?: string | null
          output_duration_ms?: number | null
          output_text?: string | null
          provider?: string
          status?: Database["public"]["Enums"]["voice_status"]
          updated_at?: string
          user_id?: string | null
          voice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_requests_assistant_id_fkey"
            columns: ["assistant_id"]
            isOneToOne: false
            referencedRelation: "assistants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_requests_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voice_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          org_id: string
          started_at: string
          status: string
          step_results: Json | null
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          org_id: string
          started_at?: string
          status: string
          step_results?: Json | null
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          org_id?: string
          started_at?: string
          status?: string
          step_results?: Json | null
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_run_at: string | null
          last_run_status: string | null
          name: string
          org_id: string
          steps: Json
          total_failures: number
          total_runs: number
          total_successes: number
          trigger_config: Json
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          name: string
          org_id: string
          steps?: Json
          total_failures?: number
          total_runs?: number
          total_successes?: number
          trigger_config?: Json
          trigger_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          last_run_status?: string | null
          name?: string
          org_id?: string
          steps?: Json
          total_failures?: number
          total_runs?: number
          total_successes?: number
          trigger_config?: Json
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_quota: { Args: { p_kind: string; p_org_id: string }; Returns: Json }
      gen_cuid2: { Args: never; Returns: string }
      has_org_role: {
        Args: { required_roles: string[]; target_org_id: string }
        Returns: boolean
      }
      increment_usage: {
        Args: {
          p_cost?: number
          p_kind: Database["public"]["Enums"]["usage_kind"]
          p_org_id: string
          p_quantity: number
        }
        Returns: undefined
      }
      is_org_member: { Args: { target_org_id: string }; Returns: boolean }
      match_chunks: {
        Args: {
          p_assistant_id: string
          p_match_count?: number
          p_min_similarity?: number
          p_org_id: string
          p_query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          id: string
          similarity: number
          source: string
        }[]
      }
      match_memories: {
        Args: {
          p_assistant_id: string
          p_match_count?: number
          p_org_id: string
          p_query_embedding: string
          p_user_id: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      document_status: "uploading" | "processing" | "ready" | "failed"
      feedback_kind:
        | "thumbs_up"
        | "thumbs_down"
        | "rating"
        | "comment"
        | "bug_report"
      image_status: "pending" | "processing" | "complete" | "failed"
      job_status: "queued" | "running" | "completed" | "failed" | "retrying"
      membership_role: "owner" | "admin" | "member" | "viewer"
      membership_status: "pending" | "active" | "suspended"
      memory_scope: "user" | "organization" | "assistant"
      memory_source: "explicit" | "extracted" | "imported"
      message_role: "user" | "assistant" | "system" | "tool"
      message_status: "pending" | "streaming" | "complete" | "failed"
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid"
        | "paused"
      usage_kind:
        | "chat_message"
        | "image_generation"
        | "voice_stt_seconds"
        | "voice_tts_seconds"
        | "document_ingested"
        | "document_storage_bytes"
        | "embedding_tokens"
      voice_kind: "stt" | "tts"
      voice_status: "pending" | "processing" | "complete" | "failed"
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
      document_status: ["uploading", "processing", "ready", "failed"],
      feedback_kind: [
        "thumbs_up",
        "thumbs_down",
        "rating",
        "comment",
        "bug_report",
      ],
      image_status: ["pending", "processing", "complete", "failed"],
      job_status: ["queued", "running", "completed", "failed", "retrying"],
      membership_role: ["owner", "admin", "member", "viewer"],
      membership_status: ["pending", "active", "suspended"],
      memory_scope: ["user", "organization", "assistant"],
      memory_source: ["explicit", "extracted", "imported"],
      message_role: ["user", "assistant", "system", "tool"],
      message_status: ["pending", "streaming", "complete", "failed"],
      subscription_status: [
        "trialing",
        "active",
        "past_due",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "unpaid",
        "paused",
      ],
      usage_kind: [
        "chat_message",
        "image_generation",
        "voice_stt_seconds",
        "voice_tts_seconds",
        "document_ingested",
        "document_storage_bytes",
        "embedding_tokens",
      ],
      voice_kind: ["stt", "tts"],
      voice_status: ["pending", "processing", "complete", "failed"],
    },
  },
} as const
