import { create } from 'zustand';
import type { AnnotationResult } from '../types/tasks';

export interface TaskRecord {
  taskId: string;
  title: string;
  schemaKind: AnnotationResult['kind'];
  result: AnnotationResult;
  updatedAt: string;
}

interface TaskState {
  currentTaskId?: string;
  records: Record<string, TaskRecord>;
  setCurrentTask: (taskId?: string) => void;
  saveResult: (taskId: string, title: string, result: AnnotationResult) => void;
  removeResult: (taskId: string) => void;
  reset: () => void;
}

export const useTaskStore = create<TaskState>((set) => ({
  currentTaskId: undefined,
  records: {},
  setCurrentTask: (taskId) => set({ currentTaskId: taskId }),
  saveResult: (taskId, title, result) =>
    set((state) => ({
      records: {
        ...state.records,
        [taskId]: {
          taskId,
          title,
          schemaKind: result.kind,
          result,
          updatedAt: new Date().toISOString()
        }
      }
    })),
  removeResult: (taskId) =>
    set((state) => {
      const { [taskId]: _, ...rest } = state.records;
      return { records: rest };
    }),
  reset: () => set({ records: {}, currentTaskId: undefined })
}));
