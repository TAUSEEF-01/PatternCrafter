export type Id = string;

export type Project = {
  id: Id;
  details: any;
  category: string;
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
};

export type Invite = {
  id: Id;
  project_id: Id;
  invited_user_id: Id;
  invited_at?: string;
  accepted_at?: string | null;
};
