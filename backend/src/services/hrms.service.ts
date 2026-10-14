import { SupabaseClient } from "@supabase/supabase-js";

export interface CreateBranchDTO {
  name: string;
  code?: string;
  city?: string;
  country?: string;
  address?: string;
  isHeadquarters?: boolean;
}

export interface CreatePositionDTO {
  title: string;
  code?: string;
  departmentId?: string;
  minSalary?: number;
  maxSalary?: number;
  basicSalary?: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: Array<{ name: string; amount: number }>;
  payFrequency?: string;
  currency?: string;
  description?: string;
}

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
  branchId?: string;
  branchLocation?: string;
  positionId?: string;
  employeeCode?: string;
  employmentType?: "full_time" | "part_time" | "contract" | "intern";
  salary?: number;
  hireDate?: string;
  avatarUrl?: string;
  avatarPublicId?: string;
  personalEmail?: string;
  personalPhone?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
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
        ),
        branches (
          id,
          name,
          city
        ),
        positions (
          id,
          title,
          basic_salary
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
    const employeeCode =
      dto.employeeCode || `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

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
        branch_id: dto.branchId || null,
        branch_location: dto.branchLocation || null,
        position_id: dto.positionId || null,
        employee_code: employeeCode,
        employment_type: dto.employmentType || "full_time",
        salary: dto.salary || 0,
        hire_date: dto.hireDate || new Date().toISOString().split("T")[0],
        avatar_url: dto.avatarUrl || null,
        avatar_public_id: dto.avatarPublicId || null,
        personal_email: dto.personalEmail || null,
        personal_phone: dto.personalPhone || null,
        emergency_contact_name: dto.emergencyContactName || null,
        emergency_contact_phone: dto.emergencyContactPhone || null,
        status: "active",
      })
      .select(`
        *,
        departments (
          id,
          name
        ),
        branches (
          id,
          name,
          city
        ),
        positions (
          id,
          title,
          basic_salary
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

  // ==========================================
  // DYNAMIC BRANCHES / LOCATIONS
  // ==========================================
  static async listBranches(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("branches")
      .select("*")
      .eq("organization_id", orgId)
      .order("is_headquarters", { ascending: false })
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to list branches: ${error.message}`);
    }

    return data || [];
  }

  static async createBranch(
    orgId: string,
    dto: CreateBranchDTO,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("branches")
      .insert({
        organization_id: orgId,
        name: dto.name,
        code: dto.code || null,
        city: dto.city || null,
        country: dto.country || null,
        address: dto.address || null,
        is_headquarters: !!dto.isHeadquarters,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create branch: ${error.message}`);
    }

    return data;
  }

  static async updateBranch(
    orgId: string,
    branchId: string,
    dto: Partial<CreateBranchDTO>,
    supabase: SupabaseClient
  ) {
    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.code !== undefined) updates.code = dto.code;
    if (dto.city !== undefined) updates.city = dto.city;
    if (dto.country !== undefined) updates.country = dto.country;
    if (dto.address !== undefined) updates.address = dto.address;
    if (dto.isHeadquarters !== undefined) updates.is_headquarters = dto.isHeadquarters;

    const { data, error } = await supabase
      .from("branches")
      .update(updates)
      .eq("id", branchId)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update branch: ${error.message}`);
    }

    return data;
  }

  static async deleteBranch(orgId: string, branchId: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from("branches")
      .delete()
      .eq("id", branchId)
      .eq("organization_id", orgId);

    if (error) {
      throw new Error(`Failed to delete branch: ${error.message}`);
    }

    return { message: "Branch deleted successfully" };
  }

  // ==========================================
  // DYNAMIC POSITIONS & SALARY STRUCTURES
  // ==========================================
  static async listPositions(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("positions")
      .select(`
        *,
        departments (
          id,
          name
        )
      `)
      .eq("organization_id", orgId)
      .order("title", { ascending: true });

    if (error) {
      throw new Error(`Failed to list positions: ${error.message}`);
    }

    return data || [];
  }

  static async createPosition(
    orgId: string,
    dto: CreatePositionDTO,
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("positions")
      .insert({
        organization_id: orgId,
        department_id: dto.departmentId || null,
        title: dto.title,
        code: dto.code || null,
        min_salary: dto.minSalary || 0,
        max_salary: dto.maxSalary || 0,
        basic_salary: dto.basicSalary || 0,
        house_rent_allowance: dto.houseRentAllowance || 0,
        medical_allowance: dto.medicalAllowance || 0,
        transport_allowance: dto.transportAllowance || 0,
        other_allowances: dto.otherAllowances || [],
        pay_frequency: dto.payFrequency || "Monthly",
        currency: dto.currency || "USD",
        description: dto.description || null,
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
      throw new Error(`Failed to create position: ${error.message}`);
    }

    return data;
  }

  static async updatePosition(
    orgId: string,
    positionId: string,
    dto: Partial<CreatePositionDTO>,
    supabase: SupabaseClient
  ) {
    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.code !== undefined) updates.code = dto.code;
    if (dto.departmentId !== undefined) updates.department_id = dto.departmentId;
    if (dto.minSalary !== undefined) updates.min_salary = dto.minSalary;
    if (dto.maxSalary !== undefined) updates.max_salary = dto.maxSalary;
    if (dto.basicSalary !== undefined) updates.basic_salary = dto.basicSalary;
    if (dto.houseRentAllowance !== undefined) updates.house_rent_allowance = dto.houseRentAllowance;
    if (dto.medicalAllowance !== undefined) updates.medical_allowance = dto.medicalAllowance;
    if (dto.transportAllowance !== undefined) updates.transport_allowance = dto.transportAllowance;
    if (dto.otherAllowances !== undefined) updates.other_allowances = dto.otherAllowances;
    if (dto.payFrequency !== undefined) updates.pay_frequency = dto.payFrequency;
    if (dto.currency !== undefined) updates.currency = dto.currency;
    if (dto.description !== undefined) updates.description = dto.description;

    const { data, error } = await supabase
      .from("positions")
      .update(updates)
      .eq("id", positionId)
      .eq("organization_id", orgId)
      .select(`
        *,
        departments (
          id,
          name
        )
      `)
      .single();

    if (error) {
      throw new Error(`Failed to update position: ${error.message}`);
    }

    return data;
  }

  static async deletePosition(orgId: string, positionId: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from("positions")
      .delete()
      .eq("id", positionId)
      .eq("organization_id", orgId);

    if (error) {
      throw new Error(`Failed to delete position: ${error.message}`);
    }

    return { message: "Position deleted successfully" };
  }

  // ==========================================
  // PROBATION DURATIONS & POLICIES
  // ==========================================
  static async listProbationDurations(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("probation_durations")
      .select("*")
      .eq("organization_id", orgId)
      .order("duration_months", { ascending: true });

    if (error) {
      throw new Error(`Failed to list probation durations: ${error.message}`);
    }
    return data || [];
  }

  static async createProbationDuration(
    orgId: string,
    dto: {
      title: string;
      durationMonths: number;
      durationDays?: number;
      evaluationFrequency?: string;
      noticePeriodDays?: number;
      isDefault?: boolean;
      description?: string;
    },
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("probation_durations")
      .insert({
        organization_id: orgId,
        title: dto.title,
        duration_months: dto.durationMonths,
        duration_days: dto.durationDays || null,
        evaluation_frequency: dto.evaluationFrequency || "Monthly",
        notice_period_days: dto.noticePeriodDays || 14,
        is_default: dto.isDefault || false,
        description: dto.description || null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create probation duration: ${error.message}`);
    }
    return data;
  }

  static async updateProbationDuration(
    orgId: string,
    id: string,
    dto: Partial<{
      title: string;
      durationMonths: number;
      durationDays?: number;
      evaluationFrequency?: string;
      noticePeriodDays?: number;
      isDefault?: boolean;
      description?: string;
    }>,
    supabase: SupabaseClient
  ) {
    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.durationMonths !== undefined) updates.duration_months = dto.durationMonths;
    if (dto.durationDays !== undefined) updates.duration_days = dto.durationDays;
    if (dto.evaluationFrequency !== undefined) updates.evaluation_frequency = dto.evaluationFrequency;
    if (dto.noticePeriodDays !== undefined) updates.notice_period_days = dto.noticePeriodDays;
    if (dto.isDefault !== undefined) updates.is_default = dto.isDefault;
    if (dto.description !== undefined) updates.description = dto.description;

    const { data, error } = await supabase
      .from("probation_durations")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update probation duration: ${error.message}`);
    }
    return data;
  }

  static async deleteProbationDuration(orgId: string, id: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from("probation_durations")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      throw new Error(`Failed to delete probation duration: ${error.message}`);
    }
    return { message: "Probation duration deleted successfully" };
  }

  // ==========================================
  // WORK SHIFTS
  // ==========================================
  static async listShifts(orgId: string, supabase: SupabaseClient) {
    const { data, error } = await supabase
      .from("shifts")
      .select("*")
      .eq("organization_id", orgId)
      .order("start_time", { ascending: true });

    if (error) {
      throw new Error(`Failed to list shifts: ${error.message}`);
    }
    return data || [];
  }

  static async createShift(
    orgId: string,
    dto: {
      name: string;
      code?: string;
      startTime: string;
      endTime: string;
      gracePeriodMinutes?: number;
      breakDurationMinutes?: number;
      halfDayThresholdHours?: number;
      workDays?: string[];
      isDefault?: boolean;
      description?: string;
    },
    supabase: SupabaseClient
  ) {
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        organization_id: orgId,
        name: dto.name,
        code: dto.code || null,
        start_time: dto.startTime,
        end_time: dto.endTime,
        grace_period_minutes: dto.gracePeriodMinutes || 15,
        break_duration_minutes: dto.breakDurationMinutes || 60,
        half_day_threshold_hours: dto.halfDayThresholdHours || 4.5,
        work_days: dto.workDays || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        is_default: dto.isDefault || false,
        description: dto.description || null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to create shift: ${error.message}`);
    }
    return data;
  }

  static async updateShift(
    orgId: string,
    id: string,
    dto: Partial<{
      name: string;
      code?: string;
      startTime: string;
      endTime: string;
      gracePeriodMinutes?: number;
      breakDurationMinutes?: number;
      halfDayThresholdHours?: number;
      workDays?: string[];
      isDefault?: boolean;
      description?: string;
    }>,
    supabase: SupabaseClient
  ) {
    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.code !== undefined) updates.code = dto.code;
    if (dto.startTime !== undefined) updates.start_time = dto.startTime;
    if (dto.endTime !== undefined) updates.end_time = dto.endTime;
    if (dto.gracePeriodMinutes !== undefined) updates.grace_period_minutes = dto.gracePeriodMinutes;
    if (dto.breakDurationMinutes !== undefined) updates.break_duration_minutes = dto.breakDurationMinutes;
    if (dto.halfDayThresholdHours !== undefined) updates.half_day_threshold_hours = dto.halfDayThresholdHours;
    if (dto.workDays !== undefined) updates.work_days = dto.workDays;
    if (dto.isDefault !== undefined) updates.is_default = dto.isDefault;
    if (dto.description !== undefined) updates.description = dto.description;

    const { data, error } = await supabase
      .from("shifts")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select("*")
      .single();

    if (error) {
      throw new Error(`Failed to update shift: ${error.message}`);
    }
    return data;
  }

  static async deleteShift(orgId: string, id: string, supabase: SupabaseClient) {
    const { error } = await supabase
      .from("shifts")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      throw new Error(`Failed to delete shift: ${error.message}`);
    }
    return { message: "Shift deleted successfully" };
  }
}
