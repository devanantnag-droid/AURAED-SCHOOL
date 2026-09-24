export type AnnouncementTargetType = 'all' | 'role' | 'class';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  targetType: AnnouncementTargetType;
  targetRole: string | null;
  targetClassId: string | null;
  targetClassName?: string;
  createdAt: string;
}

export interface ColleagueProfile {
  id: string;
  fullName: string;
  email: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export const ROLE_OPTIONS = [
  'SCHOOL_ADMIN', 'TEACHER', 'PARENT', 'STUDENT', 'ACCOUNTANT',
  'LIBRARIAN', 'RECEPTIONIST', 'TRANSPORT_MANAGER', 'HR_MANAGER',
];
