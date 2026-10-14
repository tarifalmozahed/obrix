"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { apiRequest } from "@/lib/api";

interface Organization {
  role: string;
  organizations: {
    id: string;
    name: string;
    slug: string;
  };
}

interface Department {
  id: string;
  name: string;
  description?: string;
  employees?: [{ count: number }];
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  job_title: string;
  employment_type: string;
  status: string;
  hire_date: string;
  salary: number;
  departments?: { id: string; name: string };
}

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string;
  clock_out?: string;
  status: string;
  notes?: string;
  employees?: { first_name: string; last_name: string; job_title: string; email: string };
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  employees?: { first_name: string; last_name: string; job_title: string };
}

interface HRMSStats {
  totalEmployees: number;
  activeEmployees: number;
  totalDepartments: number;
  presentToday: number;
  onLeaveToday: number;
  date: string;
}

export default function HRMSPage() {
  const [activeTab, setActiveTab] = useState<"employees" | "attendance" | "leaves" | "departments">("employees");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("member");
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<HRMSStats | null>(null);

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  // Modals & form state
  const [showAddEmp, setShowAddEmp] = useState(false);
  const [newEmp, setNewEmp] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobTitle: "",
    departmentId: "",
    employmentType: "full_time" as const,
    salary: 65000,
  });

  const [showAddDept, setShowAddDept] = useState(false);
  const [newDept, setNewDept] = useState({ name: "", description: "" });

  const [currentDate, setCurrentDate] = useState<string>("");
  const [showRequestLeave, setShowRequestLeave] = useState(false);
  const [newLeave, setNewLeave] = useState({
    employeeId: "",
    leaveType: "annual" as const,
    startDate: "",
    endDate: "",
    reason: "",
  });

  const [clockInEmpId, setClockInEmpId] = useState("");
  const [clockInNotes, setClockInNotes] = useState("");
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setCurrentDate(today);
    setNewLeave((prev) => ({
      ...prev,
      startDate: today,
      endDate: today,
    }));
  }, []);

  // 1. Load user's organizations
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const res = await apiRequest<Organization[]>("/organizations");
      if (res.success && res.data && res.data.length > 0) {
        setOrganizations(res.data);
        const first = res.data[0];
        setSelectedOrgId(first.organizations.id);
        setUserRole(first.role);
      }
    }
    init();
  }, []);

  // 2. Fetch HRMS data on organization switch
  useEffect(() => {
    if (!selectedOrgId) return;
    loadAllData();
  }, [selectedOrgId]);

  const loadAllData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const [statsRes, empRes, deptRes, attRes, leaveRes] = await Promise.all([
        apiRequest<HRMSStats>("/hrms/stats", {}, selectedOrgId),
        apiRequest<Employee[]>("/hrms/employees", {}, selectedOrgId),
        apiRequest<Department[]>("/hrms/departments", {}, selectedOrgId),
        apiRequest<AttendanceRecord[]>("/hrms/attendance", {}, selectedOrgId),
        apiRequest<LeaveRequest[]>("/hrms/leaves", {}, selectedOrgId),
      ]);

      if (statsRes.success && statsRes.data) setStats(statsRes.data);
      if (empRes.success && empRes.data) setEmployees(empRes.data);
      if (deptRes.success && deptRes.data) setDepartments(deptRes.data);
      if (attRes.success && attRes.data) setAttendance(attRes.data);
      if (leaveRes.success && leaveRes.data) setLeaves(leaveRes.data);
    } catch {
      // Pending migrations
    } finally {
      setLoading(false);
    }
  };

  // Actions
  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest("/hrms/departments", {
      method: "POST",
      body: JSON.stringify(newDept),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: "Department created successfully!", type: "success" });
      setShowAddDept(false);
      setNewDept({ name: "", description: "" });
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Failed to create department", type: "error" });
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest("/hrms/employees", {
      method: "POST",
      body: JSON.stringify(newEmp),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: "Employee added successfully!", type: "success" });
      setShowAddEmp(false);
      setNewEmp({ firstName: "", lastName: "", email: "", jobTitle: "", departmentId: "", employmentType: "full_time", salary: 65000 });
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Failed to add employee", type: "error" });
    }
  };

  const handleClockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clockInEmpId) return;

    const res = await apiRequest("/hrms/attendance/clock-in", {
      method: "POST",
      body: JSON.stringify({ employeeId: clockInEmpId, notes: clockInNotes }),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: "Clocked in successfully!", type: "success" });
      setClockInNotes("");
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Clock-in failed", type: "error" });
    }
  };

  const handleClockOut = async (empId: string) => {
    const res = await apiRequest("/hrms/attendance/clock-out", {
      method: "POST",
      body: JSON.stringify({ employeeId: empId }),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: "Clocked out successfully!", type: "success" });
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Clock-out failed", type: "error" });
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await apiRequest("/hrms/leaves", {
      method: "POST",
      body: JSON.stringify(newLeave),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: "Leave request submitted!", type: "success" });
      setShowRequestLeave(false);
      setNewLeave({ employeeId: "", leaveType: "annual", startDate: currentDate, endDate: "", reason: "" });
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Failed to submit leave", type: "error" });
    }
  };

  const handleUpdateLeaveStatus = async (leaveId: string, status: "approved" | "rejected") => {
    const res = await apiRequest(`/hrms/leaves/${leaveId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }, selectedOrgId);

    if (res.success) {
      setActionMessage({ text: `Leave request ${status}!`, type: "success" });
      loadAllData();
    } else {
      setActionMessage({ text: res.error?.message || "Failed to update leave status", type: "error" });
    }
  };

  const isManagement = ["owner", "admin", "manager"].includes(userRole);

  return (
    <div className="relative min-h-screen w-full bg-[#f0f7ff] text-slate-900 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      {/* Background Cloudscape Wallpaper */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/sky_clouds_bg.jpg"
          alt="Serene Sky"
          fill
          priority
          className="object-cover object-top opacity-55 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-100/50 via-sky-50/40 to-white/80 pointer-events-none" />
      </div>

      {/* Orbit Rings */}
      <div className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[800px] h-[800px] rounded-full border border-white/60 opacity-60" />
        <div className="w-[1200px] h-[1200px] rounded-full border border-white/40 opacity-40" />
      </div>

      {/* Top Banner / Navigation */}
      <div className="relative z-10 glass-cloud-card border-b border-white/80 sticky top-0 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white px-3 py-1.5 rounded-full border border-slate-200/80 shadow-sm transition-all"
            >
              ← Dashboard
            </Link>
            <div className="h-4 w-px bg-slate-300" />
            <div className="flex items-center gap-2 font-bold text-base sm:text-lg text-slate-900">
              <span>👥</span>
              <span>HRMS Workforce Management</span>
            </div>
          </div>

          {/* Org Selector & Role Badge */}
          <div className="flex items-center gap-3">
            {organizations.length > 0 ? (
              <div className="flex items-center gap-2">
                <select
                  value={selectedOrgId}
                  onChange={(e) => {
                    setSelectedOrgId(e.target.value);
                    const org = organizations.find((o) => o.organizations.id === e.target.value);
                    if (org) setUserRole(org.role);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-300 shadow-sm"
                >
                  {organizations.map((org) => (
                    <option key={org.organizations.id} value={org.organizations.id}>
                      {org.organizations.name}
                    </option>
                  ))}
                </select>

                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-sm flex items-center gap-1">
                  <span>{userRole === "owner" ? "👑" : userRole === "admin" ? "🛡️" : userRole === "manager" ? "👥" : "💼"}</span>
                  <span>{userRole}</span>
                </span>
              </div>
            ) : (
              <Link
                href="/"
                className="text-xs px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 font-semibold"
              >
                Create an Organization on Dashboard
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Action Message Banner */}
        {actionMessage && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-medium flex justify-between items-center shadow-sm ${
              actionMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <span>{actionMessage.text}</span>
            <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-700">✕</button>
          </div>
        )}

        {/* KPI Metrics Grid in Cloud Theme */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold">Total Employees</div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">{stats?.totalEmployees ?? employees.length}</div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">● {stats?.activeEmployees ?? employees.length} Active</div>
          </div>
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold">Present Today</div>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{stats?.presentToday ?? attendance.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Clocked in today</div>
          </div>
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold">On Leave</div>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">{stats?.onLeaveToday ?? 0}</div>
            <div className="text-[11px] text-slate-500 mt-1">Approved absences</div>
          </div>
          <div className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-5">
            <div className="text-xs text-slate-500 font-semibold">Departments</div>
            <div className="text-2xl font-extrabold text-indigo-600 mt-1">{stats?.totalDepartments ?? departments.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Operational units</div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 space-x-2 sm:space-x-4 text-xs sm:text-sm font-semibold">
          {[
            { id: "employees", label: "Employees Directory", icon: "👥" },
            { id: "attendance", label: "Attendance Tracker", icon: "⏱️" },
            { id: "leaves", label: "Leave Requests", icon: "🏖️" },
            { id: "departments", label: "Departments", icon: "🏢" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 px-3 flex items-center gap-1.5 border-b-2 transition-all ${
                activeTab === tab.id
                  ? "border-slate-900 text-slate-900 font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ================================================================= */}
        {/* TAB 1: EMPLOYEES DIRECTORY */}
        {/* ================================================================= */}
        {activeTab === "employees" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Personnel Directory</h2>
                <p className="text-xs text-slate-500">View and manage organization staff.</p>
              </div>
              {isManagement && (
                <button
                  onClick={() => setShowAddEmp(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all"
                >
                  + Add Employee
                </button>
              )}
            </div>

            {/* Modal: Add Employee */}
            {showAddEmp && (
              <div className="p-6 rounded-2xl glass-cloud-card border border-indigo-200/80 shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Onboard New Team Member</h3>
                  <button onClick={() => setShowAddEmp(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.firstName}
                      onChange={(e) => setNewEmp({ ...newEmp, firstName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Jane"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.lastName}
                      onChange={(e) => setNewEmp({ ...newEmp, lastName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email *</label>
                    <input
                      type="email"
                      required
                      value={newEmp.email}
                      onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="jane.doe@company.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newEmp.jobTitle}
                      onChange={(e) => setNewEmp({ ...newEmp, jobTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      placeholder="Lead Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                    <select
                      value={newEmp.departmentId}
                      onChange={(e) => setNewEmp({ ...newEmp, departmentId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">No Department Assigned</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employment Type</label>
                    <select
                      value={newEmp.employmentType}
                      onChange={(e) => setNewEmp({ ...newEmp, employmentType: e.target.value as "full_time" })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddEmp(false)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs text-slate-700 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-xs text-white font-semibold shadow-md"
                    >
                      Save Employee
                    </button>
                  </div>
                </form>
              </div>
            )}

            {employees.length === 0 ? (
              <div className="p-8 rounded-2xl glass-cloud-card text-center text-xs text-slate-500">
                No employees registered yet. {isManagement ? 'Click "+ Add Employee" above to register your team.' : "Contact your organization owner or admin to onboard team members."}
              </div>
            ) : (
              <div className="glass-cloud-card rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200/80">
                    <tr>
                      <th className="py-3 px-4 font-bold">Employee</th>
                      <th className="py-3 px-4 font-bold">Job Title</th>
                      <th className="py-3 px-4 font-bold">Department</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{emp.first_name} {emp.last_name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{emp.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{emp.job_title}</td>
                        <td className="py-3 px-4 text-slate-600">{emp.departments?.name || "Unassigned"}</td>
                        <td className="py-3 px-4 uppercase text-[10px] text-indigo-700 font-bold">
                          {emp.employment_type.replace("_", " ")}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            emp.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ATTENDANCE TRACKER */}
        {/* ================================================================= */}
        {activeTab === "attendance" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Clock In Panel */}
              <div className="glass-cloud-card rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <span>⏱️</span> Daily Clock-In Action
                </h3>
                <form onSubmit={handleClockIn} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
                    <select
                      required
                      value={clockInEmpId}
                      onChange={(e) => setClockInEmpId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.job_title})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Notes (Optional)</label>
                    <input
                      type="text"
                      value={clockInNotes}
                      onChange={(e) => setClockInNotes(e.target.value)}
                      placeholder="Working on cloud features"
                      className="w-full px-3 py-2.5 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all"
                  >
                    Record Clock-In
                  </button>
                </form>
              </div>

              {/* Attendance Table */}
              <div className="md:col-span-2 glass-cloud-card rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Today&apos;s Attendance Records</h3>
                  <span className="text-xs text-slate-500 font-mono font-medium">{currentDate}</span>
                </div>

                {attendance.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No clock-in records yet today. Select an employee on the left to record attendance.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3 font-bold">Employee</th>
                          <th className="py-2.5 px-3 font-bold">Clock In</th>
                          <th className="py-2.5 px-3 font-bold">Clock Out</th>
                          <th className="py-2.5 px-3 font-bold">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {attendance.map((rec) => (
                          <tr key={rec.id}>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900">{rec.employees?.first_name} {rec.employees?.last_name}</span>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {new Date(rec.clock_in).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">
                              {rec.clock_out ? new Date(rec.clock_out).toLocaleTimeString() : <span className="text-amber-600 font-semibold">Active</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              {!rec.clock_out && (
                                <button
                                  onClick={() => handleClockOut(rec.employee_id)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold border border-rose-200 transition-colors"
                                >
                                  Clock Out
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: LEAVE REQUESTS */}
        {/* ================================================================= */}
        {activeTab === "leaves" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Leave Requests & Absences</h2>
                <p className="text-xs text-slate-500">Track and review employee vacation and sick leave applications.</p>
              </div>
              <button
                onClick={() => setShowRequestLeave(true)}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all"
              >
                + Request Leave
              </button>
            </div>

            {/* Modal: Request Leave */}
            {showRequestLeave && (
              <div className="p-6 rounded-2xl glass-cloud-card border border-indigo-200/80 shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Submit Leave Request</h3>
                  <button onClick={() => setShowRequestLeave(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleCreateLeave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Employee *</label>
                    <select
                      required
                      value={newLeave.employeeId}
                      onChange={(e) => setNewLeave({ ...newLeave, employeeId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="">-- Choose Employee --</option>
                      {employees.map((e) => (
                        <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                    <select
                      value={newLeave.leaveType}
                      onChange={(e) => setNewLeave({ ...newLeave, leaveType: e.target.value as "annual" })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="unpaid">Unpaid Leave</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      value={newLeave.startDate}
                      onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      value={newLeave.endDate}
                      onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reason *</label>
                    <textarea
                      required
                      rows={2}
                      value={newLeave.reason}
                      onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                      placeholder="Brief explanation for time-off..."
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRequestLeave(false)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs text-slate-700 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-xs text-white font-semibold shadow-md"
                    >
                      Submit Leave Application
                    </button>
                  </div>
                </form>
              </div>
            )}

            {leaves.length === 0 ? (
              <div className="p-8 rounded-2xl glass-cloud-card text-center text-xs text-slate-500">
                No leave requests filed yet.
              </div>
            ) : (
              <div className="glass-cloud-card rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4 font-bold">Employee</th>
                      <th className="py-3 px-4 font-bold">Type</th>
                      <th className="py-3 px-4 font-bold">Period</th>
                      <th className="py-3 px-4 font-bold">Reason</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      {isManagement && (
                        <th className="py-3 px-4 font-bold text-right">Review Access</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.map((leave) => (
                      <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {leave.employees?.first_name} {leave.employees?.last_name}
                        </td>
                        <td className="py-3 px-4 uppercase text-[10px] text-indigo-700 font-bold">
                          {leave.leave_type}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                          {leave.start_date} ➔ {leave.end_date}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{leave.reason}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            leave.status === "approved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : leave.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}>
                            {leave.status}
                          </span>
                        </td>
                        {isManagement && (
                          <td className="py-3 px-4 text-right">
                            {leave.status === "pending" && (
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleUpdateLeaveStatus(leave.id, "approved")}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold border border-emerald-200 transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleUpdateLeaveStatus(leave.id, "rejected")}
                                  className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: DEPARTMENTS */}
        {/* ================================================================= */}
        {activeTab === "departments" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Departments</h2>
                <p className="text-xs text-slate-500">Organize company workforce into functional teams.</p>
              </div>
              {isManagement && (
                <button
                  onClick={() => setShowAddDept(true)}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-[0.99] transition-all"
                >
                  + Add Department
                </button>
              )}
            </div>

            {/* Modal: Add Department */}
            {showAddDept && (
              <div className="p-6 rounded-2xl glass-cloud-card border border-indigo-200/80 shadow-lg space-y-4 max-w-lg">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-slate-900 text-sm">Create New Department</h3>
                  <button onClick={() => setShowAddDept(false)} className="text-slate-400 hover:text-slate-700">✕</button>
                </div>
                <form onSubmit={handleCreateDepartment} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                    <input
                      type="text"
                      required
                      value={newDept.name}
                      onChange={(e) => setNewDept({ ...newDept, name: e.target.value })}
                      placeholder="e.g. Engineering, Sales, Human Resources"
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={2}
                      value={newDept.description}
                      onChange={(e) => setNewDept({ ...newDept, description: e.target.value })}
                      placeholder="Core responsibilities and scope"
                      className="w-full px-3 py-2 rounded-xl bg-white/90 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDept(false)}
                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs text-slate-700 border border-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-xs text-white font-semibold shadow-md"
                    >
                      Save Department
                    </button>
                  </div>
                </form>
              </div>
            )}

            {departments.length === 0 ? (
              <div className="p-8 rounded-2xl glass-cloud-card text-center text-xs text-slate-500">
                No departments configured yet. {isManagement ? 'Click "+ Add Department" to create your first team.' : "Contact your organization manager to set up departments."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => (
                  <div key={dept.id} className="glass-cloud-card glass-cloud-card-hover rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold uppercase">
                        Dept
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 min-h-8">
                      {dept.description || "Operational unit within organization."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
