import { useId } from 'react';
import type { ImageCaptioningResult, ImageCaptioningSchema } from '../../types/tasks';

interface ImageCaptioningAnnotatorProps {
  schema: ImageCaptioningSchema;
  value: ImageCaptioningResult;
  onChange: (value: ImageCaptioningResult) => void;
}

export const ImageCaptioningAnnotator = ({
  schema,
  value,
  onChange
}: ImageCaptioningAnnotatorProps) => {
  const textAreaId = useId();

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg">
        <img
          src={schema.image}
          alt="Task subject"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-inner">
        <header>
          <h2 className="text-2xl font-semibold text-white">Describe the image</h2>
          <p className="mt-2 text-sm text-slate-300">{schema.prompt}</p>
        </header>
        <label className="flex flex-1 flex-col gap-3" htmlFor={textAreaId}>
          <span className="text-sm font-semibold uppercase tracking-widest text-slate-400">
            Caption
          </span>
          <textarea
            id={textAreaId}
            className="min-h-[220px] flex-1 resize-none rounded-2xl border border-white/10 bg-slate-950/70 p-5 text-base text-white outline-none ring-2 ring-transparent transition focus:border-ls-primary/60 focus:ring-ls-primary/40"
            placeholder="Enter description here..."
            value={value.payload.caption}
            onChange={(event) =>
              onChange({
                kind: 'image_captioning',
                payload: { caption: event.target.value }
              })
            }
          />
        </label>
      </div>
    </div>
  );
};
