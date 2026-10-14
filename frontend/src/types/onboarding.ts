export type OnboardingStatus =
  | "draft"
  | "submitted"
  | "in_review"
  | "changes_requested"
  | "approved"
  | "rejected"
  | "completed"
  | "cancelled";

export type Gender = "male" | "female" | "non_binary" | "prefer_not_to_say";

export type EmploymentTypeOption =
  | "Permanent"
  | "Contractual"
  | "Temporary"
  | "Intern"
  | "Part-Time";

export type WorkLocationOption = "Office" | "Hybrid" | "Remote";

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type DocumentVerificationStatus = "pending" | "verified" | "rejected";
export type ApprovalDecision = "pending" | "approved" | "rejected" | "changes_requested";

export interface PersonalInfo {
  firstName: string;
  middleName?: string;
  lastName: string;
  preferredName?: string;
  dateOfBirth?: string | null;
  gender: Gender;
  personalEmail: string;
  personalPhone: string;
  alternatePhone?: string;
  presentAddress: string;
  permanentAddress: string;
  sameAsPresent?: boolean;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  profilePhotoUrl?: string | null;
  profilePhotoPublicId?: string | null;
}

export interface EmploymentInfo {
  employeeCode: string;
  branchId?: string | null;
  branchLocation: string;
  departmentId?: string | null;
  departmentName?: string;
  positionId?: string | null;
  designation: string;
  reportingManagerId?: string | null;
  reportingManagerName?: string;
  assignedHrOfficerId?: string | null;
  assignedHrOfficerName?: string;
  employmentType: EmploymentTypeOption;
  joiningDate: string;
  probationDurationMonths: number;
  probationEndDate?: string | null;
  workEmail?: string;
  workPhone?: string;
  workLocation: WorkLocationOption;
  shift?: string;
  costCenter?: string;
}

export interface CompensationInfo {
  salaryStructure: string;
  basicSalary: number;
  houseRentAllowance?: number;
  medicalAllowance?: number;
  transportAllowance?: number;
  otherAllowances?: number;
  effectiveDate?: string | null;
  payFrequency: "Monthly" | "Bi-weekly" | "Weekly";
  currency: string;
  bankName?: string;
  accountHolderName?: string;
  bankAccountNumber?: string;
}

export interface EquipmentInfo {
  assetType: string;
  assetName: string;
  assetSerialNumber: string;
  issuedDate?: string | null;
  issuedBy?: string;
  expectedReturnDate?: string | null;
  handoverAcknowledged: boolean;
  companyEmailProvisioned: boolean;
  requiredAccess: string[];
  provisionedBy?: string;
  provisioningDate?: string | null;
  notes?: string;
}

export interface OnboardingDocument {
  id: string;
  onboardingId: string;
  category: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  publicId: string;
  secureUrl: string;
  isPrivate: boolean;
  isMandatory: boolean;
  status: DocumentVerificationStatus;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
}

export interface OnboardingTask {
  id: string;
  onboardingId: string;
  taskName: string;
  description?: string;
  responsibleDept: "HR" | "IT" | "Admin" | "Finance";
  assignedPerson?: string;
  dueDate?: string;
  priority: TaskPriority;
  isMandatory: boolean;
  status: TaskStatus;
  completedAt?: string | null;
  completionNotes?: string;
}

export interface OnboardingApproval {
  id: string;
  onboardingId: string;
  stageName: string;
  stageOrder: number;
  approverId?: string | null;
  approverName?: string;
  status: ApprovalDecision;
  decisionDate?: string | null;
  comments?: string;
  rejectionReason?: string;
}

export interface EmployeeOnboarding {
  id: string;
  organizationId?: string;
  organization_id?: string;
  createdBy?: string;
  created_by?: string;
  status: OnboardingStatus;
  currentStep?: number;
  current_step?: number;
  progress: number;
  personalInfo?: PersonalInfo;
  personal_info?: any;
  employmentInfo?: EmploymentInfo;
  employment_info?: any;
  compensationInfo?: CompensationInfo;
  compensation_info?: any;
  equipmentInfo?: EquipmentInfo;
  equipment_info?: any;
  documents?: OnboardingDocument[];
  tasks?: OnboardingTask[];
  approvals?: OnboardingApproval[];
  employeeId?: string | null;
  employee_id?: string | null;
  activationDate?: string | null;
  activation_date?: string | null;
  confirmedBy?: string | null;
  confirmed_by?: string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

// 12 Standard Pre-configured Tasks (Section 5)
export const DEFAULT_ONBOARDING_TASKS: Omit<OnboardingTask, "id" | "onboardingId">[] = [
  {
    taskName: "Verify employee personal & contact information",
    description: "Check identity details, phone numbers, and emergency contacts for completeness.",
    responsibleDept: "HR",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Confirm signed offer acceptance",
    description: "Ensure candidate signed and returned the formal job offer.",
    responsibleDept: "HR",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Prepare and execute employment contract",
    description: "Draft official employment agreement and obtain necessary signatures.",
    responsibleDept: "HR",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Verify submitted compliance documents & IDs",
    description: "Review uploaded identification, certificates, and tax documents.",
    responsibleDept: "HR",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Create corporate email account",
    description: "Provision corporate Google Workspace / Microsoft 365 mailbox.",
    responsibleDept: "IT",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Configure system & application access",
    description: "Grant credentials to Slack, GitHub, Jira, ERP, and internal wikis.",
    responsibleDept: "IT",
    priority: "medium",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Prepare workstation / laptop hardware",
    description: "Assemble hardware, install disk encryption, and test peripherals.",
    responsibleDept: "IT",
    priority: "medium",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Issue security access badge & keys",
    description: "Program NFC physical door badge for office building access.",
    responsibleDept: "Admin",
    priority: "medium",
    isMandatory: false,
    status: "pending",
  },
  {
    taskName: "Configure payroll profile & bank setup",
    description: "Register account holder details and salary components in payroll ledger.",
    responsibleDept: "Finance",
    priority: "high",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Complete corporate orientation & welcome session",
    description: "Introduce mission, company culture, culture deck, and team members.",
    responsibleDept: "HR",
    priority: "medium",
    isMandatory: false,
    status: "pending",
  },
  {
    taskName: "Acknowledge company policy handbook & NDA",
    description: "Receive digital acknowledgement of code of conduct and privacy terms.",
    responsibleDept: "HR",
    priority: "medium",
    isMandatory: true,
    status: "pending",
  },
  {
    taskName: "Assign reporting manager & onboarding buddy",
    description: "Connect new hire with dedicated buddy for first 30 days.",
    responsibleDept: "HR",
    priority: "low",
    isMandatory: false,
    status: "pending",
  },
];
