export interface SessionUser {
  id?: string;
  name: string;
  email: string;
  role: "admin" | "student" | string;
  designation?: string;
  branch?: string;
  roll_no?: string;
  semester?: string;
  batch?: string;
  cgpa?: string | number;
  attendance?: string | number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: string;
  attendance_pct: number;
  progress_pct: number;
  viva_status: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  day_index: number;
  start: string;
  end: string;
  subject: string;
  code: string;
  room: string;
  faculty: string;
  kind: string;
}

export interface TodaySchedule {
  day: string;
  entries: TimetableEntry[];
}

export interface Assignment {
  id: string;
  title: string;
  code: string;
  subject: string;
  due: string;
  status: string;
  marks?: number | null;
  submitted_at?: string | null;
}

export interface Notice {
  id: string;
  title: string;
  category: string;
  body: string;
  author: string;
  published: boolean;
  created_at: string;
}

export type NoticeInput = Pick<Notice, "title" | "category" | "body" | "published">;

export interface CampusEvent {
  id: string;
  title: string;
  club: string;
  category: string;
  description: string;
  venue: string;
  date: string;
  capacity: number;
  registered?: boolean | null;
  registered_count: number;
  is_past: boolean;
}

export type EventInput = Pick<CampusEvent, "title" | "club" | "category" | "description" | "venue" | "date" | "capacity">;

export interface ResourceItem {
  id: string;
  title: string;
  kind: string;
  subject: string;
  url: string;
  description: string;
  created_at: string;
}

export type ResourceInput = Pick<ResourceItem, "title" | "kind" | "subject" | "url" | "description">;

export interface TicketUpdate {
  status: string;
  note: string;
  at: string;
  by: string;
}

export interface Ticket {
  id: string;
  student_id: string;
  student_name: string;
  roll_no: string;
  category: string;
  subject: string;
  priority: string;
  description: string;
  status: string;
  created_at: string;
  updates: TicketUpdate[];
}

export type TicketInput = Pick<Ticket, "category" | "subject" | "priority" | "description">;
export interface TicketPatch {
  status: string;
  note?: string;
}

export interface AdminStats {
  students: number;
  notices_published: number;
  total_notices: number;
  upcoming_events: number;
  active_tickets: number;
  resolved_tickets: number;
  resources: number;
}
