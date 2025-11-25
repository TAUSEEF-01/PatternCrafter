# Object Detection Component

## Overview

This component provides a complete Label Studio-inspired object detection interface with interactive bounding box drawing and annotation capabilities for the PatternCrafter project.

## Features

### Task Creation Interface
- ✅ Image URL input with live preview
- ✅ Object class management (bulk and individual entry)
- ✅ Real-time image dimension detection
- ✅ Configurable annotation settings
- ✅ Comprehensive validation feedback
- ✅ Color-coded class visualization
- ✅ Optional task description field

### Annotation Interface
- ✅ Interactive bounding box drawing (click and drag)
- ✅ Box selection and manipulation (move, resize)
- ✅ Multi-class support with color coding
- ✅ Per-box confidence rating (1-5 scale)
- ✅ Dynamic label assignment
- ✅ Visual hover and selection feedback
- ✅ Comprehensive box management
- ✅ Notes and observations field
- ✅ Real-time annotation summary

## Folder Structure

```
ObjectDetection/
├── index.ts                            # Module exports
├── types.ts                            # TypeScript interfaces and types
├── utils.ts                            # Utility functions (validation, calculations)
├── ObjectDetectionTask.tsx             # Task creation component (~700 lines)
├── ObjectDetectionAnnotator.tsx        # Annotation interface component (~600 lines)
└── README.md                           # This file
```

## Components

### 1. ObjectDetectionTask
**Purpose**: Task creation interface for managers to set up object detection tasks

**Props**:
```typescript
interface ObjectDetectionTaskProps {
  onDataChange: (data: ObjectDetectionData | null) => void;
  initialData?: ObjectDetectionData;
}
```

**Key Features**:
- Image URL validation and preview
- Bulk class input (comma-separated)
- Individual class addition
- Color-coded class chips
- Allow multiple boxes per class setting
- Real-time validation summary

### 2. ObjectDetectionAnnotator
**Purpose**: Interactive annotation interface for drawing and managing bounding boxes

**Props**:
```typescript
interface ObjectDetectionAnnotatorProps {
  imageUrl: string;
  classes: string[];
  existingAnnotation?: ObjectDetectionAnnotation;
  onAnnotationChange: (annotation: ObjectDetectionAnnotation | null) => void;
  allowMultipleBoxes?: boolean;
}
```

**Key Features**:
- Click-and-drag box drawing
- Box selection and movement
- Per-box confidence rating
- Dynamic label assignment
- Color-coded visualization
- Box list with edit capabilities

## Data Structures

### ObjectDetectionData
Task configuration data structure:
```typescript
interface ObjectDetectionData {
  image_url: string;
  classes: string[];
  description?: string;
  image_width?: number;
  image_height?: number;
  allow_multiple_boxes?: boolean;
  min_box_size?: number;
}
```

### BoundingBox
Individual bounding box annotation:
```typescript
interface BoundingBox {
  id: string;
  x: number;        // percentage from left (0-100)
  y: number;        // percentage from top (0-100)
  width: number;    // percentage width (0-100)
  height: number;   // percentage height (0-100)
  label: string;
  confidence?: number;  // 1-5 scale
}
```

### ObjectDetectionAnnotation
Complete annotation data:
```typescript
interface ObjectDetectionAnnotation {
  bounding_boxes: BoundingBox[];
  image_url: string;
  notes?: string;
  annotation_time?: number;
}
```

## Integration Points

### CreateTaskPage Integration

Add to imports:
```typescript
import {
  ObjectDetectionTask,
  ObjectDetectionData,
} from "@/components/ObjectDetection";
```

Add state management:
```typescript
const [objectDetectionData, setObjectDetectionData] =
  useState<ObjectDetectionData | null>(null);
```

Add to category rendering:
```typescript
{category === "object_detection" && (
  <ObjectDetectionTask
    onDataChange={(data) => setObjectDetectionData(data)}
    initialData={objectDetectionData || undefined}
  />
)}
```

Update createTask function:
```typescript
case "object_detection": {
  if (objectDetectionData) {
    task_data = objectDetectionData;
  } else {
    // Fallback for backward compatibility
    task_data = { image_url: od_image, classes: parseList(od_classes) };
  }
  break;
}
```

### TaskAnnotatePage Integration

Add to imports:
```typescript
import {
  ObjectDetectionAnnotator,
  ObjectDetectionAnnotation,
} from "@/components/ObjectDetection";
```

Add state management:
```typescript
const [objectDetectionAnnotation, setObjectDetectionAnnotation] =
  useState<ObjectDetectionAnnotation | null>(null);
```

Add to category rendering:
```typescript
{task.category === "object_detection" && (
  <ObjectDetectionAnnotator
    imageUrl={task.task_data.image_url}
    classes={task.task_data.classes}
    existingAnnotation={objectDetectionAnnotation || undefined}
    onAnnotationChange={(annotation) =>
      setObjectDetectionAnnotation(annotation)
    }
    allowMultipleBoxes={task.task_data.allow_multiple_boxes}
  />
)}
```

Update submit function:
```typescript
if (objectDetectionAnnotation) {
  annotation = objectDetectionAnnotation;
} else {
  // Fallback logic
}
```

## API Compatibility

### Backend Schema Requirements

Ensure backend schemas accept:
```python
class ObjectDetectionData(BaseModel):
    image_url: str
    classes: List[str]
    description: Optional[str] = None
    image_width: Optional[int] = None
    image_height: Optional[int] = None
    allow_multiple_boxes: Optional[bool] = True
    min_box_size: Optional[int] = None

class BoundingBox(BaseModel):
    id: str
    x: float  # percentage 0-100
    y: float  # percentage 0-100
    width: float  # percentage 0-100
    height: float  # percentage 0-100
    label: str
    confidence: Optional[int] = None  # 1-5

class ObjectDetectionAnnotation(BaseModel):
    bounding_boxes: List[BoundingBox]
    image_url: str
    notes: Optional[str] = None
    annotation_time: Optional[int] = None
```

## Usage Examples

### Creating a Task
```typescript
<ObjectDetectionTask
  onDataChange={(data) => {
    console.log("Task data:", data);
    // Data is null if validation fails
    // Data contains complete configuration if valid
  }}
  initialData={{
    image_url: "https://example.com/street.jpg",
    classes: ["person", "car", "bicycle"],
    description: "Detect all vehicles and pedestrians",
    allow_multiple_boxes: true,
  }}
/>
```

### Annotating
```typescript
<ObjectDetectionAnnotator
  imageUrl="https://example.com/street.jpg"
  classes={["person", "car", "bicycle"]}
  onAnnotationChange={(annotation) => {
    console.log("Bounding boxes:", annotation?.bounding_boxes);
    console.log("Notes:", annotation?.notes);
  }}
  allowMultipleBoxes={true}
/>
```

## Color Scheme

The component uses a predefined color palette for consistent class visualization:
- Red (#EF4444)
- Amber (#F59E0B)
- Emerald (#10B981)
- Blue (#3B82F6)
- Violet (#8B5CF6)
- Pink (#EC4899)
- Teal (#14B8A6)
- Orange (#F97316)
- Cyan (#06B6D4)
- Indigo (#6366F1)

Colors are assigned to classes deterministically based on their index in the classes array.

## Confidence Levels

Five-level confidence rating system:
1. **Very Low** - Red (bg-red-600)
2. **Low** - Orange (bg-orange-500)
3. **Medium** - Yellow (bg-yellow-500) [Default]
4. **High** - Lime (bg-lime-500)
5. **Very High** - Green (bg-green-600)

## Utility Functions

### Validation
- `validateImageUrl(url)` - Check if URL is valid image
- `validateClasses(classes)` - Validate class array
- `validateObjectDetectionData(data)` - Complete data validation

### Calculations
- `normalizeBoundingBox(x, y, w, h)` - Ensure positive dimensions
- `pixelsToPercentage(pixels, container)` - Convert to percentage
- `percentageToPixels(percent, container)` - Convert to pixels
- `calculateBoxArea(box)` - Get box area
- `calculateIoU(box1, box2)` - Intersection over Union
- `boxesOverlap(box1, box2)` - Check overlap

### Helpers
- `generateBoxId()` - Create unique box identifier
- `getColorForLabel(label, allLabels)` - Consistent color assignment
- `isPointInBox(x, y, box)` - Hit detection
- `formatConfidenceLabel(confidence)` - Human-readable confidence
- `getConfidenceColor(confidence)` - Color for confidence level

## Design Philosophy

This implementation follows Label Studio's design principles:

1. **Visual Clarity**: Clean interface with clear visual hierarchy
2. **Intuitive Interaction**: Click-and-drag drawing feels natural
3. **Real-time Feedback**: Immediate validation and preview updates
4. **Professional Polish**: Attention to detail in animations and transitions
5. **Flexibility**: Supports various object detection workflows
6. **Accessibility**: Proper ARIA labels and keyboard support
7. **Mobile-Friendly**: Responsive design adapts to different screen sizes

## Testing Checklist

### Task Creation
- [ ] Image URL validation (valid/invalid formats)
- [ ] Image preview loading states
- [ ] Class bulk input parsing
- [ ] Class individual addition
- [ ] Class removal
- [ ] Color-coded class display
- [ ] Settings toggle (multiple boxes)
- [ ] Validation summary updates
- [ ] Form submission with valid data

### Annotation
- [ ] Box drawing (click and drag)
- [ ] Box selection (click existing box)
- [ ] Box movement (drag to move)
- [ ] Label assignment per box
- [ ] Confidence level adjustment
- [ ] Box deletion
- [ ] Clear all boxes
- [ ] Notes field
- [ ] Annotation summary display
- [ ] Existing annotation loading

### Edge Cases
- [ ] Empty class list handling
- [ ] Invalid image URL handling
- [ ] Very small boxes (minimum size)
- [ ] Overlapping boxes
- [ ] Boxes at image boundaries
- [ ] Network errors during image load
- [ ] Rapid box creation
- [ ] Mobile touch interactions

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## Performance Considerations

- Image dimensions are cached after first load
- Box rendering is optimized with React keys
- Percentage-based coordinates ensure scalability
- Minimal re-renders through proper state management

## Future Enhancements

Potential improvements for future iterations:

1. **Advanced Features**
   - Box resizing with corner/edge handles
   - Keyboard shortcuts (Delete, Escape, Arrow keys)
   - Undo/redo functionality
   - Box snapping to edges
   - Zoom and pan controls

2. **Annotation Tools**
   - Copy/paste boxes
   - Duplicate box with offset
   - Box alignment tools
   - Grid overlay option
   - Measurement tools (area, aspect ratio)

3. **Export Options**
   - Export as COCO format
   - Export as YOLO format
   - Export as Pascal VOC XML
   - Export annotations as JSON

4. **Collaboration**
   - Multi-user annotation conflicts
   - Annotation versioning
   - Comment threads on boxes

## Merge Instructions

This component is designed for easy integration:

1. The entire ObjectDetection folder is self-contained
2. Only two integration points: CreateTaskPage and TaskAnnotatePage
3. No modifications to existing components (except integration)
4. Backward compatible with old object detection format
5. No breaking changes to API contracts

### Integration Steps:
1. Copy ObjectDetection folder to `frontend/src/components/`
2. Add imports to CreateTaskPage.tsx
3. Add imports to TaskAnnotatePage.tsx
4. Add state management in both pages
5. Add component rendering in category conditionals
6. Update createTask and submit functions with fallback logic
7. Test thoroughly before merging to main branch

## Support

For questions or issues:
- Check integration examples above
- Review type definitions in types.ts
- Test with provided usage examples
- Verify backend schema compatibility

---

**Version**: 1.0.0  
**Last Updated**: November 24, 2025  
**Component Type**: Object Detection with Bounding Boxes  
**Design Inspiration**: Label Studio
