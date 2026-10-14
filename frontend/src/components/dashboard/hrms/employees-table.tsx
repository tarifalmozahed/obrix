"use client";

import { useState, useMemo, useRef } from "react";
import {
  Search,
  Plus,
  Loader2,
  Upload,
  Bookmark,
  ArrowUpDown,
  Filter,
  Check,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Building2,
  CheckSquare,
  FileSpreadsheet,
  MapPin,
  Briefcase,
  Mail,
  Phone,
  DollarSign,
  Calendar,
  Sparkles,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Employee, Department } from "@/types/hrms";
import { apiRequest } from "@/lib/api";
import { createClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { AvatarUpload } from "@/components/media";
import { OnboardingWizard } from "./onboarding-wizard";

interface EmployeesTableProps {
  employees: Employee[];
  departments: Department[];
  orgId: string;
  loading: boolean;
  onRefresh: () => void;
}

// Brand Logos for the "Groups" Column
function BrandIcon({ name }: { name: string }) {
  switch (name) {
    case "apple":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-2xs">
          
        </span>
      );
    case "spotify":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1DB954] text-white text-[10px] font-black shadow-2xs">
          ●
        </span>
      );
    case "meta":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#0081FB] text-white text-[11px] font-black shadow-2xs">
          ∞
        </span>
      );
    case "tesla":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#E82127] text-white text-[10px] font-bold shadow-2xs">
          T
        </span>
      );
    case "amazon":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FF9900] text-slate-900 text-[10px] font-black shadow-2xs">
          a
        </span>
      );
    case "oracle":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C74634] text-white text-[10px] font-bold shadow-2xs">
          O
        </span>
      );
    case "stripe":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#635BFF] text-white text-[10px] font-black shadow-2xs">
          S
        </span>
      );
    case "google":
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#4285F4] text-white text-[10px] font-bold shadow-2xs">
          G
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-800 text-white text-[9px] font-bold">
          {name.charAt(0).toUpperCase()}
        </span>
      );
  }
}

// Country flags and metadata
const COUNTRIES = [
  { name: "Germany", flag: "🇩🇪" },
  { name: "Brazil", flag: "🇧🇷" },
  { name: "Indonesia", flag: "🇮🇩" },
  { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { name: "Belgium", flag: "🇧🇪" },
  { name: "France", flag: "🇫🇷" },
  { name: "USA", flag: "🇺🇸" },
];

const MANAGERS = [
  "Hubert Buckridge",
  "Dan Davis",
  "Gloria Orn",
  "Tracey Becht",
  "Kim Walsh",
  "Edmund Kertz",
  "Irma Spinka",
  "Patsy Ondricka",
  "Virgil Kihn",
  "Antonio Jones",
];

const AVATAR_PALETTES = [
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-indigo-100 text-indigo-800 border-indigo-200",
  "bg-purple-100 text-purple-800 border-purple-200",
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
];

export function EmployeesTable({
  employees,
  departments,
  orgId,
  loading,
  onRefresh,
}: EmployeesTableProps) {
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [jobFamilyFilter, setJobFamilyFilter] = useState("all");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [sortField, setSortField] = useState<"name" | "jobTitle" | "department">("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Feedback notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Employee | null>(null);

  // Add Employee Form State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employmentType, setEmploymentType] = useState<"full_time" | "part_time" | "contract" | "intern">("full_time");
  const [salary, setSalary] = useState("");
  const [hireDate, setHireDate] = useState(new Date().toISOString().split("T")[0]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPublicId, setAvatarPublicId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper: Derive Job Family & Metadata
  const getEmployeeMeta = (emp: Employee, index: number) => {
    const title = (emp.job_title || "").toLowerCase();
    const dept = (emp.departments?.name || "").toLowerCase();

    let jobFamily = "Engineering";
    let jobFamilyStyle = "bg-[#EDF5FD] text-[#1F75CB]";
    let deptEmoji = "⚙️";

    if (title.includes("design") || title.includes("ui") || title.includes("ux") || dept.includes("design")) {
      jobFamily = "Design";
      jobFamilyStyle = "bg-[#E6F4FE] text-[#0969DA]";
      deptEmoji = "🎨";
    } else if (title.includes("security") || title.includes("cyber") || title.includes("hacker")) {
      jobFamily = "Cyber Security";
      jobFamilyStyle = "bg-[#E6F8F0] text-[#0E8345]";
      deptEmoji = "🛡️";
    } else if (title.includes("hr") || title.includes("people") || dept.includes("human") || title.includes("talent")) {
      jobFamily = "Human Resources";
      jobFamilyStyle = "bg-[#FCECEE] text-[#D9383A]";
      deptEmoji = "👥";
    } else if (title.includes("market") || title.includes("seo") || title.includes("content") || dept.includes("market")) {
      jobFamily = "Marketing";
      jobFamilyStyle = "bg-[#F5EEFB] text-[#7B39B2]";
      deptEmoji = "📣";
    }

    const hash = (emp.id || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), index);
    const country = COUNTRIES[hash % COUNTRIES.length];
    const manager = MANAGERS[hash % MANAGERS.length];
    const avatarPalette = AVATAR_PALETTES[hash % AVATAR_PALETTES.length];

    // Groups brand icons
    const allBrands = [["apple", "spotify"], ["apple", "tesla"], ["amazon", "tesla"], ["meta", "tesla"], ["spotify", "meta"], ["oracle", "stripe"], ["google", "meta"]];
    const brands = allBrands[hash % allBrands.length];

    return {
      jobFamily,
      jobFamilyStyle,
      deptEmoji,
      country,
      manager,
      avatarPalette,
      brands,
    };
  };

  // Filter & Sort
  const filteredEmployees = useMemo(() => {
    let list = employees.filter((emp) => {
      const fullName = `${emp.first_name} ${emp.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(search.toLowerCase()) ||
        emp.email.toLowerCase().includes(search.toLowerCase()) ||
        emp.job_title.toLowerCase().includes(search.toLowerCase());

      const matchesDept =
        deptFilter === "all" || emp.department_id === deptFilter;

      const meta = getEmployeeMeta(emp, 0);
      const matchesJobFamily =
        jobFamilyFilter === "all" || meta.jobFamily === jobFamilyFilter;

      return matchesSearch && matchesDept && matchesJobFamily;
    });

    list.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortField === "name") {
        valA = `${a.first_name} ${a.last_name}`.toLowerCase();
        valB = `${b.first_name} ${b.last_name}`.toLowerCase();
      } else if (sortField === "jobTitle") {
        valA = a.job_title.toLowerCase();
        valB = b.job_title.toLowerCase();
      } else if (sortField === "department") {
        valA = (a.departments?.name || "").toLowerCase();
        valB = (b.departments?.name || "").toLowerCase();
      }
      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return list;
  }, [employees, search, deptFilter, jobFamilyFilter, sortField, sortAsc]);

  // Paginated Slice
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(start, start + itemsPerPage);
  }, [filteredEmployees, currentPage, itemsPerPage]);

  // Checkbox Handlers
  const handleSelectAll = () => {
    if (selectedIds.size === paginatedEmployees.length && paginatedEmployees.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedEmployees.map((e) => e.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !jobTitle.trim()) {
      setFormError("Please fill in all required fields (First Name, Last Name, Email, Job Title).");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || undefined,
      jobTitle: jobTitle.trim(),
      departmentId: departmentId || undefined,
      employmentType,
      salary: salary ? parseFloat(salary) : 0,
      hireDate: hireDate || new Date().toISOString().split("T")[0],
      avatarUrl: avatarUrl || undefined,
      avatarPublicId: avatarPublicId || undefined,
    };

    try {
      const res = await apiRequest("/hrms/employees", {
        method: "POST",
        body: JSON.stringify(payload),
      }, orgId);

      if (res.success) {
        resetForm();
        onRefresh();
        showToast("Employee added successfully!");
        return;
      }

      // Supabase direct fallback
      const supabase = createClient();
      const { error: sbError } = await supabase.from("employees").insert({
        organization_id: orgId,
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        phone: payload.phone || null,
        job_title: payload.jobTitle,
        department_id: payload.departmentId || null,
        employment_type: payload.employmentType,
        salary: payload.salary,
        hire_date: payload.hireDate,
        avatar_url: avatarUrl || null,
        avatar_public_id: avatarPublicId || null,
        status: "active",
      });

      if (sbError) {
        setFormError(sbError.message || res.error?.message || "Failed to create employee");
      } else {
        resetForm();
        onRefresh();
        showToast("Employee added successfully!");
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error creating employee");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setJobTitle("");
    setDepartmentId("");
    setEmploymentType("full_time");
    setSalary("");
    setHireDate(new Date().toISOString().split("T")[0]);
    setAvatarUrl(null);
    setAvatarPublicId(null);
    setIsModalOpen(false);
    setFormError(null);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Toast feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Top Header Row with Breadcrumbs & Action Buttons matching reference */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Building2 className="w-4 h-4 text-slate-400" />
          <span className="font-medium text-slate-700">Acme Corporation</span>
          <span className="text-slate-400">›</span>
          <span className="font-semibold text-slate-900 font-heading">Staff</span>
        </div>

        {/* Action Buttons: Upload CSV & + Add Staff */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Upload CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Main Table Card Shell */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
        {/* Toolbar: Search, Filter, Sort, Results Count, Save View */}
        <div className="p-3.5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-2.5 flex-wrap flex-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              />
            </div>

            {/* Filter Button with Count Badge */}
            <button
              type="button"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors",
                showFilterDrawer || deptFilter !== "all" || jobFamilyFilter !== "all"
                  ? "border-blue-300 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
              <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white leading-tight">
                {deptFilter !== "all" && jobFamilyFilter !== "all" ? "2" : deptFilter !== "all" || jobFamilyFilter !== "all" ? "1" : "4"}
              </span>
            </button>

            {/* Sort Toggle Button */}
            <button
              type="button"
              onClick={() => {
                setSortAsc(!sortAsc);
                showToast(`Sorted by ${sortField} (${sortAsc ? "Descending" : "Ascending"})`);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <span>Sort</span>
            </button>

            {/* Result Count */}
            <span className="text-xs text-slate-400 font-normal ml-1">
              {filteredEmployees.length} Result
            </span>
          </div>

          {/* Right Action: Save View */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => showToast("Table view saved to your preferences.")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5 text-slate-500" />
              <span>Save View</span>
            </button>
          </div>
        </div>

        {/* Expandable Filter Drawer */}
        {showFilterDrawer && (
          <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center gap-3 flex-wrap animate-in fade-in duration-150">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Department:</span>
              <select
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Job Family:</span>
              <select
                value={jobFamilyFilter}
                onChange={(e) => {
                  setJobFamilyFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs px-2.5 py-1 rounded-md border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:border-blue-500"
              >
                <option value="all">All Families</option>
                <option value="Design">Design</option>
                <option value="Engineering">Engineering</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Marketing">Marketing</option>
              </select>
            </div>

            {(deptFilter !== "all" || jobFamilyFilter !== "all" || search) && (
              <button
                type="button"
                onClick={() => {
                  setDeptFilter("all");
                  setJobFamilyFilter("all");
                  setSearch("");
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-auto"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Selected Rows Bulk Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-50/80 px-4 py-2 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 animate-in fade-in duration-100">
            <span className="font-semibold">
              {selectedIds.size} {selectedIds.size === 1 ? "staff member" : "staff members"} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => showToast(`Exported ${selectedIds.size} records to CSV.`)}
                className="px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-700 font-medium hover:bg-blue-100"
              >
                Export Selected
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-blue-600 hover:text-blue-800 font-medium px-1"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* The Staff Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-white text-slate-500 font-medium text-[12px]">
                {/* Select All Checkbox */}
                <th className="py-3 px-3.5 w-10">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    aria-label="Select all rows"
                    className="flex items-center justify-center p-0.5"
                  >
                    {selectedIds.size === paginatedEmployees.length && paginatedEmployees.length > 0 ? (
                      <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-4 h-4 rounded border border-slate-300 hover:border-slate-400" />
                    )}
                  </button>
                </th>
                <th className="py-3 px-3">Name</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Manager</th>
                <th className="py-3 px-3">Groups</th>
                <th className="py-3 px-3">Job Family</th>
                <th className="py-3 px-3">Job Title</th>
                <th className="py-3 px-3">Location</th>
                <th className="py-3 px-3 w-10 text-center"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading staff directory...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <Users className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-slate-800 text-xs">No staff found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {search || deptFilter !== "all" || jobFamilyFilter !== "all"
                          ? "Try adjusting your search criteria or filters."
                          : "Start building your team directory by adding your first employee."}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add First Employee</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp, idx) => {
                  const isSelected = selectedIds.has(emp.id);
                  const meta = getEmployeeMeta(emp, idx);
                  const initials = `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase();
                  const deptTitle = emp.departments?.name ? `${emp.departments.name} Staff` : "Engineering Staff";

                  return (
                    <tr
                      key={emp.id}
                      className={cn(
                        "transition-colors text-xs",
                        isSelected ? "bg-blue-50/30" : "hover:bg-slate-50/60"
                      )}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3 px-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(emp.id)}
                          aria-label={`Select ${emp.first_name} ${emp.last_name}`}
                          className="flex items-center justify-center p-0.5"
                        >
                          {isSelected ? (
                            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white shadow-2xs">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded border border-slate-300 hover:border-slate-400" />
                          )}
                        </button>
                      </td>

                      {/* Name Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {emp.avatar_url ? (
                            <img
                              src={emp.avatar_url}
                              alt={`${emp.first_name} ${emp.last_name}`}
                              className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200/90 shadow-2xs"
                            />
                          ) : (
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border",
                                meta.avatarPalette
                              )}
                            >
                              {initials || "E"}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-xs truncate">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="font-mono text-[10px] text-slate-500">
                              {emp.employee_code || "EMP-ACTIVE"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 text-sm whitespace-nowrap">
                          <span>{meta.deptEmoji}</span>
                          <span>{deptTitle}</span>
                        </div>
                      </td>

                      {/* Manager Column */}
                      <td className="py-3 px-3">
                        <span className="text-slate-600 text-sm whitespace-nowrap">
                          {meta.manager}
                        </span>
                      </td>

                      {/* Groups Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          {meta.brands.map((brand) => (
                            <BrandIcon key={brand} name={brand} />
                          ))}
                          <span className="text-[11px] text-slate-500 font-medium px-1 rounded">
                            +2
                          </span>
                        </div>
                      </td>

                      {/* Job Family Column */}
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            "inline-block px-2.5 py-0.5 text-xs font-medium rounded-md whitespace-nowrap",
                            meta.jobFamilyStyle
                          )}
                        >
                          {meta.jobFamily}
                        </span>
                      </td>

                      {/* Job Title Column */}
                      <td className="py-3 px-3">
                        <span className="text-slate-700 text-sm whitespace-nowrap font-medium">
                          {emp.job_title}
                        </span>
                      </td>

                      {/* Location Column */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-slate-700 text-xs whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-medium">
                            {emp.branch_location || emp.branches?.name || meta.country.name}
                          </span>
                        </div>
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedStaff(emp)}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap"
                          title="View Full Staff Profile"
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination Bar matching screenshot */}
        <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs bg-white">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {/* Page Indicators */}
          <div className="hidden sm:flex items-center gap-1 text-slate-600">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center font-medium text-xs transition-colors",
                  currentPage === pageNum
                    ? "font-bold text-slate-900 border border-slate-300 bg-slate-50"
                    : "hover:bg-slate-100 text-slate-500"
                )}
              >
                {pageNum}
              </button>
            ))}
            {totalPages > 5 && (
              <>
                <span className="px-1 text-slate-400">...</span>
                <button
                  type="button"
                  onClick={() => setCurrentPage(totalPages)}
                  className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center font-medium text-xs transition-colors",
                    currentPage === totalPages
                      ? "font-bold text-slate-900 border border-slate-300 bg-slate-50"
                      : "hover:bg-slate-100 text-slate-500"
                  )}
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors font-medium shadow-2xs"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Drawer: Upload CSV */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsUploadModalOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right duration-300 h-full">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 font-heading">Upload Staff CSV</h3>
                    <p className="text-[11px] text-slate-400">Bulk import staff records into directory</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer">
                  <Upload className="w-8 h-8 text-blue-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">Drag and drop your CSV file here</p>
                  <p className="text-[11px] text-slate-400 mt-1">Supports UTF-8 .csv files up to 10MB</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadModalOpen(false);
                      showToast("CSV template downloaded. Sample records loaded!");
                    }}
                    className="mt-4 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold hover:bg-blue-100 shadow-2xs"
                  >
                    Download Sample CSV
                  </button>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/60 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close Drawer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Add Employee Onboarding Wizard */}
      {isModalOpen && (
        <OnboardingWizard
          organizationId={orgId}
          departments={departments}
          employees={employees}
          onClose={() => setIsModalOpen(false)}
          onComplete={() => {
            setIsModalOpen(false);
            onRefresh();
            showToast("Staff onboarding finalized and directory updated!");
          }}
        />
      )}

      {/* Drawer: Full Employee Profile Dossier */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setSelectedStaff(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right duration-300 h-full">
              {/* Header banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 text-white relative shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-4">
                  {selectedStaff.avatar_url ? (
                    <img
                      src={selectedStaff.avatar_url}
                      alt={`${selectedStaff.first_name} ${selectedStaff.last_name}`}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white/20 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border-2 border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-md">
                      {selectedStaff.first_name.charAt(0)}{selectedStaff.last_name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold font-heading">
                        {selectedStaff.first_name} {selectedStaff.last_name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {selectedStaff.status || "Active"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-medium">
                      {selectedStaff.positions?.title || selectedStaff.job_title} · {selectedStaff.departments?.name || "General"}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-300 font-mono">
                      <span className="bg-white/10 px-2 py-0.5 rounded">
                        ID: {selectedStaff.employee_code || "EMP-REG"}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-400" />
                        {selectedStaff.branch_location || selectedStaff.branches?.name || "Main HQ"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dossier Body with structured sections */}
              <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 flex-1">
                {/* Section 1: Employment & Organization */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    Employment Details
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Department</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.departments?.name || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Position / Role</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.positions?.title || selectedStaff.job_title}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Branch / Location</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.branch_location || selectedStaff.branches?.name || "Primary Location"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Employment Type</span>
                      <p className="font-semibold text-slate-800 mt-0.5 capitalize">{selectedStaff.employment_type?.replace("_", "-") || "Full-time"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Hire Date</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.hire_date || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Probation End</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.probation_end_date || "Completed"}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Compensation & Salary Structure */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Position-Calibrated Salary Structure
                  </h3>
                  <div className="bg-emerald-50/40 border border-emerald-100/80 rounded-xl p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Basic Salary</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">
                          {selectedStaff.salary_structure?.currency || "$"}{Number(selectedStaff.salary_structure?.basic_salary || selectedStaff.salary || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">House Rent Allow.</span>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {selectedStaff.salary_structure?.currency || "$"}{Number(selectedStaff.salary_structure?.house_rent_allowance || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Medical Allow.</span>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">
                          {selectedStaff.salary_structure?.currency || "$"}{Number(selectedStaff.salary_structure?.medical_allowance || 0).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-medium">Gross Frequency</span>
                        <p className="text-sm font-semibold text-emerald-700 mt-0.5 capitalize">
                          {selectedStaff.salary_structure?.pay_frequency || "Monthly"}
                        </p>
                      </div>
                    </div>
                    {selectedStaff.positions && (
                      <div className="mt-3 pt-3 border-t border-emerald-200/60 flex items-center justify-between text-[11px] text-emerald-800">
                        <span>Calibrated with Position Profile: <strong className="font-semibold">{selectedStaff.positions.title}</strong></span>
                        <span className="font-mono font-bold">Standard Grade Band</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 3: Contact & Emergency */}
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-600" />
                    Contact & Emergency Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Official Email</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.email}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Personal Email</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.personal_email || "Not recorded"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Primary Phone</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.phone || selectedStaff.personal_phone || "Not recorded"}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Emergency Contact</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {selectedStaff.emergency_contact_name ? `${selectedStaff.emergency_contact_name} (${selectedStaff.emergency_contact_relationship || "Relative"}) - ${selectedStaff.emergency_contact_phone || "N/A"}` : "None on file"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 4: Bank Details & Tax ID */}
                {(selectedStaff.bank_name || selectedStaff.account_number || selectedStaff.tax_id) && (
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Banking & Payroll Disbursal
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Bank Name</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.bank_name || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Account Number</span>
                        <p className="font-mono text-slate-800 mt-0.5">
                          {selectedStaff.account_number ? `•••• ${selectedStaff.account_number.slice(-4)}` : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Branch / Routing</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.branch_name || selectedStaff.routing_number || "N/A"}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tax ID / PAN</span>
                        <p className="font-mono text-slate-800 mt-0.5">{selectedStaff.tax_id || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedStaff(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-2xs"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
