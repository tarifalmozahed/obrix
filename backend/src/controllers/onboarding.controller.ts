import { Request, Response, NextFunction } from "express";

// Default checklist tasks template
const DEFAULT_CHECKLIST_TASKS = [
  {
    task_name: "Verify employee personal & contact information",
    description: "Check identity details, phone numbers, and emergency contacts for completeness.",
    responsible_dept: "HR",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Confirm signed offer acceptance",
    description: "Ensure candidate signed and returned the formal job offer.",
    responsible_dept: "HR",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Prepare and execute employment contract",
    description: "Draft official employment agreement and obtain necessary signatures.",
    responsible_dept: "HR",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Verify submitted compliance documents & IDs",
    description: "Review uploaded identification, certificates, and tax documents.",
    responsible_dept: "HR",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Create corporate email account",
    description: "Provision corporate Google Workspace / Microsoft 365 mailbox.",
    responsible_dept: "IT",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Configure system & application access",
    description: "Grant credentials to Slack, GitHub, Jira, ERP, and internal wikis.",
    responsible_dept: "IT",
    priority: "medium",
    is_mandatory: true,
  },
  {
    task_name: "Prepare workstation / laptop hardware",
    description: "Assemble hardware, install disk encryption, and test peripherals.",
    responsible_dept: "IT",
    priority: "medium",
    is_mandatory: true,
  },
  {
    task_name: "Issue security access badge & keys",
    description: "Program NFC physical door badge for office building access.",
    responsible_dept: "Admin",
    priority: "medium",
    is_mandatory: false,
  },
  {
    task_name: "Configure payroll profile & bank setup",
    description: "Register account holder details and salary components in payroll ledger.",
    responsible_dept: "Finance",
    priority: "high",
    is_mandatory: true,
  },
  {
    task_name: "Complete corporate orientation & welcome session",
    description: "Introduce mission, company culture, culture deck, and team members.",
    responsible_dept: "HR",
    priority: "medium",
    is_mandatory: false,
  },
  {
    task_name: "Acknowledge company policy handbook & NDA",
    description: "Receive digital acknowledgement of code of conduct and privacy terms.",
    responsible_dept: "HR",
    priority: "medium",
    is_mandatory: true,
  },
  {
    task_name: "Assign reporting manager & onboarding buddy",
    description: "Connect new hire with dedicated buddy for first 30 days.",
    responsible_dept: "HR",
    priority: "low",
    is_mandatory: false,
  },
];

/**
 * List all employee onboardings for an organization
 */
export async function listOnboardings(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { status } = req.query;
    const supabase = req.supabase!;

    let query = supabase
      .from("employee_onboardings")
      .select(`
        *,
        tasks:onboarding_checklist_tasks(count),
        docs:onboarding_documents(count),
        approvals:onboarding_approvals(count)
      `)
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data, error } = await query;
    if (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
      return;
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
}

/**
 * Get onboarding record by ID with tasks, docs, and approvals
 */
export async function getOnboardingById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { id } = req.params;
    const supabase = req.supabase!;

    const [onboardingRes, docsRes, tasksRes, approvalsRes] = await Promise.all([
      supabase
        .from("employee_onboardings")
        .select("*")
        .eq("id", id)
        .eq("organization_id", orgId)
        .single(),
      supabase
        .from("onboarding_documents")
        .select("*")
        .eq("onboarding_id", id)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("onboarding_checklist_tasks")
        .select("*")
        .eq("onboarding_id", id)
        .eq("organization_id", orgId)
        .order("created_at", { ascending: true }),
      supabase
        .from("onboarding_approvals")
        .select("*")
        .eq("onboarding_id", id)
        .eq("organization_id", orgId)
        .order("stage_order", { ascending: true }),
    ]);

    if (onboardingRes.error || !onboardingRes.data) {
      res.status(404).json({ success: false, error: { message: "Onboarding record not found" } });
      return;
    }

    res.json({
      success: true,
      data: {
        ...onboardingRes.data,
        documents: docsRes.data || [],
        tasks: tasksRes.data || [],
        approvals: approvalsRes.data || [],
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Create a new onboarding record and initialize standard checklist tasks
 */
export async function createOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const userId = req.user!.id;
    const supabase = req.supabase!;
    const body = req.body;

    // Generate unique employee code if not provided
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const employeeCode =
      body.employmentInfo?.employeeCode || `EMP-${new Date().getFullYear()}-${randomSuffix}`;

    const employmentInfo = {
      ...(body.employmentInfo || {}),
      employeeCode,
    };

    // 1. Insert onboarding record
    const { data: onboarding, error: insertError } = await supabase
      .from("employee_onboardings")
      .insert({
        organization_id: orgId,
        created_by: userId,
        status: body.status || "draft",
        current_step: body.currentStep || 1,
        progress: body.progress || 14,
        personal_info: body.personalInfo || {},
        employment_info: employmentInfo,
        compensation_info: body.compensationInfo || {},
        equipment_info: body.equipmentInfo || {},
      })
      .select()
      .single();

    if (insertError || !onboarding) {
      res.status(500).json({ success: false, error: { message: insertError?.message || "Failed to create onboarding" } });
      return;
    }

    // 2. Initialize 12 standard pre/post joining tasks
    const tasksToInsert = DEFAULT_CHECKLIST_TASKS.map((t) => ({
      onboarding_id: onboarding.id,
      organization_id: orgId,
      task_name: t.task_name,
      description: t.description,
      responsible_dept: t.responsible_dept,
      priority: t.priority,
      is_mandatory: t.is_mandatory,
      status: "pending",
    }));

    await supabase.from("onboarding_checklist_tasks").insert(tasksToInsert);

    // 3. Initialize 3-stage standard approval workflow
    const approvalsToInsert = [
      {
        onboarding_id: onboarding.id,
        organization_id: orgId,
        stage_name: "HR Officer Review",
        stage_order: 1,
        status: "pending",
      },
      {
        onboarding_id: onboarding.id,
        organization_id: orgId,
        stage_name: "HR Manager Approval",
        stage_order: 2,
        status: "pending",
      },
      {
        onboarding_id: onboarding.id,
        organization_id: orgId,
        stage_name: "Department Head Sign-off",
        stage_order: 3,
        status: "pending",
      },
    ];

    await supabase.from("onboarding_approvals").insert(approvalsToInsert);

    res.status(201).json({
      success: true,
      data: onboarding,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Update an onboarding record (Auto-save draft)
 */
export async function updateOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { id } = req.params;
    const supabase = req.supabase!;
    const body = req.body;

    const updates: Record<string, unknown> = {};
    if (body.personalInfo !== undefined) updates.personal_info = body.personalInfo;
    if (body.employmentInfo !== undefined) updates.employment_info = body.employmentInfo;
    if (body.compensationInfo !== undefined) updates.compensation_info = body.compensationInfo;
    if (body.equipmentInfo !== undefined) updates.equipment_info = body.equipmentInfo;
    if (body.currentStep !== undefined) updates.current_step = body.currentStep;
    if (body.progress !== undefined) updates.progress = body.progress;
    if (body.status !== undefined) updates.status = body.status;

    const { data: updated, error } = await supabase
      .from("employee_onboardings")
      .update(updates)
      .eq("id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
      return;
    }

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * Toggle or update checklist task
 */
export async function updateChecklistTask(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { id, taskId } = req.params;
    const { status, completionNotes, assignedPerson, dueDate } = req.body;
    const supabase = req.supabase!;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
      if (status === "completed") {
        updates.completed_at = new Date().toISOString();
      } else {
        updates.completed_at = null;
      }
    }
    if (completionNotes !== undefined) updates.completion_notes = completionNotes;
    if (assignedPerson !== undefined) updates.assigned_person = assignedPerson;
    if (dueDate !== undefined) updates.due_date = dueDate;

    const { data, error } = await supabase
      .from("onboarding_checklist_tasks")
      .update(updates)
      .eq("id", taskId)
      .eq("onboarding_id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
      return;
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

/**
 * Final Employee Activation (Section 8)
 * Converts approved onboarding into an active employee record
 */
export async function activateOnboardingEmployee(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const userId = req.user!.id;
    const { id } = req.params;
    const supabase = req.supabase!;

    // 1. Fetch onboarding record
    const { data: onboarding, error: fetchError } = await supabase
      .from("employee_onboardings")
      .select("*")
      .eq("id", id)
      .eq("organization_id", orgId)
      .single();

    if (fetchError || !onboarding) {
      res.status(404).json({ success: false, error: { message: "Onboarding record not found" } });
      return;
    }

    if (onboarding.status === "completed") {
      res.status(400).json({ success: false, error: { message: "Employee is already activated" } });
      return;
    }

    const p = onboarding.personal_info || {};
    const e = onboarding.employment_info || {};
    const c = onboarding.compensation_info || {};

    const employeeCode =
      e.employeeCode || `EMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Insert into upgraded employees table
    const { data: newEmployee, error: empError } = await supabase
      .from("employees")
      .insert({
        organization_id: orgId,
        first_name: p.firstName || "Staff",
        last_name: p.lastName || "Member",
        email: e.workEmail || p.personalEmail || `employee_${Date.now()}@orbix.io`,
        phone: e.workPhone || p.personalPhone || null,
        job_title: e.designation || "New Joiner",
        department_id: e.departmentId || null,
        branch_id: e.branchId || null,
        branch_location: e.branchLocation || null,
        position_id: e.positionId || null,
        employee_code: employeeCode,
        employment_type: (e.employmentType || "full_time").toLowerCase().replace("-", "_"),
        salary: Number(c.basicSalary || 0),
        hire_date: e.joiningDate || new Date().toISOString().split("T")[0],
        probation_duration_months: e.probationDurationMonths || 3,
        probation_end_date: e.probationEndDate || null,
        work_location: e.workLocation || "Office",
        shift: e.shift || "General Day Shift",
        cost_center: e.costCenter || null,
        personal_email: p.personalEmail || null,
        personal_phone: p.personalPhone || null,
        emergency_contact_name: p.emergencyContactName || null,
        emergency_contact_relationship: p.emergencyContactRelationship || null,
        emergency_contact_phone: p.emergencyContactPhone || null,
        salary_structure: c,
        bank_name: c.bankName || null,
        account_holder_name: c.accountHolderName || null,
        bank_account_number: c.bankAccountNumber || null,
        onboarding_id: id,
        avatar_url: p.profilePhotoUrl || null,
        avatar_public_id: p.profilePhotoPublicId || null,
        status: "active",
      })
      .select()
      .single();

    if (empError || !newEmployee) {
      res.status(500).json({ success: false, error: { message: empError?.message || "Failed to create employee" } });
      return;
    }

    // 3. Mark onboarding as completed
    await supabase
      .from("employee_onboardings")
      .update({
        status: "completed",
        progress: 100,
        employee_id: newEmployee.id,
        activation_date: new Date().toISOString(),
        confirmed_by: userId,
      })
      .eq("id", id)
      .eq("organization_id", orgId);

    res.json({
      success: true,
      data: {
        message: "Employee successfully activated!",
        employee: newEmployee,
        onboardingId: id,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Delete onboarding record
 */
export async function deleteOnboarding(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const { id } = req.params;
    const supabase = req.supabase!;

    const { error } = await supabase
      .from("employee_onboardings")
      .delete()
      .eq("id", id)
      .eq("organization_id", orgId);

    if (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
      return;
    }

    res.json({ success: true, message: "Onboarding record deleted successfully" });
  } catch (err) {
    next(err);
  }
}

/**
 * Update Approval Stage Decision (Section 6)
 */
export async function updateApprovalDecision(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const orgId = req.organization!.id;
    const userId = req.user!.id;
    const { id, approvalId } = req.params;
    const { status, comments, rejectionReason } = req.body;
    const supabase = req.supabase!;

    const { data, error } = await supabase
      .from("onboarding_approvals")
      .update({
        status,
        comments,
        rejection_reason: rejectionReason || null,
        approver_id: userId,
        decision_date: new Date().toISOString(),
      })
      .eq("id", approvalId)
      .eq("onboarding_id", id)
      .eq("organization_id", orgId)
      .select()
      .single();

    if (error) {
      res.status(500).json({ success: false, error: { message: error.message } });
      return;
    }

    // Synchronize parent onboarding record status
    if (status === "rejected") {
      await supabase
        .from("employee_onboardings")
        .update({ status: "rejected" })
        .eq("id", id)
        .eq("organization_id", orgId);
    } else if (status === "changes_requested") {
      await supabase
        .from("employee_onboardings")
        .update({ status: "changes_requested" })
        .eq("id", id)
        .eq("organization_id", orgId);
    } else if (status === "approved") {
      const { data: allApprovals } = await supabase
        .from("onboarding_approvals")
        .select("status")
        .eq("onboarding_id", id)
        .eq("organization_id", orgId);

      const allApproved = (allApprovals || []).length > 0 && allApprovals?.every((a) => a.status === "approved");
      if (allApproved) {
        await supabase
          .from("employee_onboardings")
          .update({ status: "approved" })
          .eq("id", id)
          .eq("organization_id", orgId);
      }
    }

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}
