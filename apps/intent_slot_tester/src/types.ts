export type Entity = {
  start: number;
  end: number;
  label: string;
  text: string;
};
export type AnnotationRecord = {
  id: string;
  intent: string;
  dialogue: string;
  entities: Entity[];
  createdAt: string;
};
