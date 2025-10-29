import type { AnnotationResult, BaseTaskDefinition } from '../types/tasks';

export const createDefaultResult = (task: BaseTaskDefinition): AnnotationResult => {
  switch (task.schema.kind) {
    case 'image_captioning':
      return { kind: 'image_captioning', payload: { caption: '' } };
    case 'image_classification':
      return { kind: 'image_classification', payload: { selections: [] } };
    case 'visual_question_answering':
      return {
        kind: 'visual_question_answering',
        payload: {
          aspects: [],
          answers: task.schema.questions.map((question) => ({
            id: question.id,
            text: ''
          }))
        }
      };
    case 'object_detection':
      return { kind: 'object_detection', payload: { boxes: [] } };
    case 'semantic_segmentation':
      return { kind: 'semantic_segmentation', payload: { polygons: [] } };
    case 'ocr':
      return { kind: 'ocr', payload: { regions: [] } };
    default:
      return { kind: 'image_captioning', payload: { caption: '' } };
  }
};
