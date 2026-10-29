export type Grade =
  | 'الصف الرابع الابتدائي'
  | 'الصف الخامس الابتدائي'
  | 'الصف السادس الابتدائي'
  | 'الصف الأول الإعدادي'
  | 'الصف الثاني الإعدادي'
  | 'الصف الثالث الإعدادي'
  | 'الصف الأول الثانوي – عام'
  | 'الصف الأول الثانوي – بكالوريا'
  | 'الصف الثاني الثانوي – عام'
  | 'الصف الثاني الثانوي – بكالوريا'
  | 'الصف الثالث الثانوي – عام'
  | 'الصف الثالث الثانوي – بكالوريا'
  | 'كل الصفوف';

export const GRADES: Grade[] = [
  'الصف الرابع الابتدائي',
  'الصف الخامس الابتدائي',
  'الصف السادس الابتدائي',
  'الصف الأول الإعدادي',
  'الصف الثاني الإعدادي',
  'الصف الثالث الإعدادي',
  'الصف الأول الثانوي – عام',
  'الصف الأول الثانوي – بكالوريا',
  'الصف الثاني الثانوي – عام',
  'الصف الثاني الثانوي – بكالوريا',
  'الصف الثالث الثانوي – عام',
  'الصف الثالث الثانوي – بكالوريا',
];

export interface Course {
  id: string;
  title: string;
  description?: string;
  grade: string;
  price: number;
  days: number;
  status?: 'published' | 'archived';
  isFree?: boolean;
  active?: boolean;
  expiresAt?: string;
  imageUrl?: string;
  imageFileId?: string;
  content?: CourseContentItem[];
  created?: string;
}

export interface CourseContentItem {
  id: string;
  type: 'video' | 'image' | 'note' | 'homework';
  title: string;
  grade?: string;
  courseId?: string;
  link?: string;
  fileId?: string;
  fileName?: string;
  mime?: string;
  url?: string;
  isFree?: boolean;
  blocked?: string[];
  created?: string;
}

export interface Exam {
  id: string;
  title: string;
  grade: string;
  courseId?: string;
  type: 'اختياري' | 'مقالي' | 'مختلط';
  questions: (string | { text: string })[];
  kinds?: ('mcq' | 'essay')[] | null;
  options?: string[][];
  key?: (string | null)[] | string | null;
  models?: string[];
  modelAnswer?: string;
  taken?: boolean;
  created?: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  answers: string[];
  total: number;
  score: number | null;
  label?: string;
  status: 'pending' | 'graded';
  aiGraded?: boolean;
  created: string;
  appeal?: {
    id: string;
    resultId: string;
    studentName: string;
    examTitle: string;
    reason: string;
    status: 'pending' | 'reviewed';
    score?: string;
  } | null;
}

export interface Notice {
  id: string;
  kind: 'announcement' | 'schedule';
  text: string;
  grade: string;
  created: string;
}

export interface Note {
  id: string;
  studentId: string;
  text: string;
  created: string;
}

export interface Message {
  id: string;
  studentId: string;
  name: string;
  text: string;
  reply: string;
  created: string;
}

export interface ManualGateway {
  id: string;
  title: string;
  provider: 'vodafone' | 'instapay' | 'fawry' | 'bank' | 'orange' | 'etisalat' | 'we' | 'custom' | string;
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  active: boolean;
  created?: string;
}

export interface WalletTransaction {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  studentCode?: string;
  type: 'deposit' | 'purchase' | 'adjustment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  gatewayId?: string;
  gatewayTitle?: string;
  accountNumber?: string;
  senderPhone?: string;
  referenceNumber?: string;
  receiptFile?: string;
  receiptUrl?: string;
  courseId?: string;
  courseTitle?: string;
  notes?: string;
  rejectionReason?: string;
  created: string;
  reviewedAt?: string;
}

export interface StudentProfile {
  name: string;
  grade: string;
  code: string;
  subEnd?: string;
  sub: boolean;
  phone: string;
  walletBalance?: number;
}

export interface StudentData {
  profile: StudentProfile;
  courses: Course[];
  notices: Notice[];
  content: CourseContentItem[];
  exams: Exam[];
  results: ExamResult[];
  messages: Message[];
  notes: Note[];
  gateways?: ManualGateway[];
  walletTransactions?: WalletTransaction[];
  onlinePay?: boolean;
}

export interface ParentProgress {
  videosWatched: number;
  videosTotal: number;
  filesOpened: number;
  filesTotal: number;
  examsDone: number;
  examsTotal: number;
  notes: number;
  average: number | null;
  label: string;
  lastActive: string;
}

export interface ParentData {
  name: string;
  grade: string;
  status: string;
  sub: boolean;
  subEnd?: string;
  results: ExamResult[];
  progress: ParentProgress;
}

export interface PaymentMethod {
  title: string;
  details?: string;
}

export interface SocialLink {
  id: string;
  platform: 'linkedin' | 'x' | 'tiktok' | 'youtube' | 'telegram' | 'instagram' | 'facebook' | 'whatsapp' | 'custom' | string;
  title: string;
  url: string;
  active?: boolean;
}

export interface PublicData {
  name: string;
  subtitle?: string;
  logoFile?: string;
  logoSize?: number;
  bgPattern?: string;
  primaryColor?: string;
  headingColor?: string;
  textColor?: string;
  pageThemes?: Record<string, any>;
  academicColors?: Record<string, any>;
  studentTabsVisibility?: Record<string, boolean>;
  registrationFieldsConfig?: Record<string, any>;
  reviewsConfig?: Record<string, any>;
  payments: PaymentMethod[];
  onlinePay: boolean;
  hero: string;
  courses: Course[];
  socialLinks?: SocialLink[];
  gateways?: ManualGateway[];
}

export interface ActivationCode {
  id: string;
  hint: string;
  days: number;
  courseId: string;
  status: 'unused' | 'used' | 'cancelled';
  created: string;
}

export interface Order {
  id: string;
  status: 'pending' | 'paid' | 'review' | 'confirmed' | 'cancelled' | 'shipped' | 'delivered';
  amount: number;
  created: string;
  paidAt?: string;
  student?: string;
  studentId?: string;
  courseId?: string;
  course?: string;
}

export interface TeacherData {
  name: string;
  subtitle?: string;
  logoFile?: string;
  logoSize?: number;
  bgPattern?: string;
  primaryColor?: string;
  headingColor?: string;
  textColor?: string;
  pageThemes?: Record<string, any>;
  academicColors?: Record<string, any>;
  studentTabsVisibility?: Record<string, boolean>;
  registrationFieldsConfig?: Record<string, any>;
  reviewsConfig?: Record<string, any>;
  notificationConfig?: Record<string, any>;
  mediaBank?: any[];
  bookings?: any[];
  payments: PaymentMethod[];
  onlinePay?: boolean;
  orders: Order[];
  students: any[];
  parents: any[];
  courses: Course[];
  content: CourseContentItem[];
  notices: Notice[];
  exams: Exam[];
  results: ExamResult[];
  appeals: any[];
  messages: Message[];
  codes: ActivationCode[];
  socialLinks?: SocialLink[];
  gateways?: ManualGateway[];
  paymentGateways?: ManualGateway[];
  walletTransactions?: WalletTransaction[];
  walletRechargeRequests?: WalletTransaction[];
  packageOrders?: any[];
}

