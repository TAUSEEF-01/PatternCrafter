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
  qa_accumulated_time?: number | null;
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
  type: "invite" | "task_assigned" | "task_completed" | "qa_assigned" | "annotation_submitted" | "qa_completed" | "qa_approved" | "task_returned";
  title: string;
  message: string;
  task_id?: Id | null;
  project_id?: Id | null;
  is_read: boolean;
  created_at: string;
};
