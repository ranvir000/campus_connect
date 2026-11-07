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
