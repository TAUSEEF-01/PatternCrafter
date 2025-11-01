import { useRef, useState } from 'react';
import type {
  PolygonPoint,
  PolygonRegion,
  SemanticSegmentationResult,
  SemanticSegmentationSchema
} from '../../types/tasks';
import { createId } from '../../utils/id';

interface SemanticSegmentationAnnotatorProps {
  schema: SemanticSegmentationSchema;
  value: SemanticSegmentationResult;
  onChange: (value: SemanticSegmentationResult) => void;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const SemanticSegmentationAnnotator = ({
  schema,
  value,
  onChange
}: SemanticSegmentationAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState(schema.labels[0] ?? '');
  const [draftPoints, setDraftPoints] = useState<PolygonPoint[]>([]);

  const updatePolygons = (polygons: PolygonRegion[]) =>
    onChange({
      kind: 'semantic_segmentation',
      payload: { polygons }
    });

  const getRelativePointer = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height)
    };
  };

  const handleImageClick = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!selectedLabel) return;
    const point = getRelativePointer(event);
    if (!point) return;
    setDraftPoints((points) => [...points, point]);
  };

  const commitPolygon = () => {
    if (!selectedLabel || draftPoints.length < 3) return;
    updatePolygons([
      ...value.payload.polygons,
      { id: createId(), label: selectedLabel, points: draftPoints }
    ]);
    setDraftPoints([]);
  };

  const resetDraft = () => setDraftPoints([]);

  const removePolygon = (id: string) =>
    updatePolygons(value.payload.polygons.filter((polygon) => polygon.id !== id));

  const getPolygonColor = (label: string) => {
    const index = schema.labels.indexOf(label);
    const palette = ['#EF4444', '#22D3EE', '#A855F7', '#10B981', '#F59E0B'];
    return palette[index % palette.length];
  };

  const renderPolygon = (points: PolygonPoint[]) =>
    points.map((point) => `${point.x * 1000},${point.y * 1000}`).join(' ');

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60"
          onClick={handleImageClick}
        >
          <img
            src={schema.image}
            alt="Segmentation subject"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 1000 1000"
            preserveAspectRatio="none"
          >
            {value.payload.polygons.map((polygon) => (
              <polygon
                key={polygon.id}
                points={renderPolygon(polygon.points)}
                fill={getPolygonColor(polygon.label)}
                fillOpacity={0.3}
                stroke={getPolygonColor(polygon.label)}
                strokeWidth={3}
              />
            ))}
            {draftPoints.length > 0 && (
              <polyline
                points={renderPolygon(draftPoints)}
                fill="none"
                stroke="#FFFFFF"
                strokeOpacity={0.8}
                strokeWidth={2}
              />
            )}
          </svg>
          {draftPoints.map((point, index) => (
            <span
              key={`${point.x}-${point.y}-${index}`}
              className="pointer-events-none absolute h-3 w-3 -translate-x-1.5 -translate-y-1.5 rounded-full bg-white shadow"
              style={{
                left: `${point.x * 100}%`,
                top: `${point.y * 100}%`
              }}
            />
          ))}
        </div>
        <p className="text-sm text-slate-300">
          Click to add polygon vertices. Use &ldquo;Complete region&rdquo; to close the polygon once
          you have at least three points.
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Labels
          </h2>
          <div className="flex flex-wrap gap-2">
            {schema.labels.map((label) => {
              const active = selectedLabel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedLabel(label)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    active ? 'bg-ls-primary text-white shadow' : 'bg-white/10 text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Draft Polygon
          </h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={commitPolygon}
              className="rounded-full bg-ls-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-ls-primary/40 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-400 disabled:shadow-none"
              disabled={draftPoints.length < 3}
            >
              Complete region
            </button>
            <button
              type="button"
              onClick={resetDraft}
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-white/40 hover:text-white"
              disabled={draftPoints.length === 0}
            >
              Reset draft
            </button>
            <span className="text-xs uppercase tracking-widest text-slate-400">
              Points: {draftPoints.length}
            </span>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Regions
          </h2>
          {value.payload.polygons.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No regions yet. Start clicking on the image to create a polygon.
            </p>
          ) : (
            <ul className="space-y-3">
              {value.payload.polygons.map((polygon) => (
                <li
                  key={polygon.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <div>
                    <p className="font-semibold text-white">{polygon.label}</p>
                    <p className="text-xs text-slate-400">Points: {polygon.points.length}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-slate-300 transition hover:border-red-500/60 hover:text-red-200"
                    onClick={() => removePolygon(polygon.id)}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
