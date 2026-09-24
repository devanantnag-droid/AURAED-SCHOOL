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
      academic_sessions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_current: boolean
          name: string
          school_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name: string
          school_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_current?: boolean
          name?: string
          school_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_documents: {
        Row: {
          admission_id: string
          file_name: string
          file_path: string
          id: string
          school_id: string
          uploaded_at: string
        }
        Insert: {
          admission_id: string
          file_name: string
          file_path: string
          id?: string
          school_id: string
          uploaded_at?: string
        }
        Update: {
          admission_id?: string
          file_name?: string
          file_path?: string
          id?: string
          school_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admission_documents_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions: {
        Row: {
          academic_session_id: string | null
          applicant_first_name: string
          applicant_last_name: string
          applying_for_class_id: string | null
          converted_student_id: string | null
          created_at: string
          date_of_birth: string | null
          gender: string | null
          id: string
          interview_date: string | null
          interview_notes: string | null
          parent_email: string | null
          parent_name: string | null
          parent_phone: string | null
          remarks: string | null
          school_id: string
          status: string
          updated_at: string
        }
        Insert: {
          academic_session_id?: string | null
          applicant_first_name: string
          applicant_last_name: string
          applying_for_class_id?: string | null
          converted_student_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          remarks?: string | null
          school_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string | null
          applicant_first_name?: string
          applicant_last_name?: string
          applying_for_class_id?: string | null
          converted_student_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          gender?: string | null
          id?: string
          interview_date?: string | null
          interview_notes?: string | null
          parent_email?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          remarks?: string | null
          school_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_applying_for_class_id_fkey"
            columns: ["applying_for_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_converted_student_id_fkey"
            columns: ["converted_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          school_id: string
          target_class_id: string | null
          target_role: string | null
          target_type: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          school_id: string
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          school_id?: string
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          attachment_path: string | null
          created_at: string
          feedback: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          marks_obtained: number | null
          school_id: string
          status: string
          student_id: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          assignment_id: string
          attachment_path?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          school_id: string
          status?: string
          student_id: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          attachment_path?: string | null
          created_at?: string
          feedback?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          marks_obtained?: number | null
          school_id?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          academic_session_id: string
          attachment_path: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean
          max_marks: number | null
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          attachment_path?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          max_marks?: number | null
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          attachment_path?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          max_marks?: number | null
          school_id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_correction_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          punch_date: string
          punch_record_id: string | null
          reason: string
          rejection_reason: string | null
          requested_punch_in: string | null
          requested_punch_out: string | null
          school_id: string
          status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          punch_date: string
          punch_record_id?: string | null
          reason: string
          rejection_reason?: string | null
          requested_punch_in?: string | null
          requested_punch_out?: string | null
          school_id: string
          status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          punch_date?: string
          punch_record_id?: string | null
          reason?: string
          rejection_reason?: string | null
          requested_punch_in?: string | null
          requested_punch_out?: string | null
          school_id?: string
          status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_correction_requests_punch_record_id_fkey"
            columns: ["punch_record_id"]
            isOneToOne: false
            referencedRelation: "teacher_punch_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_correction_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_correction_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          school_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          school_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      book_issues: {
        Row: {
          book_id: string
          created_at: string
          due_date: string
          fine: number
          id: string
          issue_date: string
          return_date: string | null
          school_id: string
          student_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          book_id: string
          created_at?: string
          due_date: string
          fine?: number
          id?: string
          issue_date?: string
          return_date?: string | null
          school_id: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          book_id?: string
          created_at?: string
          due_date?: string
          fine?: number
          id?: string
          issue_date?: string
          return_date?: string | null
          school_id?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_issues_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "book_issues_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      books: {
        Row: {
          author: string | null
          available_copies: number
          category: string | null
          created_at: string
          id: string
          isbn: string | null
          publisher: string | null
          school_id: string
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          publisher?: string | null
          school_id: string
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author?: string | null
          available_copies?: number
          category?: string | null
          created_at?: string
          id?: string
          isbn?: string | null
          publisher?: string | null
          school_id?: string
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "books_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_templates: {
        Row: {
          body_template: string
          certificate_type: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          body_template: string
          certificate_type?: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          body_template?: string
          certificate_type?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      circulars: {
        Row: {
          attachment_path: string | null
          body: string
          circular_number: string
          created_at: string
          id: string
          issued_by: string | null
          school_id: string
          target_class_id: string | null
          target_role: string | null
          target_type: string
          title: string
        }
        Insert: {
          attachment_path?: string | null
          body: string
          circular_number: string
          created_at?: string
          id?: string
          issued_by?: string | null
          school_id: string
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          circular_number?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          school_id?: string
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "circulars_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circulars_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_teachers: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          id: string
          school_id: string
          section_id: string
          teacher_id: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          section_id: string
          teacher_id: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          section_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_teachers_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          response: string
          school_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          response: string
          school_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          response?: string
          school_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_rsvps_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          location: string | null
          school_id: string
          start_time: string | null
          target_class_id: string | null
          target_role: string | null
          target_type: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          location?: string | null
          school_id: string
          start_time?: string | null
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          location?: string | null
          school_id?: string
          start_time?: string | null
          target_class_id?: string | null
          target_role?: string | null
          target_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_rooms: {
        Row: {
          capacity: number
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          capacity: number
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_rooms_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_seating_assignments: {
        Row: {
          created_at: string
          exam_id: string
          id: string
          room_id: string
          school_id: string
          seat_number: number
          student_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          id?: string
          room_id: string
          school_id: string
          seat_number: number
          student_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          id?: string
          room_id?: string
          school_id?: string
          seat_number?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_seating_assignments_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_seating_assignments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "exam_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_seating_assignments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_seating_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          class_id: string
          created_at: string
          exam_date: string | null
          exam_id: string
          id: string
          is_finalized: boolean
          max_marks: number
          passing_marks: number
          room: string | null
          school_id: string
          section_id: string
          subject_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          exam_date?: string | null
          exam_id: string
          id?: string
          is_finalized?: boolean
          max_marks?: number
          passing_marks?: number
          room?: string | null
          school_id: string
          section_id: string
          subject_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          exam_date?: string | null
          exam_id?: string
          id?: string
          is_finalized?: boolean
          max_marks?: number
          passing_marks?: number
          room?: string | null
          school_id?: string
          section_id?: string
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_session_id: string
          created_at: string
          end_date: string | null
          exam_type: string
          id: string
          name: string
          school_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          created_at?: string
          end_date?: string | null
          exam_type?: string
          id?: string
          name: string
          school_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          created_at?: string
          end_date?: string | null
          exam_type?: string
          id?: string
          name?: string
          school_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string
          expense_category_id: string | null
          expense_date: string
          id: string
          school_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description: string
          expense_category_id?: string | null
          expense_date?: string
          id?: string
          school_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string
          expense_category_id?: string | null
          expense_date?: string
          id?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      fee_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_session_id: string
          amount: number
          class_id: string | null
          created_at: string
          due_day: number | null
          fee_category_id: string
          frequency: string
          id: string
          school_id: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          amount: number
          class_id?: string | null
          created_at?: string
          due_day?: number | null
          fee_category_id: string
          frequency?: string
          id?: string
          school_id: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          amount?: number
          class_id?: string | null
          created_at?: string
          due_day?: number | null
          fee_category_id?: string
          frequency?: string
          id?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_fee_category_id_fkey"
            columns: ["fee_category_id"]
            isOneToOne: false
            referencedRelation: "fee_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      grievance_replies: {
        Row: {
          body: string
          created_at: string
          grievance_id: string
          id: string
          sender_id: string | null
        }
        Insert: {
          body: string
          created_at?: string
          grievance_id: string
          id?: string
          sender_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string
          grievance_id?: string
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grievance_replies_grievance_id_fkey"
            columns: ["grievance_id"]
            isOneToOne: false
            referencedRelation: "grievances"
            referencedColumns: ["id"]
          },
        ]
      }
      grievances: {
        Row: {
          against_teacher_id: string | null
          category: string
          created_at: string
          description: string
          id: string
          raised_by: string | null
          school_id: string
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          against_teacher_id?: string | null
          category?: string
          created_at?: string
          description: string
          id?: string
          raised_by?: string | null
          school_id: string
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          against_teacher_id?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          raised_by?: string | null
          school_id?: string
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_against_teacher_id_fkey"
            columns: ["against_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grievances_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          academic_session_id: string
          attachment_path: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          is_published: boolean
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          attachment_path?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          attachment_path?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          is_published?: boolean
          school_id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          name: string
          quantity_in_stock: number
          reorder_level: number
          school_id: string
          sku: string | null
          unit: string | null
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          name: string
          quantity_in_stock?: number
          reorder_level?: number
          school_id: string
          sku?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          name?: string
          quantity_in_stock?: number
          reorder_level?: number
          school_id?: string
          sku?: string | null
          unit?: string | null
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          issued_to: string | null
          item_id: string
          notes: string | null
          quantity: number
          school_id: string
          transaction_type: string
          vendor: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          issued_to?: string | null
          item_id: string
          notes?: string | null
          quantity: number
          school_id: string
          transaction_type: string
          vendor?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          issued_to?: string | null
          item_id?: string
          notes?: string | null
          quantity?: number
          school_id?: string
          transaction_type?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      issued_certificates: {
        Row: {
          body_text: string
          certificate_number: string
          certificate_type: string
          created_at: string
          id: string
          issued_by: string | null
          issued_date: string
          school_id: string
          student_id: string
          template_id: string | null
        }
        Insert: {
          body_text: string
          certificate_number: string
          certificate_type: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          school_id: string
          student_id: string
          template_id?: string | null
        }
        Update: {
          body_text?: string
          certificate_number?: string
          certificate_type?: string
          created_at?: string
          id?: string
          issued_by?: string | null
          issued_date?: string
          school_id?: string
          student_id?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issued_certificates_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issued_certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: string
          reason: string
          requested_by: string | null
          requester_type: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          school_id: string
          start_date: string
          status: string
          student_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: string
          reason: string
          requested_by?: string | null
          requester_type: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id: string
          start_date: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string
          requested_by?: string | null
          requester_type?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          school_id?: string
          start_date?: string
          status?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      marks: {
        Row: {
          created_at: string
          entered_by: string | null
          exam_subject_id: string
          grade: string | null
          id: string
          marks_obtained: number | null
          remarks: string | null
          school_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entered_by?: string | null
          exam_subject_id: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          school_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entered_by?: string | null
          exam_subject_id?: string
          grade?: string | null
          id?: string
          marks_obtained?: number | null
          remarks?: string | null
          school_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marks_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marks_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string
          school_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id: string
          school_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string
          school_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          platform_announcement_id: string | null
          school_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          platform_announcement_id?: string | null
          school_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          platform_announcement_id?: string | null
          school_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_platform_announcement_id_fkey"
            columns: ["platform_announcement_id"]
            isOneToOne: false
            referencedRelation: "platform_announcements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      parent_students: {
        Row: {
          parent_id: string
          student_id: string
        }
        Insert: {
          parent_id: string
          student_id: string
        }
        Update: {
          parent_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "parent_students_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parent_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      parents: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          occupation: string | null
          phone: string | null
          photo_url: string | null
          relationship: string | null
          school_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship?: string | null
          school_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          occupation?: string | null
          phone?: string | null
          photo_url?: string | null
          relationship?: string | null
          school_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          received_by: string | null
          school_id: string
          status: string
          student_fee_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number: string
          received_by?: string | null
          school_id: string
          status?: string
          student_fee_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          received_by?: string | null
          school_id?: string
          status?: string
          student_fee_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_fee_id_fkey"
            columns: ["student_fee_id"]
            isOneToOne: false
            referencedRelation: "student_fees"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          additional_deduction: number
          allowances: number
          basic_salary: number
          created_at: string
          deductions: number
          id: string
          net_salary: number
          payment_date: string | null
          period_month: number
          period_year: number
          school_id: string
          staff_id: string | null
          status: string
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          additional_deduction?: number
          allowances?: number
          basic_salary: number
          created_at?: string
          deductions?: number
          id?: string
          net_salary?: number
          payment_date?: string | null
          period_month: number
          period_year: number
          school_id: string
          staff_id?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          additional_deduction?: number
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions?: number
          id?: string
          net_salary?: number
          payment_date?: string | null
          period_month?: number
          period_year?: number
          school_id?: string
          staff_id?: string | null
          status?: string
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          feature_id: string
          plan_id: string
        }
        Insert: {
          feature_id: string
          plan_id: string
        }
        Update: {
          feature_id?: string
          plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_features_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_features_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          billing_cycle: string
          created_at: string
          currency: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          max_staff: number | null
          max_students: number | null
          max_teachers: number | null
          name: string
          price: number
          slug: string
          storage_limit_mb: number | null
          trial_days: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_staff?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name: string
          price?: number
          slug: string
          storage_limit_mb?: number | null
          trial_days?: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          max_staff?: number | null
          max_students?: number | null
          max_teachers?: number | null
          name?: string
          price?: number
          slug?: string
          storage_limit_mb?: number | null
          trial_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          target_role: string | null
          target_type: string
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_role?: string | null
          target_type?: string
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_role?: string | null
          target_type?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          school_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id: string
          phone?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ptm_bookings: {
        Row: {
          booked_by: string | null
          created_at: string
          id: string
          notes: string | null
          parent_name: string
          parent_phone: string | null
          ptm_slot_id: string
          school_id: string
          student_id: string
        }
        Insert: {
          booked_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parent_name: string
          parent_phone?: string | null
          ptm_slot_id: string
          school_id: string
          student_id: string
        }
        Update: {
          booked_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          parent_name?: string
          parent_phone?: string | null
          ptm_slot_id?: string
          school_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ptm_bookings_ptm_slot_id_fkey"
            columns: ["ptm_slot_id"]
            isOneToOne: true
            referencedRelation: "ptm_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptm_bookings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptm_bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      ptm_sessions: {
        Row: {
          academic_session_id: string | null
          created_at: string
          created_by: string | null
          id: string
          ptm_date: string
          school_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_session_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ptm_date: string
          school_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          ptm_date?: string
          school_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ptm_sessions_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptm_sessions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ptm_slots: {
        Row: {
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          ptm_session_id: string
          school_id: string
          start_time: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          ptm_session_id: string
          school_id: string
          start_time: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          ptm_session_id?: string
          school_id?: string
          start_time?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ptm_slots_ptm_session_id_fkey"
            columns: ["ptm_session_id"]
            isOneToOne: false
            referencedRelation: "ptm_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptm_slots_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ptm_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      routes: {
        Row: {
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "routes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routes_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_structures: {
        Row: {
          allowances: number
          basic_salary: number
          created_at: string
          deductions: number
          effective_from: string
          id: string
          school_id: string
          staff_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          allowances?: number
          basic_salary: number
          created_at?: string
          deductions?: number
          effective_from?: string
          id?: string
          school_id: string
          staff_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions?: number
          effective_from?: string
          id?: string
          school_id?: string
          staff_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_structures_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "salary_structures_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_settings: {
        Row: {
          created_at: string
          geofence_enabled: boolean
          geofence_latitude: number | null
          geofence_longitude: number | null
          geofence_radius_meters: number | null
          school_id: string
          theme: string
          updated_at: string
          working_days: number[]
        }
        Insert: {
          created_at?: string
          geofence_enabled?: boolean
          geofence_latitude?: number | null
          geofence_longitude?: number | null
          geofence_radius_meters?: number | null
          school_id: string
          theme?: string
          updated_at?: string
          working_days?: number[]
        }
        Update: {
          created_at?: string
          geofence_enabled?: boolean
          geofence_latitude?: number | null
          geofence_longitude?: number | null
          geofence_radius_meters?: number | null
          school_id?: string
          theme?: string
          updated_at?: string
          working_days?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string | null
          created_at: string
          description: string | null
          email: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          principal_name: string | null
          registration_number: string | null
          state: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string | null
          created_at?: string
          description?: string | null
          email: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          principal_name?: string | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string | null
          created_at?: string
          description?: string | null
          email?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          principal_name?: string | null
          registration_number?: string | null
          state?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: {
          class_id: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sections_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          created_at: string
          department: string | null
          email: string | null
          employee_id: string
          full_name: string
          id: string
          joining_date: string
          phone: string | null
          role_title: string | null
          school_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          id?: string
          joining_date?: string
          phone?: string | null
          role_title?: string | null
          school_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          id?: string
          joining_date?: string
          phone?: string | null
          role_title?: string | null
          school_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      stops: {
        Row: {
          created_at: string
          id: string
          name: string
          route_id: string
          school_id: string
          stop_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          route_id: string
          school_id: string
          stop_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          route_id?: string
          school_id?: string
          stop_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stops_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      student_attendance: {
        Row: {
          attendance_date: string
          class_name: string | null
          created_at: string
          id: string
          marked_by: string | null
          remarks: string | null
          school_id: string
          section_name: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_name?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id: string
          section_name?: string | null
          status: string
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_name?: string | null
          created_at?: string
          id?: string
          marked_by?: string | null
          remarks?: string | null
          school_id?: string
          section_name?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_attendance_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fees: {
        Row: {
          academic_session_id: string
          amount_due: number
          amount_paid: number
          created_at: string
          discount: number
          due_date: string | null
          fee_structure_id: string
          id: string
          school_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          amount_due: number
          amount_paid?: number
          created_at?: string
          discount?: number
          due_date?: string | null
          fee_structure_id: string
          id?: string
          school_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          amount_due?: number
          amount_paid?: number
          created_at?: string
          discount?: number
          due_date?: string | null
          fee_structure_id?: string
          id?: string
          school_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fees_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fees_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport: {
        Row: {
          created_at: string
          id: string
          route_id: string
          school_id: string
          stop_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          route_id: string
          school_id: string
          stop_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          route_id?: string
          school_id?: string
          stop_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_session: string | null
          address: string | null
          admission_date: string
          admission_number: string
          blood_group: string | null
          city: string | null
          class_id: string | null
          class_name: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          house: string | null
          id: string
          last_name: string
          middle_name: string | null
          phone: string | null
          photo_url: string | null
          postal_code: string | null
          roll_number: string | null
          school_id: string
          section_id: string | null
          section_name: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          academic_session?: string | null
          address?: string | null
          admission_date?: string
          admission_number: string
          blood_group?: string | null
          city?: string | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          house?: string | null
          id?: string
          last_name: string
          middle_name?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          roll_number?: string | null
          school_id: string
          section_id?: string | null
          section_name?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          academic_session?: string | null
          address?: string | null
          admission_date?: string
          admission_number?: string
          blood_group?: string | null
          city?: string | null
          class_id?: string | null
          class_name?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          house?: string | null
          id?: string
          last_name?: string
          middle_name?: string | null
          phone?: string | null
          photo_url?: string | null
          postal_code?: string | null
          roll_number?: string | null
          school_id?: string
          section_id?: string | null
          section_name?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      study_materials: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          description: string | null
          file_path: string | null
          file_type: string | null
          id: string
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          description?: string | null
          file_path?: string | null
          file_type?: string | null
          id?: string
          school_id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "study_materials_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_teachers: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          id: string
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          id?: string
          school_id: string
          section_id: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          id?: string
          school_id?: string
          section_id?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_teachers_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          school_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          school_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payment_method: string | null
          school_id: string
          status: string
          subscription_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          school_id: string
          status?: string
          subscription_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          school_id?: string
          status?: string
          subscription_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean
          created_at: string
          end_date: string | null
          id: string
          plan_id: string
          school_id: string
          start_date: string
          status: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id: string
          school_id: string
          start_date?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          created_at?: string
          end_date?: string | null
          id?: string
          plan_id?: string
          school_id?: string
          start_date?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          display_order: number
          id: string
          question_text: string
          question_type: string
          survey_id: string
        }
        Insert: {
          display_order?: number
          id?: string
          question_text: string
          question_type?: string
          survey_id: string
        }
        Update: {
          display_order?: number
          id?: string
          question_text?: string
          question_type?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_responses: {
        Row: {
          created_at: string
          id: string
          question_id: string
          rating_value: number | null
          respondent_id: string
          survey_id: string
          text_value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          question_id: string
          rating_value?: number | null
          respondent_id: string
          survey_id: string
          text_value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          question_id?: string
          rating_value?: number | null
          respondent_id?: string
          survey_id?: string
          text_value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "survey_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          school_id: string
          target_class_id: string | null
          target_type: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          school_id: string
          target_class_id?: string | null
          target_type?: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          school_id?: string
          target_class_id?: string | null
          target_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "surveys_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_punch_records: {
        Row: {
          created_at: string
          device_info: string | null
          id: string
          latitude: number | null
          longitude: number | null
          punch_date: string
          punch_in: string | null
          punch_out: string | null
          school_id: string
          status: string
          teacher_id: string
          updated_at: string
          working_minutes: number | null
        }
        Insert: {
          created_at?: string
          device_info?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          punch_date?: string
          punch_in?: string | null
          punch_out?: string | null
          school_id: string
          status?: string
          teacher_id: string
          updated_at?: string
          working_minutes?: number | null
        }
        Update: {
          created_at?: string
          device_info?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          punch_date?: string
          punch_in?: string | null
          punch_out?: string | null
          school_id?: string
          status?: string
          teacher_id?: string
          updated_at?: string
          working_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_punch_records_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_punch_records_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          designation: string | null
          email: string | null
          employee_id: string
          full_name: string
          gender: string | null
          id: string
          joining_date: string
          phone: string | null
          photo_url: string | null
          qualification: string | null
          school_id: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id: string
          full_name: string
          gender?: string | null
          id?: string
          joining_date?: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          school_id: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          designation?: string | null
          email?: string | null
          employee_id?: string
          full_name?: string
          gender?: string | null
          id?: string
          joining_date?: string
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          school_id?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          body: string
          created_at: string
          id: string
          sender_id: string | null
          ticket_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          sender_id?: string | null
          ticket_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          sender_id?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string
          id: string
          priority: string
          school_id: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          priority?: string
          school_id: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          priority?: string
          school_id?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      timetables: {
        Row: {
          academic_session_id: string
          class_id: string
          created_at: string
          day_of_week: number
          end_time: string | null
          id: string
          period_number: number
          room: string | null
          school_id: string
          section_id: string
          start_time: string | null
          subject_id: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          academic_session_id: string
          class_id: string
          created_at?: string
          day_of_week: number
          end_time?: string | null
          id?: string
          period_number: number
          room?: string | null
          school_id: string
          section_id: string
          start_time?: string | null
          subject_id: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          academic_session_id?: string
          class_id?: string
          created_at?: string
          day_of_week?: number
          end_time?: string | null
          id?: string
          period_number?: number
          room?: string | null
          school_id?: string
          section_id?: string
          start_time?: string | null
          subject_id?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetables_academic_session_id_fkey"
            columns: ["academic_session_id"]
            isOneToOne: false
            referencedRelation: "academic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetables_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          school_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          school_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_locations: {
        Row: {
          latitude: number
          longitude: number
          school_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          latitude: number
          longitude: number
          school_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          latitude?: number
          longitude?: number
          school_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          driver_name: string | null
          driver_phone: string | null
          driver_user_id: string | null
          id: string
          school_id: string
          updated_at: string
          vehicle_number: string
          vehicle_type: string | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          driver_user_id?: string | null
          id?: string
          school_id: string
          updated_at?: string
          vehicle_number: string
          vehicle_type?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string
          driver_name?: string | null
          driver_phone?: string | null
          driver_user_id?: string | null
          id?: string
          school_id?: string
          updated_at?: string
          vehicle_number?: string
          vehicle_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_attendance_correction: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      current_student_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      is_my_vehicle: { Args: { target_vehicle_id: string }; Returns: boolean }
      is_parent_of: { Args: { p_student_id: string }; Returns: boolean }
      my_children: { Args: never; Returns: string[] }
      notify_targeted_users: {
        Args: {
          p_body: string
          p_link: string
          p_school_id: string
          p_target_class_id: string
          p_target_role: string
          p_target_type: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      school_has_feature: { Args: { feature_code: string }; Returns: boolean }
      subscription_effective_status: {
        Args: { p_school_id: string }
        Returns: string
      }
      teacher_teaches: {
        Args: { p_class_id: string; p_section_id: string; p_subject_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { permission_code: string }
        Returns: boolean
      }
      user_has_role: { Args: { role_name: string }; Returns: boolean }
      user_in_school: { Args: { target_school_id: string }; Returns: boolean }
      user_school_id: { Args: never; Returns: string }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
