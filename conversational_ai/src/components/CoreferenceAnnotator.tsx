import { useEffect, useMemo, useState } from 'react'
import { LabelPalette, type LabelDefinition } from './LabelPalette'
import { TokenBoard, type TokenAnnotationState } from './TokenBoard'
import { tokenizeText } from '../utils/tokenize'

const CORE_LABELS: LabelDefinition[] = [
  { id: 'noun', name: 'Noun', color: '#dc2626' },
  { id: 'pronoun', name: 'Pronoun', color: '#f97316' },
]

export interface CoreferenceResultItem {
  token: string
  index: number
  label: string | null
}

export interface CoreferenceAnnotatorProps {
  text: string
  onChange: (result: CoreferenceResultItem[]) => void
}

export function CoreferenceAnnotator({ text, onChange }: CoreferenceAnnotatorProps) {
  const tokens = useMemo(() => tokenizeText(text), [text])
  const [activeLabelId, setActiveLabelId] = useState<string | null>(CORE_LABELS[0]?.id ?? null)
  const [annotations, setAnnotations] = useState<TokenAnnotationState>({})

  const labelLookup = useMemo(() => {
    return CORE_LABELS.reduce<Record<string, LabelDefinition>>((acc, label) => {
      acc[label.id] = label
      return acc
    }, {})
  }, [])

  useEffect(() => {
    const result = tokens.map<CoreferenceResultItem>((token, index) => ({
      token,
      index,
      label: annotations[index] ?? null,
    }))
    onChange(result)
  }, [annotations, tokens, onChange])

  useEffect(() => {
    // Reset annotations when the text changes
    setAnnotations({})
  }, [text])

  return (
    <div className="annotator">
      <div className="annotator__sidebar">
        <LabelPalette
          labels={CORE_LABELS}
          selectedLabelId={activeLabelId}
          onSelect={setActiveLabelId}
        />
        <p className="annotator__note">
          Tip: select a label, then click words to categorize nouns versus pronouns. Click again to
          remove a label.
        </p>
      </div>
      <div className="annotator__canvas">
        <h3>Coreference Resolution</h3>
        <p className="annotator__prompt">
          Identify references between nouns and pronouns within the passage.
        </p>
        <TokenBoard
          tokens={tokens}
          annotations={annotations}
          activeLabelId={activeLabelId}
          labels={labelLookup}
          onUpdate={setAnnotations}
        />
      </div>
    </div>
  )
}

