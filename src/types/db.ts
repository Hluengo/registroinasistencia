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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      absences: {
        Row: {
          created_at: string | null
          document_url: string | null
          end_date: string
          id: string
          observation: string | null
          start_date: string
          status: string | null
          student_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          end_date: string
          id?: string
          observation?: string | null
          start_date: string
          status?: string | null
          student_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          end_date?: string
          id?: string
          observation?: string | null
          start_date?: string
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "absences_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changed_by: string | null
          created_at: string
          id: number
          metadata: Json
          new_data: Json | null
          old_data: Json | null
          performed_by: string | null
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          created_at?: string
          id?: number
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          created_at?: string
          id?: number
          metadata?: Json
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string | null
          record_id?: string | null
          table_name?: string
        }
        Relationships: []
      }
      bitacora_entries: {
        Row: {
          causa_id: string
          created_at: string | null
          descripcion: string | null
          documento_adjunto: string | null
          fecha: string
          id: string
          participantes: Json | null
          tenant_id: string
          tipo: string
          titulo: string
        }
        Insert: {
          causa_id: string
          created_at?: string | null
          descripcion?: string | null
          documento_adjunto?: string | null
          fecha: string
          id: string
          participantes?: Json | null
          tenant_id: string
          tipo: string
          titulo: string
        }
        Update: {
          causa_id?: string
          created_at?: string | null
          descripcion?: string | null
          documento_adjunto?: string | null
          fecha?: string
          id?: string
          participantes?: Json | null
          tenant_id?: string
          tipo?: string
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_entries_causa_id_fkey"
            columns: ["causa_id"]
            isOneToOne: false
            referencedRelation: "causas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      carta_events: {
        Row: {
          carta_id: string
          created_at: string
          created_by: string | null
          event_detail: string | null
          event_type: string
          id: string
          metadata: Json
          student_id: string
          tenant_id: string | null
        }
        Insert: {
          carta_id: string
          created_at?: string
          created_by?: string | null
          event_detail?: string | null
          event_type: string
          id?: string
          metadata?: Json
          student_id: string
          tenant_id?: string | null
        }
        Update: {
          carta_id?: string
          created_at?: string
          created_by?: string | null
          event_detail?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          student_id?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carta_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cartas_disciplinarias: {
        Row: {
          annotations_count: number
          apoderado_name: string
          content_snapshot: Json | null
          course: string
          created_at: string | null
          created_by: string | null
          emission_date: string
          emitted_by: string
          id: string
          letter_type: string
          observations: string | null
          regulation_basis: string
          status: string | null
          student_id: string
          student_name: string
          supervisor_name: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          annotations_count: number
          apoderado_name: string
          content_snapshot?: Json | null
          course: string
          created_at?: string | null
          created_by?: string | null
          emission_date?: string
          emitted_by: string
          id?: string
          letter_type: string
          observations?: string | null
          regulation_basis: string
          status?: string | null
          student_id: string
          student_name: string
          supervisor_name?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          annotations_count?: number
          apoderado_name?: string
          content_snapshot?: Json | null
          course?: string
          created_at?: string | null
          created_by?: string | null
          emission_date?: string
          emitted_by?: string
          id?: string
          letter_type?: string
          observations?: string | null
          regulation_basis?: string
          status?: string | null
          student_id?: string
          student_name?: string
          supervisor_name?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cartas_disciplinarias_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cartas_disciplinarias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      causas: {
        Row: {
          annotations_count: number | null
          compromete_aula_segura: boolean | null
          conducta_rice_id: string | null
          created_at: string | null
          created_by: string | null
          estado_actual: string
          estudiante_curso: string
          estudiante_nombre: string
          fecha_apertura: string
          fecha_ultima_actualizacion: string
          id: string
          medidas_ejecutadas: Json | null
          nna_protected_name: string
          observaciones: string | null
          responsable: string
          run_estudiante: string
          student_id: string | null
          tenant_id: string
          tipo_infraccion: string
          updated_at: string | null
        }
        Insert: {
          annotations_count?: number | null
          compromete_aula_segura?: boolean | null
          conducta_rice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado_actual: string
          estudiante_curso: string
          estudiante_nombre: string
          fecha_apertura: string
          fecha_ultima_actualizacion: string
          id: string
          medidas_ejecutadas?: Json | null
          nna_protected_name: string
          observaciones?: string | null
          responsable: string
          run_estudiante: string
          student_id?: string | null
          tenant_id: string
          tipo_infraccion: string
          updated_at?: string | null
        }
        Update: {
          annotations_count?: number | null
          compromete_aula_segura?: boolean | null
          conducta_rice_id?: string | null
          created_at?: string | null
          created_by?: string | null
          estado_actual?: string
          estudiante_curso?: string
          estudiante_nombre?: string
          fecha_apertura?: string
          fecha_ultima_actualizacion?: string
          id?: string
          medidas_ejecutadas?: Json | null
          nna_protected_name?: string
          observaciones?: string | null
          responsable?: string
          run_estudiante?: string
          student_id?: string | null
          tenant_id?: string
          tipo_infraccion?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "causas_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "causas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_items: {
        Row: {
          causa_id: string
          completado: boolean | null
          created_at: string | null
          descripcion: string | null
          documento_nombre: string | null
          documento_url: string | null
          fecha_completado: string | null
          id: string
          label: string
          observaciones: string | null
          registrado_por: string | null
          requerido_por: string
          tenant_id: string
        }
        Insert: {
          causa_id: string
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          documento_nombre?: string | null
          documento_url?: string | null
          fecha_completado?: string | null
          id: string
          label: string
          observaciones?: string | null
          registrado_por?: string | null
          requerido_por: string
          tenant_id: string
        }
        Update: {
          causa_id?: string
          completado?: boolean | null
          created_at?: string | null
          descripcion?: string | null
          documento_nombre?: string | null
          documento_url?: string | null
          fecha_completado?: string | null
          id?: string
          label?: string
          observaciones?: string | null
          registrado_por?: string | null
          requerido_por?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_items_causa_id_fkey"
            columns: ["causa_id"]
            isOneToOne: false
            referencedRelation: "causas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      coexistence_cases: {
        Row: {
          created_at: string | null
          curso: string | null
          curso_id: string | null
          denunciado: string | null
          denunciante: string | null
          descripcion: string | null
          documentos: string[] | null
          entrevistas: string[] | null
          etapa: string | null
          fecha_inicio: string | null
          folio: string
          gravedad: string | null
          id: string
          plazo_24h: boolean | null
          plazo_cierre: string | null
          plazo_investigacion: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          curso?: string | null
          curso_id?: string | null
          denunciado?: string | null
          denunciante?: string | null
          descripcion?: string | null
          documentos?: string[] | null
          entrevistas?: string[] | null
          etapa?: string | null
          fecha_inicio?: string | null
          folio: string
          gravedad?: string | null
          id?: string
          plazo_24h?: boolean | null
          plazo_cierre?: string | null
          plazo_investigacion?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          curso?: string | null
          curso_id?: string | null
          denunciado?: string | null
          denunciante?: string | null
          descripcion?: string | null
          documentos?: string[] | null
          entrevistas?: string[] | null
          etapa?: string | null
          fecha_inicio?: string | null
          folio?: string
          gravedad?: string | null
          id?: string
          plazo_24h?: boolean | null
          plazo_cierre?: string | null
          plazo_investigacion?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coexistence_cases_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          id: string
          level: string | null
          name: string
          position: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: string | null
          name: string
          position?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: string | null
          name?: string
          position?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_annotations_detected: {
        Row: {
          annotation_date: string | null
          annotation_text: string | null
          annotation_type: string
          category: string | null
          character_position: number | null
          classification_method: string | null
          confidence: number | null
          confirmed_annotation_type: string | null
          corrected_at: string | null
          corrected_by: string | null
          detected_at: string
          id: string
          line_number: number | null
          normalized_text: string | null
          page_number: number | null
          parser_version: string | null
          position_in_page: number | null
          process_id: string
          raw_text: string | null
          student_id: string
          teacher_name: string | null
          tenant_id: string
        }
        Insert: {
          annotation_date?: string | null
          annotation_text?: string | null
          annotation_type: string
          category?: string | null
          character_position?: number | null
          classification_method?: string | null
          confidence?: number | null
          confirmed_annotation_type?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          detected_at?: string
          id?: string
          line_number?: number | null
          normalized_text?: string | null
          page_number?: number | null
          parser_version?: string | null
          position_in_page?: number | null
          process_id: string
          raw_text?: string | null
          student_id: string
          teacher_name?: string | null
          tenant_id: string
        }
        Update: {
          annotation_date?: string | null
          annotation_text?: string | null
          annotation_type?: string
          category?: string | null
          character_position?: number | null
          classification_method?: string | null
          confidence?: number | null
          confirmed_annotation_type?: string | null
          corrected_at?: string | null
          corrected_by?: string | null
          detected_at?: string
          id?: string
          line_number?: number | null
          normalized_text?: string | null
          page_number?: number | null
          parser_version?: string | null
          position_in_page?: number | null
          process_id?: string
          raw_text?: string | null
          student_id?: string
          teacher_name?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_annotations_detected_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_annotations_detected_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_annotations_detected_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_process_files: {
        Row: {
          analysis_version: string | null
          bucket: string
          file_hash: string | null
          file_name: string
          file_size: number
          id: string
          mime_type: string
          original_file_name: string | null
          process_id: string
          processing_error: string | null
          processing_status: string
          storage_path: string
          stored_file_name: string | null
          student_id: string | null
          tenant_id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          analysis_version?: string | null
          bucket?: string
          file_hash?: string | null
          file_name: string
          file_size: number
          id?: string
          mime_type: string
          original_file_name?: string | null
          process_id: string
          processing_error?: string | null
          processing_status?: string
          storage_path: string
          stored_file_name?: string | null
          student_id?: string | null
          tenant_id: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          analysis_version?: string | null
          bucket?: string
          file_hash?: string | null
          file_name?: string
          file_size?: number
          id?: string
          mime_type?: string
          original_file_name?: string | null
          process_id?: string
          processing_error?: string | null
          processing_status?: string
          storage_path?: string
          stored_file_name?: string | null
          student_id?: string | null
          tenant_id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_process_files_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_process_files_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_process_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_processes: {
        Row: {
          completed_at: string | null
          course: string | null
          created_at: string
          created_by: string | null
          description: string | null
          final_letter_type: string | null
          id: string
          incident_date: string | null
          is_completed: boolean
          process_number: string
          status: string
          student_id: string
          suggested_letter_type: string | null
          teacher_name: string | null
          tenant_id: string
          total_informativas: number
          total_negativas: number
          total_positivas: number
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          course?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          final_letter_type?: string | null
          id?: string
          incident_date?: string | null
          is_completed?: boolean
          process_number: string
          status?: string
          student_id: string
          suggested_letter_type?: string | null
          teacher_name?: string | null
          tenant_id: string
          total_informativas?: number
          total_negativas?: number
          total_positivas?: number
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          course?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          final_letter_type?: string | null
          id?: string
          incident_date?: string | null
          is_completed?: boolean
          process_number?: string
          status?: string
          student_id?: string
          suggested_letter_type?: string | null
          teacher_name?: string | null
          tenant_id?: string
          total_informativas?: number
          total_negativas?: number
          total_positivas?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_processes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_processes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_rules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_informativas: number | null
          max_negativas: number | null
          max_positivas: number | null
          min_informativas: number | null
          min_negativas: number | null
          min_positivas: number | null
          priority: number
          rule_name: string
          rule_type: string
          suggested_letter_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_informativas?: number | null
          max_negativas?: number | null
          max_positivas?: number | null
          min_informativas?: number | null
          min_negativas?: number | null
          min_positivas?: number | null
          priority?: number
          rule_name: string
          rule_type: string
          suggested_letter_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_informativas?: number | null
          max_negativas?: number | null
          max_positivas?: number | null
          min_informativas?: number | null
          min_negativas?: number | null
          min_positivas?: number | null
          priority?: number
          rule_name?: string
          rule_type?: string
          suggested_letter_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_analyses: {
        Row: {
          analyzed_at: string
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          detected_course: string | null
          detected_student_name: string | null
          file_hash: string | null
          file_id: string | null
          file_name: string | null
          id: string
          informativas: number
          negativas: number
          parser_version: string | null
          positivas: number
          process_id: string | null
          status: string
          student_id: string | null
          student_match_status: string | null
          tenant_id: string
          warnings: Json
        }
        Insert: {
          analyzed_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          detected_course?: string | null
          detected_student_name?: string | null
          file_hash?: string | null
          file_id?: string | null
          file_name?: string | null
          id?: string
          informativas?: number
          negativas?: number
          parser_version?: string | null
          positivas?: number
          process_id?: string | null
          status?: string
          student_id?: string | null
          student_match_status?: string | null
          tenant_id: string
          warnings?: Json
        }
        Update: {
          analyzed_at?: string
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          detected_course?: string | null
          detected_student_name?: string | null
          file_hash?: string | null
          file_id?: string | null
          file_name?: string | null
          id?: string
          informativas?: number
          negativas?: number
          parser_version?: string | null
          positivas?: number
          process_id?: string | null
          status?: string
          student_id?: string | null
          student_match_status?: string | null
          tenant_id?: string
          warnings?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_analyses_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_process_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analyses_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "disciplinary_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analyses_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_analyses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          doc_type: string
          id: string
          label: string
          system_prompt: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          doc_type: string
          id: string
          label: string
          system_prompt: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          doc_type?: string
          id?: string
          label?: string
          system_prompt?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      etapas_disciplinarias: {
        Row: {
          comment: string | null
          created_at: string | null
          created_by: string | null
          id: string
          responsible: string
          stage_name: string
          step_number: number
          student_id: string
          tenant_id: string
          transition_date: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          responsible: string
          stage_name: string
          step_number: number
          student_id: string
          tenant_id: string
          transition_date?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          responsible?: string
          stage_name?: string
          step_number?: number
          student_id?: string
          tenant_id?: string
          transition_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "etapas_disciplinarias_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "etapas_disciplinarias_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      feriados_chile: {
        Row: {
          descripcion: string
          es_irrenunciable: boolean
          fecha: string
        }
        Insert: {
          descripcion: string
          es_irrenunciable?: boolean
          fecha: string
        }
        Update: {
          descripcion?: string
          es_irrenunciable?: boolean
          fecha?: string
        }
        Relationships: []
      }
      inspectorate_records: {
        Row: {
          created_at: string | null
          created_by: string | null
          date_time: string
          id: string
          observation: string
          pdf_file_path: string | null
          registered_by: string | null
          severity: string
          student_id: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          date_time: string
          id?: string
          observation: string
          pdf_file_path?: string | null
          registered_by?: string | null
          severity?: string
          student_id?: string | null
          tenant_id: string
          type?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          date_time?: string
          id?: string
          observation?: string
          pdf_file_path?: string | null
          registered_by?: string | null
          severity?: string
          student_id?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspectorate_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspectorate_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      instant_messages: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          created_by: string | null
          ends_at: string | null
          id: string
          is_active: boolean
          level: string | null
          starts_at: string
          student_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          starts_at?: string
          student_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          ends_at?: string | null
          id?: string
          is_active?: boolean
          level?: string | null
          starts_at?: string
          student_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instant_messages_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instant_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          course_ids: string[] | null
          created_at: string
          email: string | null
          full_name: string | null
          role: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          course_ids?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          role: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          course_ids?: string[] | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          ai_analysis: Json | null
          course_id: string | null
          created_at: string | null
          full_name: string
          id: string
          rut: string | null
          tenant_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          course_id?: string | null
          created_at?: string | null
          full_name: string
          id?: string
          rut?: string | null
          tenant_id: string
        }
        Update: {
          ai_analysis?: Json | null
          course_id?: string | null
          created_at?: string | null
          full_name?: string
          id?: string
          rut?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      tests: {
        Row: {
          course_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          subject: string
          type: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          subject: string
          type: string
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
          subject?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string | null
          event_name: string
          id: string
          properties: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_name: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_name?: string
          id?: string
          properties?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      teacher_public_view: {
        Row: {
          absence_id: string | null
          course_level: string | null
          course_name: string | null
          end_date: string | null
          observation: string | null
          start_date: string | null
          status: string | null
          student_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      app_role: { Args: never; Returns: string }
      clean_old_logs: { Args: { days_to_keep?: number }; Returns: string }
      count_affected_tests: {
        Args: { p_end: string; p_start: string; p_student_id: string }
        Returns: number
      }
      current_app_role: { Args: never; Returns: string }
      current_role: { Args: never; Returns: string }
      current_tenant_id: { Args: never; Returns: string }
      generate_process_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      get_absence_stats: {
        Args: {
          p_course_id: string
          p_end_date: string
          p_level: string
          p_start_date: string
        }
        Returns: {
          justified: number
          pending: number
          total: number
          with_tests: number
          without_doc: number
        }[]
      }
      get_annotation_stage_counts: {
        Args: never
        Returns: {
          count: number
          stage: string
        }[]
      }
      get_daily_active_users: {
        Args: { since?: string; until?: string }
        Returns: {
          active_users: number
          date: string
        }[]
      }
      get_latest_analysis: {
        Args: { p_student_id: string }
        Returns: {
          analyzed_at: string
          file_name: string
          informativas: number
          negativas: number
          positivas: number
        }[]
      }
      get_student_annotation_summary: {
        Args: never
        Returns: {
          ai_analysis: Json
          annotations_count: number
          course_id: string
          course_name: string
          disciplinary_status: string
          full_name: string
          id: string
          last_annotation_date: string
          positive_annotations_count: number
          rut: string
          status: string
          teacher_id: string
        }[]
      }
      get_suggested_letter_type: {
        Args: {
          p_informativas: number
          p_negativas: number
          p_positivas: number
          p_tenant_id: string
        }
        Returns: string
      }
      get_teacher_dashboard: {
        Args: never
        Returns: {
          absence_id: string
          affected_tests_count: number
          course_level: string
          course_name: string
          end_date: string
          observation: string
          start_date: string
          status: string
          student_name: string
        }[]
      }
      get_usage_stats: {
        Args: { since?: string; until?: string }
        Returns: {
          event_name: string
          last_occurrence: string
          total_count: number
          unique_users: number
        }[]
      }
      is_management: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_superuser: { Args: never; Returns: boolean }
      teacher_get_instant_messages: {
        Args: { p_course_id?: string; p_level?: string; p_student_id?: string }
        Returns: {
          body: string
          course_id: string
          created_at: string
          ends_at: string
          id: string
          level: string
          starts_at: string
          student_id: string
          student_name: string
          title: string
        }[]
      }
      teacher_get_public_absence_detail: {
        Args: { p_absence_id: string }
        Returns: {
          date: string
          id: string
          subject: string
          type: string
        }[]
      }
      teacher_get_public_absences: {
        Args: {
          p_course_id?: string
          p_level?: string
          p_month: number
          p_year: number
        }
        Returns: {
          absence_id: string
          affected_tests_count: number
          course_id: string
          course_level: string
          course_name: string
          end_date: string
          observation: string
          start_date: string
          status: string
          student_name: string
        }[]
      }
    }
    Enums: {
      absence_status: "PENDIENTE" | "JUSTIFICADA"
      education_level: "BASICA" | "MEDIA"
      user_role: "inspector" | "coordinador" | "director" | "superuser"
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
      absence_status: ["PENDIENTE", "JUSTIFICADA"],
      education_level: ["BASICA", "MEDIA"],
      user_role: ["inspector", "coordinador", "director", "superuser"],
    },
  },
} as const
