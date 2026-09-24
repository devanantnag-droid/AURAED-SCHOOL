export type PersonStatus = 'active' | 'inactive' | 'alumni' | 'archived';

export interface Student {
  id: string;
  schoolId: string;
  admissionNumber: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  dateOfBirth: string | null;
  gender: 'male' | 'female' | 'other' | null;
  bloodGroup: string | null;
  photoUrl: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  admissionDate: string;
  classId: string | null;
  sectionId: string | null;
  className: string | null;
  sectionName: string | null;
  rollNumber: string | null;
  academicSession: string | null;
  house: string | null;
  userId: string | null;
  status: PersonStatus;
}

export interface StudentFormValues {
  admissionNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  bloodGroup?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  admissionDate?: string;
  classId?: string | null;
  sectionId?: string | null;
  rollNumber?: string;
  academicSession?: string;
  house?: string;
}

export interface Parent {
  id: string;
  schoolId: string;
  fullName: string;
  relationship: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  occupation: string | null;
  photoUrl: string | null;
  childIds: string[];
  userId: string | null;
}

export interface ParentFormValues {
  fullName: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
  occupation?: string;
}

export interface Teacher {
  id: string;
  schoolId: string;
  userId: string | null;
  employeeId: string;
  fullName: string;
  gender: 'male' | 'female' | 'other' | null;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  qualification: string | null;
  joiningDate: string;
  department: string | null;
  designation: string | null;
  photoUrl: string | null;
  status: PersonStatus;
}

export interface TeacherFormValues {
  employeeId: string;
  fullName: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  address?: string;
  qualification?: string;
  joiningDate?: string;
  department?: string;
  designation?: string;
}

export interface StaffMember {
  id: string;
  schoolId: string;
  employeeId: string;
  fullName: string;
  roleTitle: string | null;
  department: string | null;
  phone: string | null;
  email: string | null;
  joiningDate: string;
  status: PersonStatus;
}

export interface StaffFormValues {
  employeeId: string;
  fullName: string;
  roleTitle?: string;
  department?: string;
  phone?: string;
  email?: string;
  joiningDate?: string;
}
