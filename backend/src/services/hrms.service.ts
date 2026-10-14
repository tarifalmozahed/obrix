import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateDepartmentDTO {
  name: string;
  description?: string;
}

export interface CreateEmployeeDTO {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  departmentId?: string;
  employmentType?: "full_time" | "part_time" | "contract" | "intern";
  salary?: number;
  hireDate?: string;
}

export interface CreateLeaveRequestDTO {
  employeeId: string;
  leaveType: "annual" | "sick" | "casual" | "maternity" | "unpaid";
  startDate: string;
  endDate: string;
  reason: string;
}

export class HRMSService {
  // ==========================================
  // DEPARTMENTS
  // ==========================================
  static async listDepartments(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("departments")
      .select("*, employees:employees(count)")
      .eq("organization_id", orgId)
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list departments: ${error.message}`);
    }

    return data;
  }

  static async createDepartment(
    orgId: string,
    dto: CreateDepartmentDTO,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("departments")
      .insert({
        organization_id: orgId,
        name: dto.name,
        description: dto.description || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create department: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // EMPLOYEES
  // ==========================================
  static async listEmployees(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("employees")
      .select(`
        *,
        departments (
          id,
          name
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list employees: ${error.message}`);
    }

    return data;
  }

  static async createEmployee(
    orgId: string,
    dto: CreateEmployeeDTO,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("employees")
      .insert({
        organization_id: orgId,
        first_name: dto.firstName,
        last_name: dto.lastName,
        email: dto.email,
        phone: dto.phone || null,
        job_title: dto.jobTitle,
        department_id: dto.departmentId || null,
        employment_type: dto.employmentType || "full_time",
        salary: dto.salary || 0,
        hire_date: dto.hireDate || new Date().toISOString().split("T")[0],
        status: "active",
      })
      .select(`
        *,
        departments (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to create employee: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // ATTENDANCE
  // ==========================================
  static async listAttendance(
    orgId: string,
    targetDate: string,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          job_title,
          email
        )
      `)
      .eq("organization_id", orgId)
      .eq("date", targetDate)
      .order("clock_in", { ascending: false });

    if (error) {
      throw new Error(`Failed to list attendance: ${error.message}`);
    }

    return data;
  }

  static async clockIn(
    orgId: string,
    employeeId: string,
    notes: string | undefined,
    supabase: SupabaseClient
  ) {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .insert({
        organization_id: orgId,
        employee_id: employeeId,
        date: today,
        clock_in: new Date().toISOString(),
        status: "present",
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Clock-in failed (already clocked in today?): ${error.message}`);
    }

    return data;
  }

  static async clockOut(
    orgId: string,
    employeeId: string,
    supabase: SupabaseClient
  ) {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("attendance")
      .update({
        clock_out: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("employee_id", employeeId)
      .eq("date", today)
      .select()
      .single();

    if (error) {
      throw new Error(`Clock-out failed: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // LEAVE REQUESTS
  // ==========================================
  static async listLeaveRequests(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("leave_requests")
      .select(`
        *,
        employees (
          id,
          first_name,
          last_name,
          job_title
        )
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list leave requests: ${error.message}`);
    }

    return data;
  }

  static async createLeaveRequest(
    orgId: string,
    dto: CreateLeaveRequestDTO,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        organization_id: orgId,
        employee_id: dto.employeeId,
        leave_type: dto.leaveType,
        start_date: dto.startDate,
        end_date: dto.endDate,
        reason: dto.reason,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create leave request: ${error.message}`);
    }

    return data;
  }

  static async updateLeaveStatus(
    orgId: string,
    leaveId: string,
    status: "approved" | "rejected",
    reviewerId: string,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", leaveId)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update leave status: ${error.message}`);
    }

    return data;
  }

  // ==========================================
  // HRMS KPI & STATS
  // ==========================================
  static async getStats(orgId: string, supabase: SupabaseClient) {
    const today = new Date().toISOString().split("T")[0];

    const [empRes, deptRes, attRes, leaveRes] = await Promise.all([
      supabase.from("employees").select("id, status", { count: "exact" }).eq("organization_id", orgId),
      supabase.from("departments").select("id", { count: "exact" }).eq("organization_id", orgId),
      supabase.from("attendance").select("id", { count: "exact" }).eq("organization_id", orgId).eq("date", today),
      supabase.from("leave_requests").select("id", { count: "exact" }).eq("organization_id", orgId).eq("status", "approved").lte("start_date", today).gte("end_date", today),
    ]);

    const totalEmployees = empRes.count || 0;
    const activeEmployees = empRes.data?.filter((e) => e.status === "active").length || 0;
    const totalDepartments = deptRes.count || 0;
    const presentToday = attRes.count || 0;
    const onLeaveToday = leaveRes.count || 0;

    return {
      totalEmployees,
      activeEmployees,
      totalDepartments,
      presentToday,
      onLeaveToday,
      date: today,
    };
  }
}
