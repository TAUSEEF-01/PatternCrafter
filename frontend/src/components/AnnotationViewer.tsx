import { useEffect, useRef, useState } from "react";

// Import object detection types
interface Point {
  x: number;
  y: number;
}

interface BoundingBox {
  id: string;
  type: 'bbox';
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

interface Polygon {
  id: string;
  type: 'polygon';
  points: Point[];
  label: string;
  confidence: number;
}

interface Polyline {
  id: string;
  type: 'polyline';
  points: Point[];
  label: string;
  confidence: number;
}

interface PointAnnotation {
  id: string;
  type: 'point';
  x: number;
  y: number;
  label: string;
  confidence: number;
}

interface SegmentationMask {
  id: string;
  type: 'mask';
  rle: string;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  label: string;
  confidence: number;
}

type AnnotationShape = BoundingBox | Polygon | Polyline | PointAnnotation | SegmentationMask;

const BOX_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B739', '#52B788'
];

const ANNOTATION_TYPE_META = {
  bbox: { label: 'Bounding Box', icon: '▭', color: '#4ECDC4' },
  polygon: { label: 'Polygon', icon: '⬡', color: '#FF6B6B' },
  polyline: { label: 'Polyline', icon: '〰', color: '#FFA07A' },
  point: { label: 'Point', icon: '●', color: '#45B7D1' },
  mask: { label: 'Segmentation', icon: '🎨', color: '#98D8C8' }
};

interface AnnotationViewerProps {
  task: {
    category: string;
    task_data: any;
    annotation?: any;
  };
}

export default function AnnotationViewer({ task }: AnnotationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null);
  const [canvasRect, setCanvasRect] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract annotations based on category
  const getAnnotations = (): AnnotationShape[] => {
    if (!task.annotation) return [];

    if (task.category === 'object_detection') {
      // Handle new format with multiple annotation types
      if (task.annotation.annotations && Array.isArray(task.annotation.annotations)) {
        return task.annotation.annotations;
      }
      // Handle legacy bounding_boxes format
      if (task.annotation.bounding_boxes && Array.isArray(task.annotation.bounding_boxes)) {
        return task.annotation.bounding_boxes.map((box: any) => ({
          ...box,
          type: 'bbox'
        }));
      }
      // Handle very old format with objects array
      if (task.annotation.objects && Array.isArray(task.annotation.objects)) {
        return task.annotation.objects.map((obj: any, idx: number) => ({
          id: `bbox_${idx}`,
          type: 'bbox',
          x: obj.bbox[0],
          y: obj.bbox[1],
          width: obj.bbox[2],
          height: obj.bbox[3],
          label: obj.class,
          confidence: obj.confidence || 0.5
        }));
      }
    }

    return [];
  };

  const annotations = getAnnotations();
  const imageUrl = task.task_data?.image_url || '';

  // Load and draw image
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imageUrl) return;

    setImageLoaded(false);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    imageRef.current = img;
    
    // Try without crossOrigin first for better compatibility
    // img.crossOrigin = 'anonymous';
    
    const drawImage = () => {
      if (!img.complete || !img.naturalWidth) return;
      
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      
      // Calculate canvas size to fit container while maintaining aspect ratio
      const containerWidth = container.clientWidth || 800; // Fallback width
      const maxHeight = 600;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let canvasWidth = Math.min(containerWidth - 32, containerWidth); // Account for padding
      let canvasHeight = canvasWidth / aspectRatio;
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setCanvasRect({ width: canvasWidth, height: canvasHeight });
      
      // Clear canvas before drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setImageLoaded(true);
    };
    
    img.onload = drawImage;
    
    img.onerror = (e) => {
      console.error('Failed to load image:', imageUrl, e);
      setImageLoaded(false);
      // Try with crossOrigin if first attempt fails
      if (!img.crossOrigin) {
        img.crossOrigin = 'anonymous';
        img.src = imageUrl;
      }
    };
    
    img.src = imageUrl;

    // Cleanup
    return () => {
      imageRef.current = null;
    };
  }, [imageUrl]);

  // Handle window resize
  useEffect(() => {
    if (!imageLoaded || !imageRef.current) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      const img = imageRef.current;
      
      if (!canvas || !container || !img || !img.complete) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const containerWidth = container.clientWidth || 800;
      const maxHeight = 600;
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      
      let canvasWidth = Math.min(containerWidth - 32, containerWidth);
      let canvasHeight = canvasWidth / aspectRatio;
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      setCanvasRect({ width: canvasWidth, height: canvasHeight });
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [imageLoaded]);

  const percentageToPixels = (percentage: number, dimension: number): number => {
    return (percentage / 100) * dimension;
  };

  const getColorForLabel = (label: string, index: number): string => {
    const hash = label.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return BOX_COLORS[hash % BOX_COLORS.length] || BOX_COLORS[index % BOX_COLORS.length];
  };

  const renderAnnotations = () => {
    if (!canvasRect.width || !canvasRect.height) return null;

    return annotations.map((annotation, index) => {
      const color = getColorForLabel(annotation.label, index);
      const isSelected = selectedAnnotation === annotation.id;
      const strokeWidth = isSelected ? 3 : 2;

      if (annotation.type === 'bbox') {
        const x = percentageToPixels(annotation.x, canvasRect.width);
        const y = percentageToPixels(annotation.y, canvasRect.height);
        const width = percentageToPixels(annotation.width, canvasRect.width);
        const height = percentageToPixels(annotation.height, canvasRect.height);

        return (
          <div
            key={annotation.id}
            className="absolute cursor-pointer transition-all"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              border: `${strokeWidth}px solid ${color}`,
              backgroundColor: `${color}15`,
              boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded"
              style={{ backgroundColor: color }}
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </div>
          </div>
        );
      } else if (annotation.type === 'polygon') {
        const points = annotation.points
          .map(p => `${percentageToPixels(p.x, canvasRect.width)},${percentageToPixels(p.y, canvasRect.height)}`)
          .join(' ');

        const firstPoint = annotation.points[0];
        const labelX = percentageToPixels(firstPoint.x, canvasRect.width);
        const labelY = percentageToPixels(firstPoint.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{ 
              top: 0, 
              left: 0, 
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10 
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <polygon
              points={points}
              fill={`${color}20`}
              stroke={color}
              strokeWidth={strokeWidth}
            />
            {annotation.points.map((point, idx) => (
              <circle
                key={idx}
                cx={percentageToPixels(point.x, canvasRect.width)}
                cy={percentageToPixels(point.y, canvasRect.height)}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1}
              />
            ))}
            <text
              x={labelX}
              y={labelY - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === 'polyline') {
        const points = annotation.points
          .map(p => `${percentageToPixels(p.x, canvasRect.width)},${percentageToPixels(p.y, canvasRect.height)}`)
          .join(' ');

        const firstPoint = annotation.points[0];
        const labelX = percentageToPixels(firstPoint.x, canvasRect.width);
        const labelY = percentageToPixels(firstPoint.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{ 
              top: 0, 
              left: 0, 
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10 
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <polyline
              points={points}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {annotation.points.map((point, idx) => (
              <circle
                key={idx}
                cx={percentageToPixels(point.x, canvasRect.width)}
                cy={percentageToPixels(point.y, canvasRect.height)}
                r={4}
                fill={color}
                stroke="white"
                strokeWidth={1}
              />
            ))}
            <text
              x={labelX}
              y={labelY - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === 'point') {
        const x = percentageToPixels(annotation.x, canvasRect.width);
        const y = percentageToPixels(annotation.y, canvasRect.height);

        return (
          <svg
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{ 
              top: 0, 
              left: 0, 
              width: `${canvasRect.width}px`,
              height: `${canvasRect.height}px`,
              zIndex: isSelected ? 20 : 10 
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <circle cx={x} cy={y} r={6} fill={color} stroke="white" strokeWidth={2} />
            <text
              x={x + 10}
              y={y - 10}
              fill={color}
              fontSize="12"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </text>
          </svg>
        );
      } else if (annotation.type === 'mask' && annotation.bounds) {
        const x = percentageToPixels(annotation.bounds.x, canvasRect.width);
        const y = percentageToPixels(annotation.bounds.y, canvasRect.height);
        const width = percentageToPixels(annotation.bounds.width, canvasRect.width);
        const height = percentageToPixels(annotation.bounds.height, canvasRect.height);

        return (
          <div
            key={annotation.id}
            className="absolute pointer-events-none cursor-pointer"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${width}px`,
              height: `${height}px`,
              backgroundColor: `${color}40`,
              border: `${strokeWidth}px solid ${color}`,
              boxShadow: isSelected ? `0 0 0 2px white, 0 0 0 4px ${color}` : 'none',
            }}
            onClick={() => setSelectedAnnotation(annotation.id)}
          >
            <div
              className="absolute -top-6 left-0 px-2 py-1 text-xs font-bold text-white rounded flex items-center gap-1"
              style={{ backgroundColor: color }}
            >
              🎨 {annotation.label} ({Math.round(annotation.confidence * 100)}%)
            </div>
          </div>
        );
      }

      return null;
    });
  };

  const getAnnotationTypeCounts = () => {
    const counts: { [key: string]: number } = {};
    annotations.forEach(ann => {
      counts[ann.type] = (counts[ann.type] || 0) + 1;
    });
    return counts;
  };

  const typeCounts = getAnnotationTypeCounts();

  if (task.category !== 'object_detection') {
    // Fallback for non-object-detection tasks
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium mb-2">Annotation Data</h3>
        <pre className="text-sm overflow-auto max-h-96 bg-white p-3 rounded border">
          {JSON.stringify(task.annotation, null, 2)}
        </pre>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">⚠️</div>
        <p className="text-amber-800 font-medium">No annotations found</p>
        <p className="text-sm text-amber-600 mt-1">
          The annotator has not submitted any annotations for this task yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Annotation Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="text-xl">📊</span>
          Annotation Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {Object.entries(typeCounts).map(([type, count]) => {
            const meta = ANNOTATION_TYPE_META[type as keyof typeof ANNOTATION_TYPE_META];
            return (
              <div
                key={type}
                className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{meta?.icon}</span>
                  <span className="text-2xl font-bold" style={{ color: meta?.color }}>
                    {count}
                  </span>
                </div>
                <div className="text-xs font-medium text-gray-600">{meta?.label}</div>
              </div>
            );
          })}
          <div className="bg-gradient-to-br from-green-400 to-green-500 rounded-lg p-3 shadow-sm">
            <div className="text-2xl font-bold text-white mb-1">{annotations.length}</div>
            <div className="text-xs font-medium text-white">Total</div>
          </div>
        </div>
      </div>

      {/* Visual Annotation Display */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <span className="text-xl">🖼️</span>
            Annotated Image
          </h3>
          <div className="text-xs text-gray-300">
            {imageDimensions.width} × {imageDimensions.height}px
          </div>
        </div>
        <div ref={containerRef} className="bg-gray-100 p-4 min-h-[400px] flex items-center justify-center">
          {!imageLoaded && imageUrl && (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-sm font-medium">Loading annotated image...</p>
                <p className="text-xs text-gray-400 mt-1">Please wait</p>
              </div>
            </div>
          )}
          {/* Wrapper to keep canvas and annotations aligned together */}
          <div 
            className="relative"
            style={{ 
              width: canvasRect.width ? `${canvasRect.width}px` : 'auto', 
              height: canvasRect.height ? `${canvasRect.height}px` : 'auto',
              display: imageLoaded && canvasRect.width ? 'block' : 'none'
            }}
          >
            <canvas
              ref={canvasRef}
              className="rounded shadow-md absolute top-0 left-0"
              style={{
                width: canvasRect.width ? `${canvasRect.width}px` : 'auto',
                height: canvasRect.height ? `${canvasRect.height}px` : 'auto'
              }}
            />
            {imageLoaded && renderAnnotations()}
          </div>
        </div>
      </div>

      {/* Annotation Details List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <span className="text-xl">📋</span>
            Annotation Details ({annotations.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {annotations.map((annotation, index) => {
            const color = getColorForLabel(annotation.label, index);
            const meta = ANNOTATION_TYPE_META[annotation.type];
            const isSelected = selectedAnnotation === annotation.id;

            return (
              <div
                key={annotation.id}
                className={`p-4 cursor-pointer transition-colors ${
                  isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedAnnotation(annotation.id)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{meta.icon}</span>
                      <span
                        className="font-semibold text-sm px-2 py-1 rounded"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {annotation.label}
                      </span>
                      <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                        {meta.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Confidence:</span>{' '}
                        <span className="font-semibold text-green-600">
                          {Math.round(annotation.confidence * 100)}%
                        </span>
                      </div>
                      {annotation.type === 'bbox' && (
                        <>
                          <div>
                            <span className="font-medium">Position:</span> ({annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}%)
                          </div>
                          <div>
                            <span className="font-medium">Size:</span> {annotation.width.toFixed(1)}% × {annotation.height.toFixed(1)}%
                          </div>
                        </>
                      )}
                      {(annotation.type === 'polygon' || annotation.type === 'polyline') && (
                        <div>
                          <span className="font-medium">Points:</span> {annotation.points.length}
                        </div>
                      )}
                      {annotation.type === 'point' && (
                        <div>
                          <span className="font-medium">Location:</span> ({annotation.x.toFixed(1)}%, {annotation.y.toFixed(1)}%)
                        </div>
                      )}
                      {annotation.type === 'mask' && annotation.bounds && (
                        <>
                          <div>
                            <span className="font-medium">Region:</span> {annotation.bounds.width.toFixed(1)}% × {annotation.bounds.height.toFixed(1)}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className="w-8 h-8 rounded border-2 shadow-sm"
                    style={{ backgroundColor: `${color}40`, borderColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notes Section */}
      {task.annotation?.notes && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <span className="text-xl">💬</span>
            Annotator Notes
          </h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.annotation.notes}</p>
        </div>
      )}
    </div>
  );
}
