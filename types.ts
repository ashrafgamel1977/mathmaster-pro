
import React, { ReactNode } from 'react';

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  STUDENTS = 'STUDENTS',
  SCHEDULE = 'SCHEDULE',
  ASSIGNMENTS = 'ASSIGNMENTS',
  QUIZZES = 'QUIZZES',
  LIVE_CLASS = 'LIVE_CLASS',
  FILES = 'FILES',
  MANAGEMENT = 'MANAGEMENT',
  RESULTS = 'RESULTS',
  SETTINGS = 'SETTINGS',
  STUDENT_PORTAL = 'STUDENT_PORTAL',
  CHAT = 'CHAT',
  CALL_CENTER = 'CALL_CENTER',
  TEST_CENTER = 'TEST_CENTER',
  LAUNCH_GUIDE = 'LAUNCH_GUIDE',
  LEADERBOARD = 'LEADERBOARD',
  AI_SOLVER = 'AI_SOLVER',
  NOTIFICATIONS = 'NOTIFICATIONS',
  FORMULAS = 'FORMULAS',
  REGISTRATION = 'REGISTRATION',
  REWARDS = 'REWARDS'
}

export type PortalTheme = 'indigo' | 'emerald' | 'rose' | 'amber' | 'slate' | 'violet';
export type PortalLayout = 'default' | 'compact' | 'stats-focused' | 'modern';
export type MathNotation = 'arabic' | 'english';

export interface Assistant {
  id: string;
  name: string;
  code: string;
  permissions: AppView[];
  addedAt: string;
}

export interface CustomSection {
  id: string;
  title: string;
  icon: string;
  content: string;
  isVisibleToStudents: boolean;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  awardedAt: string;
}

export interface PlatformReward {
  id: string;
  title: string;
  cost: number;
  icon: string;
  description: string;
  stock?: number;
}

export interface RewardRedemption {
  id: string;
  studentId: string;
  studentName: string;
  rewardId: string;
  rewardTitle: string;
  status: 'pending' | 'delivered';
  timestamp: string;
}

export interface Student {
  id: string;
  studentCode: string;
  name: string;
  studentPhone: string;
  parentPhone: string;
  yearId: string;
  groupId: string;
  attendance: boolean;
  score: number;
  points: number;
  avatar: string;
  scoreHistory: number[];
  status: 'active' | 'pending';
  registrationDate?: string;
  badges: Badge[];
  streaks: number;
  deviceIds: string[];
  isPaid?: boolean;
  balance?: number;
  lastReadNotificationId?: string;
  lastSpinDate?: string;
}

export interface Year { id: string; name: string; }
export interface Group { 
  id: string; 
  name: string; 
  yearId: string; 
  time: string; 
  joinCode: string; 
  whatsappLink?: string;
  type: 'center' | 'online';
  gender: 'boys' | 'girls' | 'mixed';
  capacity?: number;
  codePrefix?: string;
}
export interface Quiz { id: string; title: string; yearId: string; date: string; type: string; questions?: any[]; }
export interface QuizResult { id: string; studentId: string; quizId: string; quizTitle: string; score: number; status: 'pending' | 'graded'; date: string; handwrittenUrl?: string; aiFeedback?: string; }

export interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  yearId: string;
  type: string;
  externalLink?: string;
  fileUrl?: string;
  status: 'active' | 'archived';
  submissions: number;
  attachments?: AssignmentAttachment[];
}

export interface AssignmentAttachment {
  name: string;
  url: string;
}

export interface AssignmentSubmission { 
  id: string; 
  assignmentId: string; 
  studentId: string; 
  studentName: string; 
  fileUrl: string; 
  grade?: number; 
  status: 'pending' | 'graded'; 
  feedback?: string; 
  aiSuggestedGrade?: number;
  aiAnalysis?: string;
}

export interface EducationalSource {
  id: string;
  name: string;
  data: string;
  mimeType: string;
  uploadDate: string;
  yearId: string;
}

export interface ScheduleEntry {
  id: string;
  groupId: string;
  day: string;
  time: string;
  topic: string;
  type: 'center' | 'online';
}

export interface MathFormula {
  id: string;
  branch: string;
  title: string;
  content: string;
  yearId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'student';
  text: string;
  timestamp: string;
  type: 'group' | 'private' | 'system';
  recipientId?: string;
  yearId?: string;
  audioData?: string;
}

export interface VideoLesson {
  id: string;
  title: string;
  youtubeUrl: string;
  yearId: string;
  uploadDate: string;
  thumbnailUrl?: string;
}

export interface VideoView {
  id: string;
  studentId: string;
  videoId: string;
  watchedPercent: number;
  lastWatched: string;
}

export interface ParentInquiry {
  id: string;
  studentId: string;
  studentName: string;
  parentPhone: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'calling' | 'resolved';
  timestamp: string;
}

export interface CallLog {
  id: string;
  studentId: string;
  parentName: string;
  note: string;
  date: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'academic' | 'urgent' | 'general' | 'system';
  targetStudentId?: string;
  targetYearId?: string;
  timestamp: string;
  isRead: boolean;
}

export interface PlatformSettings {
  teacherName: string;
  platformName: string;
  studentWelcomeMsg: string; 
  parentWelcomeMsg: string;  
  protectionEnabled: boolean;
  watermarkEnabled: boolean;
  watermarkText: string;
  portalTheme: PortalTheme;
  portalLayout: PortalLayout;
  liveSessionActive: boolean;
  liveSessionLink: string;
  liveSessionTitle: string;
  allowSelfRegistration: boolean;
  mathNotation: MathNotation;
  autoAttendanceEnabled: boolean;
  autoParentReportEnabled: boolean;
  enableChat: boolean;
  enableLeaderboard: boolean;
  enableAiSolver: boolean;
  examMode: boolean;
  maxDevicesPerStudent: number;
  viewLabels?: Record<string, string>;
  enabledViews?: string[];
  customSections?: CustomSection[];
}
