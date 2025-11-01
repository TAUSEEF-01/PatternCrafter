export type TaskSchema =
  | ImageCaptioningSchema
  | ImageClassificationSchema
  | VisualQuestionAnsweringSchema
  | ObjectDetectionSchema
  | SemanticSegmentationSchema
  | OpticalCharacterRecognitionSchema;

export interface BaseTaskDefinition {
  id: string;
  title: string;
  group: string;
  type: 'community';
  image: string;
  details: string;
  order?: number;
  schema: TaskSchema;
}

export interface ImageCaptioningSchema {
  kind: 'image_captioning';
  image: string;
  prompt: string;
}

export interface ImageClassificationSchema {
  kind: 'image_classification';
  image: string;
  multiple?: boolean;
  choices: string[];
}

export interface VisualQuestionAnsweringSchema {
  kind: 'visual_question_answering';
  image: string;
  aspects: string[];
  questions: Array<{ id: string; text: string }>;
}

export interface ObjectDetectionSchema {
  kind: 'object_detection';
  image: string;
  labels: string[];
}

export interface SemanticSegmentationSchema {
  kind: 'semantic_segmentation';
  image: string;
  labels: string[];
}

export interface OpticalCharacterRecognitionSchema {
  kind: 'ocr';
  image: string;
  labels: string[];
}

export type AnnotationResult =
  | ImageCaptioningResult
  | ImageClassificationResult
  | VisualQuestionAnsweringResult
  | ObjectDetectionResult
  | SemanticSegmentationResult
  | OpticalCharacterRecognitionResult;

export interface BaseAnnotationResult<TKind extends TaskSchema['kind'], TPayload> {
  kind: TKind;
  payload: TPayload;
}

export interface ImageCaptioningResult
  extends BaseAnnotationResult<'image_captioning', { caption: string }> {}

export interface ImageClassificationResult
  extends BaseAnnotationResult<'image_classification', { selections: string[] }> {}

export interface VisualQuestionAnsweringResult
  extends BaseAnnotationResult<
    'visual_question_answering',
    {
      aspects: string[];
      answers: Array<{ id: string; text: string }>;
    }
  > {}

export interface BoundingBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ObjectDetectionResult
  extends BaseAnnotationResult<'object_detection', { boxes: BoundingBox[] }> {}

export interface PolygonPoint {
  x: number;
  y: number;
}

export interface PolygonRegion {
  id: string;
  label: string;
  points: PolygonPoint[];
}

export interface SemanticSegmentationResult
  extends BaseAnnotationResult<'semantic_segmentation', { polygons: PolygonRegion[] }> {}

export interface OcrRegion {
  id: string;
  label: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OpticalCharacterRecognitionResult
  extends BaseAnnotationResult<'ocr', { regions: OcrRegion[] }> {}
