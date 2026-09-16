// AUTO-GENERATED PLACEHOLDER
// Once your Supabase project is linked, replace this file with the real
// generated types by running:
//   npm run supabase:types
// (requires `supabase link --project-ref <ref>` first)
//
// This hand-written version matches the Phase 1 migrations exactly so the
// app type-checks before you've linked a project.

export type SubscriptionStatusEnum = never; // introduced in Phase 3

export interface Database {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          code: string;
          registration_number: string | null;
          email: string;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          country: string | null;
          postal_code: string | null;
          logo_url: string | null;
          principal_name: string | null;
          website: string | null;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['schools']['Row']> & {
          name: string;
          code: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['schools']['Row']>;
      };
      school_settings: {
        Row: {
          school_id: string;
          theme: string;
          working_days: number[];
          geofence_enabled: boolean;
          geofence_latitude: number | null;
          geofence_longitude: number | null;
          geofence_radius_meters: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['school_settings']['Row']> & {
          school_id: string;
        };
        Update: Partial<Database['public']['Tables']['school_settings']['Row']>;
      };
      profiles: {
        Row: {
          id: string;
          school_id: string | null;
          full_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          status: 'pending' | 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & {
          id: string;
          full_name: string;
          email: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      roles: {
        Row: { id: string; name: string; description: string | null; created_at: string };
        Insert: { id?: string; name: string; description?: string | null };
        Update: Partial<Database['public']['Tables']['roles']['Row']>;
      };
      permissions: {
        Row: { id: string; code: string; description: string | null; created_at: string };
        Insert: { id?: string; code: string; description?: string | null };
        Update: Partial<Database['public']['Tables']['permissions']['Row']>;
      };
      role_permissions: {
        Row: { role_id: string; permission_id: string };
        Insert: { role_id: string; permission_id: string };
        Update: never;
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role_id: string;
          school_id: string | null;
          created_at: string;
        };
        Insert: { id?: string; user_id: string; role_id: string; school_id?: string | null };
        Update: Partial<Database['public']['Tables']['user_roles']['Row']>;
      };
      audit_logs: {
        Row: {
          id: string;
          school_id: string | null;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_data: Record<string, unknown> | null;
          new_data: Record<string, unknown> | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['audit_logs']['Row']> & {
          action: string;
          entity_type: string;
        };
        Update: never;
      };
      features: {
        Row: { id: string; code: string; name: string; description: string | null; created_at: string };
        Insert: { id?: string; code: string; name: string; description?: string | null };
        Update: Partial<Database['public']['Tables']['features']['Row']>;
      };
      plans: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          price: number;
          currency: string;
          billing_cycle: 'monthly' | 'yearly';
          trial_days: number;
          max_students: number | null;
          max_teachers: number | null;
          max_staff: number | null;
          storage_limit_mb: number | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['plans']['Row']> & { name: string; slug: string };
        Update: Partial<Database['public']['Tables']['plans']['Row']>;
      };
      plan_features: {
        Row: { plan_id: string; feature_id: string };
        Insert: { plan_id: string; feature_id: string };
        Update: never;
      };
      subscriptions: {
        Row: {
          id: string;
          school_id: string;
          plan_id: string;
          status: 'trial' | 'active' | 'suspended' | 'cancelled';
          start_date: string;
          end_date: string | null;
          trial_ends_at: string | null;
          auto_renew: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscriptions']['Row']> & {
          school_id: string;
          plan_id: string;
        };
        Update: Partial<Database['public']['Tables']['subscriptions']['Row']>;
      };
      subscription_payments: {
        Row: {
          id: string;
          subscription_id: string;
          school_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'succeeded' | 'failed' | 'refunded';
          payment_method: string | null;
          transaction_id: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subscription_payments']['Row']> & {
          subscription_id: string;
          school_id: string;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['subscription_payments']['Row']>;
      };
      students: {
        Row: {
          id: string;
          school_id: string;
          admission_number: string;
          first_name: string;
          middle_name: string | null;
          last_name: string;
          date_of_birth: string | null;
          gender: 'male' | 'female' | 'other' | null;
          blood_group: string | null;
          photo_url: string | null;
          email: string | null;
          phone: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          postal_code: string | null;
          admission_date: string;
          class_id: string | null;
          section_id: string | null;
          class_name: string | null;
          section_name: string | null;
          roll_number: string | null;
          academic_session: string | null;
          house: string | null;
          status: 'active' | 'inactive' | 'alumni' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['students']['Row']> & {
          school_id: string;
          admission_number: string;
          first_name: string;
          last_name: string;
        };
        Update: Partial<Database['public']['Tables']['students']['Row']>;
      };
      parents: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          full_name: string;
          relationship: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          occupation: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['parents']['Row']> & {
          school_id: string;
          full_name: string;
        };
        Update: Partial<Database['public']['Tables']['parents']['Row']>;
      };
      parent_students: {
        Row: { parent_id: string; student_id: string };
        Insert: { parent_id: string; student_id: string };
        Update: never;
      };
      teachers: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          employee_id: string;
          full_name: string;
          gender: 'male' | 'female' | 'other' | null;
          date_of_birth: string | null;
          phone: string | null;
          email: string | null;
          address: string | null;
          qualification: string | null;
          joining_date: string;
          department: string | null;
          designation: string | null;
          photo_url: string | null;
          status: 'active' | 'inactive' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['teachers']['Row']> & {
          school_id: string;
          employee_id: string;
          full_name: string;
        };
        Update: Partial<Database['public']['Tables']['teachers']['Row']>;
      };
      staff: {
        Row: {
          id: string;
          school_id: string;
          user_id: string | null;
          employee_id: string;
          full_name: string;
          role_title: string | null;
          department: string | null;
          phone: string | null;
          email: string | null;
          joining_date: string;
          status: 'active' | 'inactive' | 'archived';
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['staff']['Row']> & {
          school_id: string;
          employee_id: string;
          full_name: string;
        };
        Update: Partial<Database['public']['Tables']['staff']['Row']>;
      };
      student_attendance: {
        Row: {
          id: string;
          school_id: string;
          student_id: string;
          class_name: string | null;
          section_name: string | null;
          attendance_date: string;
          status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
          remarks: string | null;
          marked_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['student_attendance']['Row']> & {
          school_id: string;
          student_id: string;
          attendance_date: string;
          status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
        };
        Update: Partial<Database['public']['Tables']['student_attendance']['Row']>;
      };
      teacher_punch_records: {
        Row: {
          id: string;
          school_id: string;
          teacher_id: string;
          punch_date: string;
          punch_in: string | null;
          punch_out: string | null;
          working_minutes: number | null;
          status: 'open' | 'complete';
          latitude: number | null;
          longitude: number | null;
          device_info: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['teacher_punch_records']['Row']> & {
          school_id: string;
          teacher_id: string;
        };
        Update: Partial<Database['public']['Tables']['teacher_punch_records']['Row']>;
      };
      attendance_correction_requests: {
        Row: {
          id: string;
          school_id: string;
          teacher_id: string;
          punch_record_id: string | null;
          punch_date: string;
          requested_punch_in: string | null;
          requested_punch_out: string | null;
          reason: string;
          status: 'pending' | 'approved' | 'rejected';
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['attendance_correction_requests']['Row']> & {
          school_id: string;
          teacher_id: string;
          punch_date: string;
          reason: string;
        };
        Update: Partial<Database['public']['Tables']['attendance_correction_requests']['Row']>;
      };
      academic_sessions: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          is_current: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['academic_sessions']['Row']> & {
          school_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['academic_sessions']['Row']>;
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['classes']['Row']> & { school_id: string; name: string };
        Update: Partial<Database['public']['Tables']['classes']['Row']>;
      };
      sections: {
        Row: {
          id: string;
          school_id: string;
          class_id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['sections']['Row']> & {
          school_id: string;
          class_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['sections']['Row']>;
      };
      subjects: {
        Row: {
          id: string;
          school_id: string;
          name: string;
          code: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subjects']['Row']> & {
          school_id: string;
          name: string;
          code: string;
        };
        Update: Partial<Database['public']['Tables']['subjects']['Row']>;
      };
      class_teachers: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['class_teachers']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          teacher_id: string;
        };
        Update: Partial<Database['public']['Tables']['class_teachers']['Row']>;
      };
      subject_teachers: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['subject_teachers']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
        };
        Update: Partial<Database['public']['Tables']['subject_teachers']['Row']>;
      };
      timetables: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          day_of_week: number;
          period_number: number;
          start_time: string | null;
          end_time: string | null;
          room: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['timetables']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          day_of_week: number;
          period_number: number;
        };
        Update: Partial<Database['public']['Tables']['timetables']['Row']>;
      };
      homework: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          attachment_path: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['homework']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['homework']['Row']>;
      };
      assignments: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          due_date: string | null;
          max_marks: number | null;
          attachment_path: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['assignments']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['assignments']['Row']>;
      };
      assignment_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          school_id: string;
          student_id: string;
          submitted_at: string | null;
          attachment_path: string | null;
          status: 'pending' | 'submitted' | 'late' | 'graded';
          marks_obtained: number | null;
          feedback: string | null;
          graded_by: string | null;
          graded_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['assignment_submissions']['Row']> & {
          assignment_id: string;
          school_id: string;
          student_id: string;
        };
        Update: Partial<Database['public']['Tables']['assignment_submissions']['Row']>;
      };
      study_materials: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
          description: string | null;
          file_path: string | null;
          file_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['study_materials']['Row']> & {
          school_id: string;
          academic_session_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          teacher_id: string;
          title: string;
        };
        Update: Partial<Database['public']['Tables']['study_materials']['Row']>;
      };
      exams: {
        Row: {
          id: string;
          school_id: string;
          academic_session_id: string;
          name: string;
          exam_type: 'unit_test' | 'mid_term' | 'final' | 'monthly_test' | 'internal_assessment';
          start_date: string | null;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['exams']['Row']> & {
          school_id: string;
          academic_session_id: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['exams']['Row']>;
      };
      exam_subjects: {
        Row: {
          id: string;
          school_id: string;
          exam_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
          exam_date: string | null;
          max_marks: number;
          passing_marks: number;
          room: string | null;
          is_finalized: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['exam_subjects']['Row']> & {
          school_id: string;
          exam_id: string;
          class_id: string;
          section_id: string;
          subject_id: string;
        };
        Update: Partial<Database['public']['Tables']['exam_subjects']['Row']>;
      };
      marks: {
        Row: {
          id: string;
          school_id: string;
          exam_subject_id: string;
          student_id: string;
          marks_obtained: number | null;
          grade: string | null;
          remarks: string | null;
          entered_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database['public']['Tables']['marks']['Row']> & {
          school_id: string;
          exam_subject_id: string;
          student_id: string;
        };
        Update: Partial<Database['public']['Tables']['marks']['Row']>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      user_school_id: { Args: Record<string, never>; Returns: string | null };
      user_has_role: { Args: { role_name: string }; Returns: boolean };
      user_has_permission: { Args: { permission_code: string }; Returns: boolean };
      subscription_effective_status: { Args: { p_school_id: string }; Returns: string };
      school_has_feature: { Args: { feature_code: string }; Returns: boolean };
      current_teacher_id: { Args: Record<string, never>; Returns: string | null };
      apply_attendance_correction: { Args: { p_request_id: string }; Returns: void };
      teacher_teaches: { Args: { p_class_id: string; p_section_id: string; p_subject_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
