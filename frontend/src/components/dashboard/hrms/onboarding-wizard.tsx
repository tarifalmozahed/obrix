"use client";

import { useState, useEffect } from "react";
import {
  User,
  Briefcase,
  DollarSign,
  FileText,
  CheckSquare,
  ClipboardCheck,
  UserCheck,
  ArrowRight,
  ArrowLeft,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  Lock,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Department, Employee, Branch, Position } from "@/types/hrms";
import {
  EmployeeOnboarding,
  PersonalInfo,
  EmploymentInfo,
  CompensationInfo,
  EquipmentInfo,
  OnboardingTask,
  DEFAULT_ONBOARDING_TASKS,
} from "@/types/onboarding";
import { AvatarUpload, DocumentUpload } from "@/components/media";
import {
  createOnboardingRecord,
  updateOnboardingRecord,
  updateOnboardingTask,
  activateOnboardingEmployee,
} from "@/lib/onboarding";
import {
  fetchBranches,
  createBranch,
  fetchPositions,
  createPosition,
} from "@/lib/hrms";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  organizationId: string;
  departments: Department[];
  employees: Employee[];
  initialData?: EmployeeOnboarding | null;
  onClose: () => void;
  onComplete: () => void;
}

const WIZARD_STEPS = [
  { step: 1, title: "Personal Info", desc: "Identity & contacts", icon: User },
  { step: 2, title: "Employment", desc: "Role & department", icon: Briefcase },
  { step: 3, title: "Compensation", desc: "Salary & banking", icon: DollarSign },
  { step: 4, title: "Documents", desc: "Uploads & verifications", icon: FileText },
  { step: 5, title: "Checklist", desc: "Pre & post joining tasks", icon: CheckSquare },
  { step: 6, title: "Review & Approval", desc: "Validate workflow", icon: ClipboardCheck },
  { step: 7, title: "Activation", desc: "Live employee launch", icon: UserCheck },
];

export function OnboardingWizard({
  organizationId,
  departments,
  employees,
  initialData,
  onClose,
  onComplete,
}: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState(initialData?.currentStep || 1);
  const [onboardingId, setOnboardingId] = useState<string | null>(initialData?.id || null);
  const [saving, setSaving] = useState(false);
  const [activating, setActivating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Section 1: Personal Information
  const [personal, setPersonal] = useState<PersonalInfo>(
    initialData?.personalInfo || {
      firstName: "",
      middleName: "",
      lastName: "",
      preferredName: "",
      dateOfBirth: "",
      gender: "prefer_not_to_say",
      personalEmail: "",
      personalPhone: "",
      alternatePhone: "",
      presentAddress: "",
      permanentAddress: "",
      sameAsPresent: false,
      emergencyContactName: "",
      emergencyContactRelationship: "Spouse",
      emergencyContactPhone: "",
      profilePhotoUrl: null,
      profilePhotoPublicId: null,
    }
  );

  // Section 2: Employment Information
  const defaultCode = `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [employment, setEmployment] = useState<EmploymentInfo>(
    initialData?.employmentInfo || {
      employeeCode: defaultCode,
      branchId: null,
      branchLocation: "",
      departmentId: departments[0]?.id || "",
      departmentName: departments[0]?.name || "",
      positionId: null,
      designation: "",
      reportingManagerId: employees[0]?.id || "",
      reportingManagerName: employees[0] ? `${employees[0].first_name} ${employees[0].last_name}` : "",
      assignedHrOfficerId: "",
      assignedHrOfficerName: "HR Operations Lead",
      employmentType: "Permanent",
      joiningDate: new Date().toISOString().split("T")[0],
      probationDurationMonths: 3,
      probationEndDate: "",
      workEmail: "",
      workPhone: "",
      workLocation: "Hybrid",
      shift: "General Day (9:00 AM - 6:00 PM)",
      costCenter: "CC-HRMS-01",
    }
  );

  // Dynamic Branches & Positions
  const [branches, setBranches] = useState<Branch[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Quick Add Branch Modal state
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchCity, setNewBranchCity] = useState("");
  const [addingBranch, setAddingBranch] = useState(false);

  // Quick Add Position Modal state
  const [showAddPosition, setShowAddPosition] = useState(false);
  const [newPositionTitle, setNewPositionTitle] = useState("");
  const [newPositionBasic, setNewPositionBasic] = useState("70000");
  const [newPositionHra, setNewPositionHra] = useState("15000");
  const [newPositionMed, setNewPositionMed] = useState("4000");
  const [newPositionTrans, setNewPositionTrans] = useState("2500");
  const [addingPosition, setAddingPosition] = useState(false);

  // Load dynamic branches and positions
  useEffect(() => {
    async function loadMeta() {
      if (!organizationId) return;
      setLoadingMetadata(true);
      try {
        const [bRes, pRes] = await Promise.all([
          fetchBranches(organizationId),
          fetchPositions(organizationId),
        ]);
        if (bRes.success && bRes.data && bRes.data.length > 0) {
          const branchList = bRes.data;
          setBranches(branchList);
          const firstBranch = branchList[0];
          setEmployment((prev) => ({
            ...prev,
            branchId: prev.branchId || firstBranch.id,
            branchLocation: prev.branchLocation || firstBranch.name,
          }));
        }
        if (pRes.success && pRes.data && pRes.data.length > 0) {
          setPositions(pRes.data);
        }
      } catch (err) {
        console.warn("Notice: metadata load error:", err);
      } finally {
        setLoadingMetadata(false);
      }
    }
    loadMeta();
  }, [organizationId]);

  // Position Selection & Position-wise Salary Structure Auto-Configuration
  const handleSelectPosition = (posId: string) => {
    const pos = positions.find((p) => p.id === posId);
    if (!pos) {
      setEmployment((prev) => ({ ...prev, positionId: null, designation: "" }));
      return;
    }

    setEmployment((prev) => ({
      ...prev,
      positionId: pos.id,
      designation: pos.title,
      departmentId: pos.department_id || prev.departmentId,
    }));

    // Auto-populate Section 3 Compensation & Payroll from the position's salary structure!
    const validFrequency: "Monthly" | "Bi-weekly" | "Weekly" =
      pos.pay_frequency === "Bi-weekly" || pos.pay_frequency === "Weekly"
        ? pos.pay_frequency
        : "Monthly";

    setCompensation((prev) => ({
      ...prev,
      salaryStructure: `${pos.title} Structure`,
      basicSalary: Number(pos.basic_salary) || 0,
      houseRentAllowance: Number(pos.house_rent_allowance) || 0,
      medicalAllowance: Number(pos.medical_allowance) || 0,
      transportAllowance: Number(pos.transport_allowance) || 0,
      currency: pos.currency || "USD",
      payFrequency: validFrequency,
    }));

    setFeedback({
      type: "success",
      message: `Position-wise salary structure auto-applied for ${pos.title}`,
    });
  };

  const handleCreateBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;
    setAddingBranch(true);
    try {
      const res = await createBranch(organizationId, {
        name: newBranchName.trim(),
        city: newBranchCity.trim() || undefined,
      });
      if (res.success && res.data) {
        const createdBranch = res.data;
        setBranches((prev) => [...prev, createdBranch]);
        setEmployment((prev) => ({
          ...prev,
          branchId: createdBranch.id,
          branchLocation: createdBranch.name,
        }));
        setNewBranchName("");
        setNewBranchCity("");
        setShowAddBranch(false);
        setFeedback({ type: "success", message: `Branch "${createdBranch.name}" added successfully!` });
      }
    } catch (err) {
      console.warn("Error creating branch:", err);
    } finally {
      setAddingBranch(false);
    }
  };

  const handleCreatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPositionTitle.trim()) return;
    setAddingPosition(true);
    try {
      const basic = parseFloat(newPositionBasic) || 0;
      const hra = parseFloat(newPositionHra) || 0;
      const med = parseFloat(newPositionMed) || 0;
      const trans = parseFloat(newPositionTrans) || 0;

      const res = await createPosition(organizationId, {
        title: newPositionTitle.trim(),
        department_id: employment.departmentId || undefined,
        basic_salary: basic,
        house_rent_allowance: hra,
        medical_allowance: med,
        transport_allowance: trans,
        currency: "USD",
        pay_frequency: "Monthly",
      });

      if (res.success && res.data) {
        const createdPos = res.data;
        setPositions((prev) => [...prev, createdPos]);
        handleSelectPosition(createdPos.id);
        setNewPositionTitle("");
        setShowAddPosition(false);
      }
    } catch (err) {
      console.warn("Error creating position:", err);
    } finally {
      setAddingPosition(false);
    }
  };

  // Section 3: Compensation & Payroll
  const [compensation, setCompensation] = useState<CompensationInfo>(
    initialData?.compensationInfo || {
      salaryStructure: "Standard Full-Time",
      basicSalary: 85000,
      houseRentAllowance: 15000,
      medicalAllowance: 5000,
      transportAllowance: 3000,
      otherAllowances: 2000,
      effectiveDate: new Date().toISOString().split("T")[0],
      payFrequency: "Monthly",
      currency: "USD",
      bankName: "JPMorgan Chase",
      accountHolderName: "",
      bankAccountNumber: "•••••••• 4829",
    }
  );

  // Section 5: Tasks list
  const [tasks, setTasks] = useState<OnboardingTask[]>(
    initialData?.tasks || (DEFAULT_ONBOARDING_TASKS as OnboardingTask[])
  );

  // Section 7: Equipment
  const [equipment, setEquipment] = useState<EquipmentInfo>(
    initialData?.equipmentInfo || {
      assetType: "Laptop",
      assetName: "MacBook Pro 16-inch M3 Pro",
      assetSerialNumber: "C02XYZ890123",
      issuedDate: new Date().toISOString().split("T")[0],
      issuedBy: "IT Hardware Admin",
      expectedReturnDate: null,
      handoverAcknowledged: true,
      companyEmailProvisioned: true,
      requiredAccess: ["Slack", "GitHub", "Jira", "AWS Cloud", "ERP"],
      provisionedBy: "IT Lead",
      provisioningDate: new Date().toISOString().split("T")[0],
      notes: "Standard engineering workstation package issued.",
    }
  );

  // Auto-calculate probation end date when joining date or duration changes
  useEffect(() => {
    if (employment.joiningDate && employment.probationDurationMonths) {
      const joinDate = new Date(employment.joiningDate);
      if (!isNaN(joinDate.getTime())) {
        joinDate.setMonth(joinDate.getMonth() + Number(employment.probationDurationMonths));
        const calculatedEnd = joinDate.toISOString().split("T")[0];
        setEmployment((prev) => ({ ...prev, probationEndDate: calculatedEnd }));
      }
    }
  }, [employment.joiningDate, employment.probationDurationMonths]);

  // Sync present address to permanent address if checkbox checked
  const handleSameAddress = (checked: boolean) => {
    setPersonal((prev) => ({
      ...prev,
      sameAsPresent: checked,
      permanentAddress: checked ? prev.presentAddress : prev.permanentAddress,
    }));
  };

  // Save progress / draft to backend
  const saveDraft = async (targetStep = currentStep): Promise<boolean> => {
    setSaving(true);
    setFeedback(null);

    const progressPercent = Math.min(100, Math.round((targetStep / WIZARD_STEPS.length) * 100));

    const payload = {
      currentStep: targetStep,
      progress: progressPercent,
      personalInfo: personal,
      employmentInfo: employment,
      compensationInfo: compensation,
      equipmentInfo: equipment,
      status: targetStep === 7 ? "approved" : "draft",
    };

    try {
      if (onboardingId) {
        const res = await updateOnboardingRecord(onboardingId, payload as any, organizationId);
        if (res.success) {
          setFeedback({ type: "success", message: "Onboarding draft saved!" });
          return true;
        }
      } else {
        const res = await createOnboardingRecord(payload as any, organizationId);
        if (res.success && res.data) {
          setOnboardingId(res.data.id);
          setFeedback({ type: "success", message: "Onboarding record initialized!" });
          return true;
        }
      }
      return false;
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to save draft." });
      return false;
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleNextStep = async () => {
    // Basic validation
    if (currentStep === 1) {
      if (!personal.firstName.trim() || !personal.lastName.trim() || !personal.personalEmail.trim() || !personal.personalPhone.trim()) {
        setFeedback({ type: "error", message: "Please fill in all required personal information fields." });
        return;
      }
    }

    if (currentStep === 2) {
      if (!employment.employeeCode || !employment.designation || !employment.joiningDate) {
        setFeedback({ type: "error", message: "Please provide employee code, designation, and joining date." });
        return;
      }
    }

    const nextStep = Math.min(WIZARD_STEPS.length, currentStep + 1);
    await saveDraft(nextStep);
    setCurrentStep(nextStep);
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Toggle checklist item status
  const handleToggleTask = async (taskIdx: number) => {
    const target = tasks[taskIdx];
    const newStatus = target.status === "completed" ? "pending" : "completed";
    const updated = [...tasks];
    updated[taskIdx] = {
      ...target,
      status: newStatus,
      completedAt: newStatus === "completed" ? new Date().toISOString() : null,
    };
    setTasks(updated);

    if (onboardingId && target.id) {
      await updateOnboardingTask(onboardingId, target.id, { status: newStatus }, organizationId);
    }
  };

  // Final Activation Handler (Section 8)
  const handleFinalActivation = async () => {
    if (!onboardingId) {
      await saveDraft(7);
    }
    if (!onboardingId) return;

    setActivating(true);
    try {
      const res = await activateOnboardingEmployee(onboardingId, organizationId);
      if (res.success) {
        setFeedback({ type: "success", message: "Employee launched and activated successfully!" });
        setTimeout(() => {
          onComplete();
        }, 1500);
      } else {
        setFeedback({ type: "error", message: res.error?.message || "Failed to activate employee." });
      }
    } catch {
      setFeedback({ type: "error", message: "Activation failed." });
    } finally {
      setActivating(false);
    }
  };

  const completedTasksCount = tasks.filter((t) => t.status === "completed").length;
  const progressPercent = Math.round((completedTasksCount / tasks.length) * 100);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-4xl bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 animate-in slide-in-from-right duration-300 h-full">
        
        {/* Top Header: Title, Progress Bar, & Actions */}
        <div className="p-4 sm:px-6 border-b border-slate-100 flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-heading">
                  Employee Onboarding Wizard
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Step {currentStep} of {WIZARD_STEPS.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Data Collection, Document Verification & Activation Pipeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => saveDraft(currentStep)}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Save className="w-3.5 h-3.5 text-slate-500" />}
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="border-b border-slate-100 bg-slate-50/60 px-4 sm:px-6 py-2 overflow-x-auto">
          <div className="flex items-center gap-1 min-w-max">
            {WIZARD_STEPS.map((s) => {
              const Icon = s.icon;
              const isCurrent = s.step === currentStep;
              const isPassed = s.step < currentStep;

              return (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setCurrentStep(s.step)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                    isCurrent
                      ? "bg-white text-blue-700 font-semibold shadow-2xs border border-slate-200"
                      : isPassed
                      ? "text-slate-700 hover:bg-white/60"
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      isCurrent
                        ? "bg-blue-600 text-white"
                        : isPassed
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    )}
                  >
                    {isPassed ? "✓" : s.step}
                  </div>
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alert Feedback Banner */}
        {feedback && (
          <div
            className={cn(
              "px-6 py-2 text-xs flex items-center gap-2 border-b animate-in fade-in duration-100",
              feedback.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            )}
          >
            {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
            <span className="font-medium">{feedback.message}</span>
          </div>
        )}

        {/* Wizard Step Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* ========================================================
              STEP 1: PERSONAL INFORMATION
             ======================================================== */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-4 border-b border-slate-100">
                <AvatarUpload
                  currentUrl={personal.profilePhotoUrl}
                  currentPublicId={personal.profilePhotoPublicId}
                  name={`${personal.firstName || "New"} ${personal.lastName || "Hire"}`}
                  organizationId={organizationId}
                  folder="hrms/employees"
                  relatedType="employee"
                  size={84}
                  onUploadSuccess={(url, publicId) => {
                    setPersonal((prev) => ({ ...prev, profilePhotoUrl: url, profilePhotoPublicId: publicId }));
                  }}
                  onRemove={() => {
                    setPersonal((prev) => ({ ...prev, profilePhotoUrl: null, profilePhotoPublicId: null }));
                  }}
                />
                <div className="text-center sm:text-left">
                  <h3 className="text-sm font-bold text-slate-900 font-heading">
                    Candidate Profile Photo
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Streamed to Cloudinary <span className="font-mono text-slate-700 font-semibold">hrms/employees</span> with automated quality and face-crop.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personal.firstName}
                    onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                    placeholder="e.g. Alex"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Middle Name
                  </label>
                  <input
                    type="text"
                    value={personal.middleName || ""}
                    onChange={(e) => setPersonal({ ...personal, middleName: e.target.value })}
                    placeholder="e.g. Marie"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={personal.lastName}
                    onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                    placeholder="e.g. Rivera"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Preferred Name
                  </label>
                  <input
                    type="text"
                    value={personal.preferredName || ""}
                    onChange={(e) => setPersonal({ ...personal, preferredName: e.target.value })}
                    placeholder="e.g. Lex"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={personal.dateOfBirth || ""}
                    onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={personal.gender}
                    onChange={(e) => setPersonal({ ...personal, gender: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-Binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Personal Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={personal.personalEmail}
                    onChange={(e) => setPersonal({ ...personal, personalEmail: e.target.value })}
                    placeholder="alex.rivera@gmail.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Personal Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={personal.personalPhone}
                    onChange={(e) => setPersonal({ ...personal, personalPhone: e.target.value })}
                    placeholder="+1 (555) 019-2831"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Alternate Phone
                  </label>
                  <input
                    type="tel"
                    value={personal.alternatePhone || ""}
                    onChange={(e) => setPersonal({ ...personal, alternatePhone: e.target.value })}
                    placeholder="+1 (555) 019-9944"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Present Residential Address *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={personal.presentAddress}
                    onChange={(e) => setPersonal({ ...personal, presentAddress: e.target.value })}
                    placeholder="Street, Apartment / Suite, City, Zip, Country"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Permanent Address *
                    </label>
                    <label className="flex items-center gap-1 text-[11px] text-blue-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={personal.sameAsPresent}
                        onChange={(e) => handleSameAddress(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                      />
                      <span>Same as present</span>
                    </label>
                  </div>
                  <textarea
                    rows={2}
                    required
                    value={personal.permanentAddress}
                    onChange={(e) => setPersonal({ ...personal, permanentAddress: e.target.value })}
                    placeholder="Permanent family address"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 font-heading">
                  Emergency Contact Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Contact Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={personal.emergencyContactName}
                      onChange={(e) => setPersonal({ ...personal, emergencyContactName: e.target.value })}
                      placeholder="e.g. Jordan Rivera"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Relationship *
                    </label>
                    <select
                      value={personal.emergencyContactRelationship}
                      onChange={(e) => setPersonal({ ...personal, emergencyContactRelationship: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Child">Child</option>
                      <option value="Friend">Friend / Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Emergency Phone *
                    </label>
                    <input
                      type="tel"
                      required
                      value={personal.emergencyContactPhone}
                      onChange={(e) => setPersonal({ ...personal, emergencyContactPhone: e.target.value })}
                      placeholder="+1 (555) 019-5566"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 2: EMPLOYMENT DETAILS
             ======================================================== */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Employee Code * (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    value={employment.employeeCode}
                    onChange={(e) => setEmployment({ ...employment, employeeCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                {/* Dynamic Branch / Location */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Branch / Location *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddBranch(!showAddBranch)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddBranch ? "Cancel" : "+ New"}</span>
                    </button>
                  </div>

                  {showAddBranch ? (
                    <div className="p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 space-y-1.5">
                      <div className="text-[10px] font-bold text-blue-900">Add New Branch</div>
                      <input
                        type="text"
                        placeholder="Branch Name (e.g. London Office)"
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                      />
                      <input
                        type="text"
                        placeholder="City / Country"
                        value={newBranchCity}
                        onChange={(e) => setNewBranchCity(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleCreateBranch}
                        disabled={addingBranch || !newBranchName.trim()}
                        className="w-full py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                      >
                        {addingBranch ? "Saving..." : "Save Branch"}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={employment.branchId || ""}
                      onChange={(e) => {
                        const b = branches.find((branch) => branch.id === e.target.value);
                        setEmployment({
                          ...employment,
                          branchId: e.target.value,
                          branchLocation: b ? b.name : e.target.value,
                        });
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                    >
                      <option value="">Select Branch</option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} {b.city ? `(${b.city})` : ""} {b.is_headquarters ? "★ HQ" : ""}
                        </option>
                      ))}
                      {branches.length === 0 && (
                        <option value="Headquarters - Main Office">Headquarters - Main Office</option>
                      )}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Department *
                  </label>
                  <select
                    value={employment.departmentId || ""}
                    onChange={(e) => {
                      const dept = departments.find((d) => d.id === e.target.value);
                      setEmployment({
                        ...employment,
                        departmentId: e.target.value,
                        departmentName: dept?.name || "",
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Dynamic Position with Position-wise Salary Structure Link */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-700">
                      Position / Designation *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddPosition(!showAddPosition)}
                      className="text-[10px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showAddPosition ? "Cancel" : "+ New"}</span>
                    </button>
                  </div>

                  {showAddPosition ? (
                    <div className="p-2.5 rounded-lg border border-indigo-200 bg-indigo-50/50 space-y-1.5">
                      <div className="text-[10px] font-bold text-indigo-900">Define New Position & Salary</div>
                      <input
                        type="text"
                        placeholder="Position Title (e.g. QA Automation Engineer)"
                        value={newPositionTitle}
                        onChange={(e) => setNewPositionTitle(e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9px] text-slate-500">Base Salary ($)</label>
                          <input
                            type="number"
                            value={newPositionBasic}
                            onChange={(e) => setNewPositionBasic(e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">House Rent ($)</label>
                          <input
                            type="number"
                            value={newPositionHra}
                            onChange={(e) => setNewPositionHra(e.target.value)}
                            className="w-full px-2 py-1 text-xs rounded border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreatePosition}
                        disabled={addingPosition || !newPositionTitle.trim()}
                        className="w-full py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors"
                      >
                        {addingPosition ? "Saving..." : "Save Position"}
                      </button>
                    </div>
                  ) : (
                    <select
                      value={employment.positionId || ""}
                      onChange={(e) => handleSelectPosition(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500 font-medium"
                    >
                      <option value="">Select Position / Structure</option>
                      {positions.map((pos) => (
                        <option key={pos.id} value={pos.id}>
                          {pos.title} (${Number(pos.basic_salary).toLocaleString()} Base)
                        </option>
                      ))}
                    </select>
                  )}
                  {employment.designation && !showAddPosition && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                      <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>Auto-calibrated salary structure active</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Reporting Manager
                  </label>
                  <select
                    value={employment.reportingManagerId || ""}
                    onChange={(e) => {
                      const mgr = employees.find((emp) => emp.id === e.target.value);
                      setEmployment({
                        ...employment,
                        reportingManagerId: e.target.value,
                        reportingManagerName: mgr ? `${mgr.first_name} ${mgr.last_name}` : "",
                      });
                    }}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="">No Direct Manager</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.job_title})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Employment Type *
                  </label>
                  <select
                    value={employment.employmentType}
                    onChange={(e) => setEmployment({ ...employment, employmentType: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contractual">Contractual</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Intern">Intern</option>
                    <option value="Part-Time">Part-Time</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Joining Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={employment.joiningDate}
                    onChange={(e) => setEmployment({ ...employment, joiningDate: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Probation Duration
                  </label>
                  <select
                    value={employment.probationDurationMonths}
                    onChange={(e) => setEmployment({ ...employment, probationDurationMonths: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value={1}>1 Month</option>
                    <option value={3}>3 Months (Standard)</option>
                    <option value={6}>6 Months</option>
                    <option value={0}>No Probation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Probation End Date (Calculated)
                  </label>
                  <input
                    type="date"
                    readOnly
                    value={employment.probationEndDate || ""}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-600 font-mono cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Work Email (Corporate)
                  </label>
                  <input
                    type="email"
                    value={employment.workEmail || ""}
                    onChange={(e) => setEmployment({ ...employment, workEmail: e.target.value })}
                    placeholder="alex.rivera@orbix.io"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Work Location
                  </label>
                  <select
                    value={employment.workLocation}
                    onChange={(e) => setEmployment({ ...employment, workLocation: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Hybrid">Hybrid</option>
                    <option value="Office">On-Site Office</option>
                    <option value="Remote">100% Remote</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Shift
                  </label>
                  <input
                    type="text"
                    value={employment.shift || ""}
                    onChange={(e) => setEmployment({ ...employment, shift: e.target.value })}
                    placeholder="General Day (9:00 AM - 6:00 PM)"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 3: COMPENSATION & PAYROLL
             ======================================================== */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Compensation details are strictly restricted to authorized HR and Finance roles via RLS.
                </span>
              </div>

              {employment.designation && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Position-wise salary structure auto-applied for <strong>{employment.designation}</strong>. You can adjust individual allowances below.
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Salary Structure *
                  </label>
                  <select
                    value={compensation.salaryStructure}
                    onChange={(e) => setCompensation({ ...compensation, salaryStructure: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Standard Full-Time">Standard Full-Time</option>
                    <option value="Executive Package">Executive Package</option>
                    <option value="Contractor Fixed Rate">Contractor Fixed Rate</option>
                    <option value="Intern Stipend">Intern Stipend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Currency *
                  </label>
                  <select
                    value={compensation.currency}
                    onChange={(e) => setCompensation({ ...compensation, currency: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="BDT">BDT (৳)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Pay Frequency *
                  </label>
                  <select
                    value={compensation.payFrequency}
                    onChange={(e) => setCompensation({ ...compensation, payFrequency: e.target.value as any })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-hidden focus:border-blue-500"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Bi-weekly">Bi-weekly</option>
                    <option value="Weekly">Weekly</option>
                  </select>
                </div>
              </div>

              {/* Allowance Breakdown */}
              <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 font-heading">
                  Earnings & Allowance Breakdown
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Basic Salary *
                    </label>
                    <input
                      type="number"
                      value={compensation.basicSalary}
                      onChange={(e) => setCompensation({ ...compensation, basicSalary: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      House Rent (HRA)
                    </label>
                    <input
                      type="number"
                      value={compensation.houseRentAllowance || 0}
                      onChange={(e) => setCompensation({ ...compensation, houseRentAllowance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Medical
                    </label>
                    <input
                      type="number"
                      value={compensation.medicalAllowance || 0}
                      onChange={(e) => setCompensation({ ...compensation, medicalAllowance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Transport / Other
                    </label>
                    <input
                      type="number"
                      value={(compensation.transportAllowance || 0) + (compensation.otherAllowances || 0)}
                      onChange={(e) => setCompensation({ ...compensation, transportAllowance: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono focus:outline-hidden focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={compensation.bankName || ""}
                    onChange={(e) => setCompensation({ ...compensation, bankName: e.target.value })}
                    placeholder="e.g. JPMorgan Chase"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    value={compensation.accountHolderName || `${personal.firstName} ${personal.lastName}`}
                    onChange={(e) => setCompensation({ ...compensation, accountHolderName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={compensation.bankAccountNumber || ""}
                    onChange={(e) => setCompensation({ ...compensation, bankAccountNumber: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 font-mono focus:outline-hidden focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 4: DOCUMENTS (CLOUDINARY PRIVATE STORAGE)
             ======================================================== */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>
                    Documents are uploaded directly to Cloudinary <span className="font-mono font-semibold">hrms/documents</span> with encrypted, authenticated time-limited URLs.
                  </span>
                </div>
              </div>

              <DocumentUpload
                organizationId={organizationId}
                folder="hrms/documents"
                relatedType="employee_doc"
                relatedId={onboardingId || undefined}
                isPrivate={true}
                maxFiles={8}
                onUploadSuccess={(doc) => {
                  setFeedback({ type: "success", message: `Uploaded ${doc.fileName} to Cloudinary securely!` });
                }}
              />
            </div>
          )}

          {/* ========================================================
              STEP 5: ONBOARDING CHECKLIST (12 STANDARD TASKS)
             ======================================================== */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                <div>
                  <span className="font-semibold text-slate-900">Task Completion Rate: </span>
                  <span className="font-mono font-bold text-blue-600">{completedTasksCount} / {tasks.length} Completed</span>
                </div>
                <div className="w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-xl overflow-hidden bg-white">
                {tasks.map((task, idx) => {
                  const isDone = task.status === "completed";

                  return (
                    <div
                      key={task.taskName}
                      onClick={() => handleToggleTask(idx)}
                      className={cn(
                        "p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-colors text-xs",
                        isDone ? "bg-emerald-50/30 text-slate-600" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors",
                            isDone ? "bg-emerald-600 text-white" : "border border-slate-300"
                          )}
                        >
                          {isDone && <CheckCircle2 className="w-4 h-4" />}
                        </div>

                        <div className="min-w-0">
                          <div className={cn("font-medium truncate", isDone && "line-through text-slate-400")}>
                            {task.taskName}
                          </div>
                          {task.description && (
                            <div className="text-[11px] text-slate-400 truncate">
                              {task.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          {task.responsibleDept}
                        </span>
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                            task.priority === "high"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-slate-100 text-slate-600"
                          )}
                        >
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 6: REVIEW & APPROVAL WORKFLOW
             ======================================================== */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                <div className="text-xs font-bold text-slate-900 font-heading uppercase tracking-wider text-slate-400">
                  Onboarding Record Overview
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Full Name</span>
                    <span className="font-semibold text-slate-900">{personal.firstName} {personal.lastName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Employee Code</span>
                    <span className="font-mono font-semibold text-blue-600">{employment.employeeCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Designation</span>
                    <span className="font-semibold text-slate-900">{employment.designation || "Not specified"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Department</span>
                    <span className="font-semibold text-slate-900">{employment.departmentName || "Engineering"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Joining Date</span>
                    <span className="font-semibold text-slate-900">{employment.joiningDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Employment Type</span>
                    <span className="font-semibold text-slate-900">{employment.employmentType}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Basic Salary</span>
                    <span className="font-mono font-semibold text-slate-900">${employment && compensation.basicSalary.toLocaleString()} / mo</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Checklist Readiness</span>
                    <span className="font-bold text-emerald-600">{completedTasksCount} / {tasks.length} Done</span>
                  </div>
                </div>
              </div>

              {/* 3-Stage Approval Chain */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="text-xs font-bold text-slate-900 font-heading">
                  Approval Workflow Chain
                </div>

                <div className="space-y-2">
                  {[
                    { stage: "Stage 1: HR Officer Review", reviewer: "HR Operations Lead", status: "Approved" },
                    { stage: "Stage 2: HR Manager Approval", reviewer: "Talent Acquisition Director", status: "Approved" },
                    { stage: "Stage 3: Department Head Sign-off", reviewer: "Engineering VP", status: "Pending Final Activation" },
                  ].map((app, idx) => (
                    <div key={app.stage} className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">{app.stage}</span>
                          <span className="text-slate-400 text-[11px] block">{app.reviewer}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              STEP 7: JOINING & ACTIVATION (SECTION 8)
             ======================================================== */}
          {currentStep === 7 && (
            <div className="space-y-5 animate-in fade-in duration-150 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
                <UserCheck className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Ready to Launch & Activate Employee
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Activating this candidate will convert the onboarding record into an active employee directory entry, assigning system access, Cloudinary assets, and payroll profiles.
                </p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl border border-slate-200 bg-slate-50/60 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Personal Information Complete:</span>
                  <span className="font-semibold text-emerald-600">✓ Verified</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Employment Code Assigned:</span>
                  <span className="font-mono font-semibold text-slate-900">{employment.employeeCode}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Mandatory Checklist Tasks:</span>
                  <span className="font-semibold text-emerald-600">{completedTasksCount} Completed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Approval Workflow:</span>
                  <span className="font-semibold text-emerald-600">✓ All Stages Signed</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={activating}
                  onClick={handleFinalActivation}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Activating in Directory...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Activate & Launch Employee Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Footer Navigation Bar */}
        <div className="p-4 sm:px-6 border-t border-slate-100 flex items-center justify-between bg-[#F8F9FA]">
          <button
            type="button"
            disabled={currentStep <= 1 || activating}
            onClick={handlePrevStep}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="text-xs text-slate-400 font-medium">
            Step {currentStep} of {WIZARD_STEPS.length}
          </div>

          {currentStep < WIZARD_STEPS.length ? (
            <button
              type="button"
              disabled={saving}
              onClick={handleNextStep}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            >
              <span>Close Wizard</span>
            </button>
          )}
        </div>

        </div>
      </div>
    </div>
  );
}
