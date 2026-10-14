export type EmploymentType = "full_time" | "part_time" | "contract" | "intern";
export type EmployeeStatus = "active" | "on_leave" | "terminated";
export type AttendanceStatus = "present" | "late" | "half_day" | "absent";
export type LeaveType = "annual" | "sick" | "casual" | "maternity" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";

export interface Branch {
  id: string;
  organization_id: string;
  name: string;
  code?: string | null;
  city?: string | null;
  country?: string | null;
  address?: string | null;
  is_headquarters: boolean;
  created_at: string;
  updated_at?: string;
}

export interface Position {
  id: string;
  organization_id: string;
  department_id?: string | null;
  title: string;
  code?: string | null;
  min_salary: number;
  max_salary: number;
  basic_salary: number;
  house_rent_allowance: number;
  medical_allowance: number;
  transport_allowance: number;
  other_allowances?: Array<{ name: string; amount: number }>;
  pay_frequency: string;
  currency: string;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  departments?: {
    id: string;
    name: string;
  } | null;
}

export interface Department {
  id: string;
  organization_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  employees?: { count: number }[] | number;
}

export interface ProbationDuration {
  id: string;
  organization_id: string;
  title: string;
  duration_months: number;
  duration_days?: number | null;
  evaluation_frequency: string;
  notice_period_days: number;
  is_default: boolean;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  employees_count?: number;
}

export interface Shift {
  id: string;
  organization_id: string;
  name: string;
  code?: string | null;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
  break_duration_minutes: number;
  half_day_threshold_hours?: number;
  work_days: string[];
  is_default: boolean;
  description?: string | null;
  created_at: string;
  updated_at?: string;
  employees_count?: number;
}

export interface SalaryStructure {
  basic_salary?: number;
  house_rent_allowance?: number;
  medical_allowance?: number;
  transport_allowance?: number;
  other_allowances?: number;
  pay_frequency?: string;
  currency?: string;
}

export interface Employee {
  id: string;
  organization_id: string;
  user_id?: string | null;
  department_id?: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  job_title: string;
  employment_type: EmploymentType;
  status: EmployeeStatus;
  hire_date: string;
  salary: number;
  avatar_url?: string | null;
  avatar_public_id?: string | null;
  created_at: string;
  updated_at?: string;

  // Rich Onboarding & Hierarchy fields
  employee_code?: string | null;
  branch_id?: string | null;
  branch_location?: string | null;
  position_id?: string | null;
  probation_duration_months?: number;
  probation_end_date?: string | null;
  work_location?: string;
  shift?: string;
  cost_center?: string | null;
  personal_email?: string | null;
  personal_phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relationship?: string | null;
  emergency_contact_phone?: string | null;
  salary_structure?: SalaryStructure | null;
  bank_name?: string | null;
  account_holder_name?: string | null;
  bank_account_number?: string | null;
  account_number?: string | null;
  branch_name?: string | null;
  routing_number?: string | null;
  tax_id?: string | null;
  onboarding_id?: string | null;
  shift_id?: string | null;
  probation_duration_id?: string | null;

  departments?: {
    id: string;
    name: string;
  } | null;
  branches?: {
    id: string;
    name: string;
    city?: string | null;
  } | null;
  positions?: Position | {
    id: string;
    title: string;
    basic_salary?: number;
    salary_structure?: SalaryStructure;
  } | null;
  shifts?: Shift | null;
  probation_durations?: ProbationDuration | null;
}

export interface AttendanceRecord {
  id: string;
  organization_id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out?: string | null;
  status: AttendanceStatus;
  notes?: string | null;
  created_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    job_title: string;
    email: string;
  } | null;
}

export interface LeaveRequest {
  id: string;
  organization_id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  created_at: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    job_title: string;
  } | null;
}

export interface HRMSStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  presentToday: number;
  onLeaveToday: number;
  date: string;
}
