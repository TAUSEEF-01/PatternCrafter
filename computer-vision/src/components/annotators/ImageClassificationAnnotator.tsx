import type { ImageClassificationResult, ImageClassificationSchema } from '../../types/tasks';

interface ImageClassificationAnnotatorProps {
  schema: ImageClassificationSchema;
  value: ImageClassificationResult;
  onChange: (value: ImageClassificationResult) => void;
}

export const ImageClassificationAnnotator = ({
  schema,
  value,
  onChange
}: ImageClassificationAnnotatorProps) => {
  const toggleSelection = (choice: string) => {
    const selections = new Set(value.payload.selections);
    if (schema.multiple) {
      selections.has(choice) ? selections.delete(choice) : selections.add(choice);
      onChange({
        kind: 'image_classification',
        payload: { selections: Array.from(selections) }
      });
    } else {
      onChange({
        kind: 'image_classification',
        payload: { selections: [choice] }
      });
    }
  };

  const isSelected = (choice: string) => value.payload.selections.includes(choice);

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg">
        <img
          src={schema.image}
          alt="Classification subject"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-inner">
        <header className="space-y-2">
          <h2 className="text-xl font-semibold text-white">Choose matching labels</h2>
          <p className="text-sm text-slate-300">
            {schema.multiple ? 'Multiple selections allowed' : 'Select a single option'}
          </p>
        </header>
        <div className="flex flex-col gap-3">
          {schema.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => toggleSelection(choice)}
              className={`group flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                isSelected(choice)
                  ? 'border-ls-primary/70 bg-ls-primary/20 shadow-lg shadow-ls-primary/20'
                  : 'border-white/10 bg-white/[0.03] hover:border-ls-primary/40 hover:bg-ls-primary/10'
              }`}
            >
              <span className="text-base font-medium text-white">{choice}</span>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full border transition ${
                  isSelected(choice)
                    ? 'border-transparent bg-ls-primary text-white'
                    : 'border-white/20 text-transparent'
                }`}
              >
                ✓
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
