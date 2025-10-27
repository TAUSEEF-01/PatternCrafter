import clsx from 'clsx'

export interface LabelDefinition {
  id: string
  name: string
  color: string
}

interface LabelPaletteProps {
  labels: LabelDefinition[]
  selectedLabelId: string | null
  onSelect: (id: string | null) => void
}

export function LabelPalette({ labels, selectedLabelId, onSelect }: LabelPaletteProps) {
  return (
    <div className="label-palette">
      <p className="label-palette__title">Label palette</p>
      <div className="label-palette__buttons">
        {labels.map((label) => (
          <button
            key={label.id}
            type="button"
            className={clsx('label-chip', { 'label-chip--active': selectedLabelId === label.id })}
            style={{
              borderColor: label.color,
              background: selectedLabelId === label.id ? label.color : 'transparent',
              color: selectedLabelId === label.id ? '#fff' : label.color,
            }}
            onClick={() => onSelect(selectedLabelId === label.id ? null : label.id)}
          >
            {label.name}
          </button>
        ))}
      </div>
      <button type="button" className="btn btn--ghost btn--compact" onClick={() => onSelect(null)}>
        Clear selection
      </button>
    </div>
  )
}

