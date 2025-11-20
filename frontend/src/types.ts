export type Id = string;

export type Project = {
  id: Id;
  // Backend expects `details` as a simple string (e.g., project name/description)
  details: string;
  category: string;
  is_completed: boolean;
};

export type TaskRemark = {
  message: string;
  author_id: Id;
  author_name?: string | null;
  author_role: "admin" | "manager" | "annotator";
  remark_type: "qa_return" | "annotator_reply" | "qa_note" | "manager_note";
  created_at: string;
};

export type Task = {
  id: Id;
  project_id: Id;
  category: string;
  task_data: any;
  annotation?: any;
  qa_annotation?: any;
  qa_feedback?: string;
  assigned_annotator_id?: Id | null;
  assigned_qa_id?: Id | null;
  completed_status?: {
    annotator_part?: boolean;
    qa_part?: boolean;
  };
  is_returned?: boolean;
  return_reason?: string;
  returned_by?: Id | null;
  accumulated_time?: number | null;
  remarks?: TaskRemark[];
  created_at?: string;
  annotator_started_at?: string | null;
  annotator_completed_at?: string | null;
  qa_started_at?: string | null;
  qa_completed_at?: string | null;
};

export type Invite = {
  id: Id;
  project_id: Id;
  invited_user_id: Id;
  invited_at?: string;
  accepted_at?: string | null;
};

export type Notification = {
  id: Id;
  recipient_id: Id;
  sender_id?: Id | null;
  type: "invite" | "task_assigned" | "task_completed";
  title: string;
  message: string;
  task_id?: Id | null;
  project_id?: Id | null;
  is_read: boolean;
  created_at: string;
};

/* ---------------- Adapter Pattern (local-only) ---------------- */

// Adapter interface (generic)
export interface Adapter<Api, Domain> {
  fromApi(api: Api): Domain;
  toApi(domain: Domain): Api;
}

// API (raw) shapes that backend returns (uses `_id` and snake_case)
export type ApiId = string;

export interface ApiProject {
  _id?: ApiId;
  details: string;
  category: string;
  is_completed: boolean;
  [k: string]: any;
}

export interface ApiTask {
  _id?: ApiId;
  project_id: ApiId;
  category: string;
  task_data: any;
  annotation?: any;
  qa_annotation?: any;
  qa_feedback?: string;
  assigned_annotator_id?: ApiId | null;
  assigned_qa_id?: ApiId | null;
  completed_status?: {
    annotator_part?: boolean;
    qa_part?: boolean;
  };
  is_returned?: boolean;
  return_reason?: string;
  returned_by?: ApiId | null;
  accumulated_time?: number | null;
  remarks?: TaskRemark[];
  created_at?: string;
  annotator_started_at?: string | null;
  annotator_completed_at?: string | null;
  qa_started_at?: string | null;
  qa_completed_at?: string | null;
  [k: string]: any;
}

export interface ApiInvite {
  _id?: ApiId;
  project_id: ApiId;
  invited_user_id: ApiId;
  invited_at?: string;
  accepted_at?: string | null;
  [k: string]: any;
}

export interface ApiNotification {
  _id?: ApiId;
  recipient_id: ApiId;
  sender_id?: ApiId | null;
  type: string;
  title: string;
  message: string;
  task_id?: ApiId | null;
  project_id?: ApiId | null;
  is_read?: boolean;
  created_at?: string;
  [k: string]: any;
}

/* Concrete adapters: keep them in this file only (do not import/use elsewhere) */

export class ProjectAdapter implements Adapter<ApiProject, Project> {
  fromApi(a: ApiProject): Project {
    return {
      id: (a as any)._id ?? ("" as Id),
      details: a.details,
      category: a.category,
      is_completed: Boolean(a.is_completed),
    };
  }

  toApi(d: Project): ApiProject {
    const out: ApiProject = {
      details: d.details,
      category: d.category,
      is_completed: d.is_completed,
    };
    if (d.id) (out as any)._id = d.id;
    return out;
  }
}

export class TaskAdapter implements Adapter<ApiTask, Task> {
  fromApi(a: ApiTask): Task {
    return {
      id: (a as any)._id ?? ("" as Id),
      project_id: a.project_id,
      category: a.category,
      task_data: a.task_data,
      annotation: a.annotation,
      qa_annotation: a.qa_annotation,
      qa_feedback: a.qa_feedback,
      assigned_annotator_id: a.assigned_annotator_id ?? null,
      assigned_qa_id: a.assigned_qa_id ?? null,
      completed_status: a.completed_status,
      is_returned: a.is_returned,
      return_reason: a.return_reason,
      returned_by: a.returned_by ?? null,
      accumulated_time: a.accumulated_time ?? null,
      remarks: a.remarks ?? [],
      created_at: a.created_at ?? "",
      annotator_started_at: a.annotator_started_at ?? null,
      annotator_completed_at: a.annotator_completed_at ?? null,
      qa_started_at: a.qa_started_at ?? null,
      qa_completed_at: a.qa_completed_at ?? null,
    };
  }

  toApi(d: Task): ApiTask {
    const out: ApiTask = {
      project_id: d.project_id,
      category: d.category,
      task_data: d.task_data,
    } as ApiTask;
    if (d.id) (out as any)._id = d.id;
    if (d.annotation) out.annotation = d.annotation;
    if (d.qa_annotation) out.qa_annotation = d.qa_annotation;
    if (d.qa_feedback) out.qa_feedback = d.qa_feedback;
    if (d.assigned_annotator_id !== undefined)
      out.assigned_annotator_id = d.assigned_annotator_id ?? null;
    if (d.assigned_qa_id !== undefined) out.assigned_qa_id = d.assigned_qa_id ?? null;
    if (d.completed_status) out.completed_status = d.completed_status;
    return out;
  }
}

export class InviteAdapter implements Adapter<ApiInvite, Invite> {
  fromApi(a: ApiInvite): Invite {
    return {
      id: (a as any)._id ?? ("" as Id),
      project_id: a.project_id,
      invited_user_id: a.invited_user_id,
      invited_at: a.invited_at,
      accepted_at: a.accepted_at ?? null,
    };
  }

  toApi(d: Invite): ApiInvite {
    const out: ApiInvite = {
      project_id: d.project_id,
      invited_user_id: d.invited_user_id,
    };
    if (d.id) (out as any)._id = d.id;
    if (d.invited_at) out.invited_at = d.invited_at;
    if (d.accepted_at !== undefined) out.accepted_at = d.accepted_at ?? null;
    return out;
  }
}

export class NotificationAdapter implements Adapter<ApiNotification, Notification> {
  fromApi(a: ApiNotification): Notification {
    return {
      id: (a as any)._id ?? ("" as Id),
      recipient_id: a.recipient_id,
      sender_id: a.sender_id ?? null,
      type: a.type as any,
      title: a.title,
      message: a.message,
      task_id: a.task_id ?? null,
      project_id: a.project_id ?? null,
      is_read: Boolean(a.is_read ?? false),
      created_at: a.created_at ?? "",
    };
  }

  toApi(d: Notification): ApiNotification {
    const out: ApiNotification = {
      recipient_id: d.recipient_id,
      type: d.type,
      title: d.title,
      message: d.message,
      is_read: d.is_read,
    };
    if (d.id) (out as any)._id = d.id;
    if (d.sender_id) out.sender_id = d.sender_id;
    if (d.task_id) out.task_id = d.task_id;
    if (d.project_id) out.project_id = d.project_id;
    if (d.created_at) out.created_at = d.created_at;
    return out;
  }
}

/* NOTE: These adapters live only in this file. Do not import/use them elsewhere unless you intentionally opt-in. */
