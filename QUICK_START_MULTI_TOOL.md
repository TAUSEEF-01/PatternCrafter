# Quick Start: Multi-Tool Annotation

## 🎯 For Annotators

### Tool Selection
1. **⬜ Bounding Box (B)** - Click and drag to draw rectangle
2. **⬟ Polygon (P)** - Click to add points, click near first to close
3. **〰️ Polyline (L)** - Click to add points, press Enter to finish
4. **📍 Point (O)** - Single click to place marker
5. **🎨 Mask (M)** - Foundation ready (brush tool coming soon)

### Basic Workflow
```
1. Select Tool → 2. Select Class → 3. Draw Annotation → 4. Adjust Confidence → 5. Submit
```

### Keyboard Shortcuts
- **B** - Switch to Bounding Box tool
- **P** - Switch to Polygon tool
- **L** - Switch to Polyline tool
- **O** - Switch to Point tool
- **M** - Switch to Mask tool
- **Enter** - Finish polyline
- **Escape** - Cancel current drawing

---

## 🔧 For Developers

### Import
```typescript
import { MultiToolAnnotator } from '@/components/ObjectDetection';
```

### Basic Usage
```typescript
<MultiToolAnnotator
  imageUrl="https://example.com/image.jpg"
  classes={['car', 'person', 'building']}
  existingAnnotation={annotation}
  onAnnotationChange={(annotation) => setAnnotation(annotation)}
/>
```

### Advanced Configuration
```typescript
<MultiToolAnnotator
  imageUrl={imageUrl}
  classes={classes}
  existingAnnotation={annotation}
  onAnnotationChange={handleChange}
  allowedTypes={['bbox', 'polygon', 'point']}  // Restrict available tools
  defaultTool="polygon"                         // Start with polygon tool
/>
```

### Data Structure
```typescript
interface ObjectDetectionAnnotation {
  annotations: AnnotationShape[];  // All annotation types
  image_url: string;
  notes?: string;
  bounding_boxes?: BoundingBox[];  // Legacy compatibility
}

type AnnotationShape = BoundingBox | Polygon | Polyline | PointAnnotation | SegmentationMask;
```

---

## 📊 For Project Managers

### Task Configuration
```json
{
  "category": "object_detection",
  "task_data": {
    "image_url": "https://example.com/image.jpg",
    "classes": ["car", "person", "building"],
    "annotation_types": ["bbox", "polygon", "point"],
    "default_annotation_type": "bbox"
  }
}
```

### When to Use Each Tool

| Tool | Best For | Example Use Cases |
|------|----------|-------------------|
| **Bounding Box** | Simple rectangular objects | Cars, faces, documents |
| **Polygon** | Irregular shapes | Buildings, land parcels, organs |
| **Polyline** | Edges and paths | Roads, boundaries, trajectories |
| **Point** | Specific locations | Landmarks, keypoints, GPS pins |
| **Mask** | Pixel-level precision | Semantic segmentation, medical imaging |

---

## ⚡ Quick Examples

### Example 1: Self-Driving Car
**Tools**: Bounding Box + Polyline
```
- Bbox: Vehicles, pedestrians, traffic signs
- Polyline: Lane markings, road edges
```

### Example 2: Real Estate
**Tools**: Polygon + Point
```
- Polygon: Building footprints, property boundaries
- Point: Property entrances, utilities
```

### Example 3: Medical Imaging
**Tools**: Polygon + Point + Mask
```
- Polygon: Organ boundaries
- Point: Anatomical landmarks
- Mask: Tumor segmentation
```

### Example 4: Document Analysis
**Tools**: Bounding Box + Polygon
```
- Bbox: Tables, images, text blocks
- Polygon: Rotated text regions
```

---

## 🐛 Troubleshooting

### Polygon won't close
- Click within 3% of first point (visual indicator appears)
- Make sure you have at least 3 points

### Polyline won't complete
- Press **Enter** key to finish
- Minimum 2 points required

### Can't draw annotations
- Ensure a class label is selected
- Check if image loaded successfully

### Tool not working
- Check `allowedTypes` prop includes the tool
- Verify tool is properly activated (highlighted in UI)

---

## 📈 Performance Tips

1. **Simplification**: Polygons auto-simplify using Douglas-Peucker (reduces points by 30-50%)
2. **Rendering**: Uses percentage-based coordinates (scale-independent)
3. **Selection**: Optimized point-in-polygon and line-distance algorithms
4. **Storage**: RLE compression for masks reduces file size by 80-90%

---

## ✅ Validation Rules

### Submission Requirements
- ✅ At least 1 annotation must be created
- ✅ Each annotation must have a label
- ✅ Polygons must have ≥ 3 points
- ✅ Polylines must have ≥ 2 points
- ✅ Bounding boxes must be > 1% of image size

### Auto-Validation
- Invalid drawings are prevented (too small, too few points)
- User gets immediate feedback
- Submit button validation ensures quality

---

**Need help?** Check `MULTI_TOOL_ANNOTATION_GUIDE.md` for comprehensive documentation.
