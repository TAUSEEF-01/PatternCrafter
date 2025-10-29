import { useRef, useState } from 'react';
import type { OcrRegion, OpticalCharacterRecognitionResult, OpticalCharacterRecognitionSchema } from '../../types/tasks';
import { createId } from '../../utils/id';

interface OcrAnnotatorProps {
  schema: OpticalCharacterRecognitionSchema;
  value: OpticalCharacterRecognitionResult;
  onChange: (value: OpticalCharacterRecognitionResult) => void;
}

interface PointerPosition {
  x: number;
  y: number;
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const OcrAnnotator = ({ schema, value, onChange }: OcrAnnotatorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedLabel, setSelectedLabel] = useState(schema.labels[0] ?? '');
  const [draftRegion, setDraftRegion] = useState<OcrRegion | null>(null);

  const updateRegions = (regions: OcrRegion[]) =>
    onChange({
      kind: 'ocr',
      payload: { regions }
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
    setDraftRegion({
      id,
      label: selectedLabel,
      text: '',
      x: start.x,
      y: start.y,
      width: 0,
      height: 0
    });
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draftRegion) return;
    const current = getRelativePointer(event);
    if (!current) return;

    const x = Math.min(draftRegion.x, current.x);
    const y = Math.min(draftRegion.y, current.y);
    const width = Math.abs(current.x - draftRegion.x);
    const height = Math.abs(current.y - draftRegion.y);

    setDraftRegion({ ...draftRegion, x, y, width, height });
  };

  const handlePointerUp = () => {
    if (!draftRegion) return;
    if (draftRegion.width * draftRegion.height < 0.001) {
      setDraftRegion(null);
      return;
    }
    updateRegions([...value.payload.regions, draftRegion]);
    setDraftRegion(null);
  };

  const updateRegion = (id: string, changes: Partial<OcrRegion>) =>
    updateRegions(
      value.payload.regions.map((region) =>
        region.id === id ? { ...region, ...changes } : region
      )
    );

  const removeRegion = (id: string) =>
    updateRegions(value.payload.regions.filter((region) => region.id !== id));

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="flex flex-col gap-4">
        <div
          ref={containerRef}
          className="relative aspect-[8.5/11] w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-950"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={schema.image}
            alt="OCR document"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0">
            {value.payload.regions.map((region) => (
              <div
                key={region.id}
                className="absolute border border-amber-400/80 bg-amber-300/10 text-xs font-semibold uppercase tracking-wide text-amber-100"
                style={{
                  left: `${region.x * 100}%`,
                  top: `${region.y * 100}%`,
                  width: `${region.width * 100}%`,
                  height: `${region.height * 100}%`,
                  pointerEvents: 'none'
                }}
              >
                <span className="absolute -top-6 left-0 rounded-full bg-amber-400 px-2 py-0.5 text-slate-900 shadow">
                  {region.label}
                </span>
              </div>
            ))}
            {draftRegion && (
              <div
                className="absolute border border-dashed border-white/70 bg-white/10"
                style={{
                  left: `${draftRegion.x * 100}%`,
                  top: `${draftRegion.y * 100}%`,
                  width: `${draftRegion.width * 100}%`,
                  height: `${draftRegion.height * 100}%`,
                  pointerEvents: 'none'
                }}
              />
            )}
          </div>
        </div>
        <p className="text-sm text-slate-300">
          Draw regions around text snippets, then transcribe each region below. Switch labels to
          distinguish between print and handwriting.
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
                    active ? 'bg-amber-400 text-slate-900 shadow-lg' : 'bg-white/10 text-slate-200'
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
            Regions
          </h2>
          {value.payload.regions.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-4 text-sm text-slate-300">
              No text captured yet. Annotate the document by dragging a region on the preview.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {value.payload.regions.map((region) => (
                <div
                  key={region.id}
                  className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between text-sm text-slate-200">
                    <div className="flex items-center gap-2">
                      <select
                        value={region.label}
                        onChange={(event) =>
                          updateRegion(region.id, { label: event.target.value })
                        }
                        className="rounded-full border border-white/10 bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-widest text-slate-200 outline-none transition focus:border-amber-300 focus:text-amber-200"
                      >
                        {schema.labels.map((label) => (
                          <option key={label}>{label}</option>
                        ))}
                      </select>
                      <span className="text-xs text-slate-400">
                        x:{region.x.toFixed(2)} y:{region.y.toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-widest text-slate-300 transition hover:border-red-500/60 hover:text-red-200"
                      onClick={() => removeRegion(region.id)}
                    >
                      Remove
                    </button>
                  </div>
                  <textarea
                    value={region.text}
                    onChange={(event) => updateRegion(region.id, { text: event.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-slate-950/50 p-3 text-sm text-white outline-none ring-2 ring-transparent transition focus:border-amber-300 focus:ring-amber-200/50"
                    placeholder="Recognized text"
                    rows={3}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
