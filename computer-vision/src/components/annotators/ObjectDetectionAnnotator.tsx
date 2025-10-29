import { useRef, useState } from 'react';
import type { BoundingBox, ObjectDetectionResult, ObjectDetectionSchema } from '../../types/tasks';
import { createId } from '../../utils/id';

interface ObjectDetectionAnnotatorProps {
  schema: ObjectDetectionSchema;
  value: ObjectDetectionResult;
  onChange: (value: ObjectDetectionResult) => void;
}

interface PointerPosition {
  x: number;
  y: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const ObjectDetectionAnnotator = ({
  schema,
  value,
  onChange
}: ObjectDetectionAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState(schema.labels[0] ?? '');
  const [draftBox, setDraftBox] = useState<BoundingBox | null>(null);

  const updateBoxes = (boxes: BoundingBox[]) =>
    onChange({
      kind: 'object_detection',
      payload: { boxes }
    });

  const getRelativePointer = (event: React.PointerEvent<HTMLDivElement>): PointerPosition | null => {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return null;
    return {
      x: clamp01((event.clientX - bounds.left) / bounds.width),
      y: clamp01((event.clientY - bounds.top) / bounds.height)
    };
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!selectedLabel) return;
    const start = getRelativePointer(event);
    if (!start) return;
    const id = createId();
    setDraftBox({
      id,
      label: selectedLabel,
      x: start.x,
      y: start.y,
      width: 0,
      height: 0
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftBox) return;
    const current = getRelativePointer(event);
    if (!current) return;

    const x = Math.min(draftBox.x, current.x);
    const y = Math.min(draftBox.y, current.y);
    const width = Math.abs(current.x - draftBox.x);
    const height = Math.abs(current.y - draftBox.y);

    setDraftBox({ ...draftBox, x, y, width, height });
  };

  const handlePointerUp = () => {
    if (!draftBox) return;
    if (draftBox.width * draftBox.height < 0.001) {
      setDraftBox(null);
      return;
    }
    updateBoxes([...value.payload.boxes, draftBox]);
    setDraftBox(null);
  };

  const removeBox = (id: string) =>
    updateBoxes(value.payload.boxes.filter((box) => box.id !== id));

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={schema.image}
            alt="Detection subject"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0">
            {value.payload.boxes.map((box) => (
              <div
                key={box.id}
                className="absolute border-2 border-ls-primary/80 bg-ls-primary/10 text-xs font-semibold uppercase tracking-wide text-white"
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.width * 100}%`,
                  height: `${box.height * 100}%`,
                  pointerEvents: 'none'
                }}
              >
                <span className="absolute -top-6 left-0 rounded-full bg-ls-primary px-2 py-0.5 shadow">
                  {box.label}
                </span>
              </div>
            ))}
            {draftBox && (
              <div
                className="absolute border-2 border-dashed border-white/70 bg-white/10"
                style={{
                  left: `${draftBox.x * 100}%`,
                  top: `${draftBox.y * 100}%`,
                  width: `${draftBox.width * 100}%`,
                  height: `${draftBox.height * 100}%`,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Click and drag to draw a bounding box. Choose a label before starting a new annotation.
        </p>
      </div>

      <div className="flex flex-col gap-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Labels
          </h2>
          <div className="flex flex-wrap gap-2">
            {schema.labels.map((label) => {
              const selected = selectedLabel === label;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSelectedLabel(label)}
                  className={`rounded-full px-3 py-1.5 text-sm transition ${
                    selected ? 'bg-ls-primary text-white shadow' : 'bg-white/10 text-slate-200'
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
            Annotations
          </h2>
          {value.payload.boxes.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No boxes yet. Start annotating by dragging on the image.
            </p>
          ) : (
            <ul className="space-y-3">
              {value.payload.boxes.map((box) => (
                <li
                  key={box.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200"
                >
                  <div>
                    <p className="font-semibold text-white">{box.label}</p>
                    <p className="text-xs text-slate-400">
                      x:{box.x.toFixed(2)} y:{box.y.toFixed(2)} w:{box.width.toFixed(2)} h:
                      {box.height.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-slate-300 transition hover:border-red-500/60 hover:text-red-200"
                    onClick={() => removeBox(box.id)}
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
