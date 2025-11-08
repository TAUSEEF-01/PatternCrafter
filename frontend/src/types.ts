export type Id = string;

export type Project = {
  id: Id;
  // Backend expects `details` as a simple string (e.g., project name/description)
  details: string;
  category: string;
  is_completed: boolean;
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
  accumulated_time?: number | null;
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
