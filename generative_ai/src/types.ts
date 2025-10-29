export interface TemplateMeta {
  id: string;
  title: string;
  group: string;
  type?: string;
  order?: number;
  image?: string;
  detailsHtml?: string;
}

export interface Template extends TemplateMeta {
  configMarkup?: string;
  example: Record<string, unknown>;
}

export interface Submission {
  id: string;
  templateId: string;
  annotation: Record<string, unknown>;
  createdAt: string;
  user?: Record<string, unknown> | null;
}
