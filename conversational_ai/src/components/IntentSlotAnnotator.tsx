import { useEffect, useMemo, useState } from 'react'
import type { LabelDefinition } from './LabelPalette'
import { LabelPalette } from './LabelPalette'
import { TokenBoard, type TokenAnnotationState } from './TokenBoard'
import { tokenizeText } from '../utils/tokenize'

const SLOT_LABELS: LabelDefinition[] = [
  { id: 'person', name: 'Person', color: '#2563eb' },
  { id: 'organization', name: 'Organization', color: '#7c3aed' },
  { id: 'location', name: 'Location', color: '#0891b2' },
  { id: 'datetime', name: 'Datetime', color: '#ca8a04' },
  { id: 'quantity', name: 'Quantity', color: '#16a34a' },
]

const INTENT_OPTIONS = ['Greeting', 'Customer request', 'Small talk']

export interface DialogueTurn {
  speaker: string
  text: string
}

export interface IntentSlotResultTurn {
  speaker: string
  text: string
  tokens: Array<{ token: string; index: number; label: string | null }>
}

export interface IntentSlotAnnotatorResult {
  selectedIntent: string | null
  turns: IntentSlotResultTurn[]
}

interface IntentSlotAnnotatorProps {
  dialogue: DialogueTurn[]
  onChange: (result: IntentSlotAnnotatorResult) => void
}

export function IntentSlotAnnotator({ dialogue, onChange }: IntentSlotAnnotatorProps) {
  const labelLookup = useMemo(() => {
    return SLOT_LABELS.reduce<Record<string, LabelDefinition>>((acc, label) => {
      acc[label.id] = label
      return acc
    }, {})
  }, [])

  const [activeLabelId, setActiveLabelId] = useState<string | null>(SLOT_LABELS[0]?.id ?? null)
  const [intent, setIntent] = useState<string | null>(null)
  const [annotations, setAnnotations] = useState<Record<number, TokenAnnotationState>>({})

  useEffect(() => {
    // Reset when the dialogue changes (e.g., switching tasks)
    setIntent(null)
    setAnnotations({})
  }, [dialogue])

  useEffect(() => {
    const turns = dialogue.map<IntentSlotResultTurn>((turn, index) => {
      const tokens = tokenizeText(turn.text)
      const tokenAnnotations = annotations[index] ?? {}
      return {
        speaker: turn.speaker,
        text: turn.text,
        tokens: tokens.map((token, tokenIndex) => ({
          token,
          index: tokenIndex,
          label: tokenAnnotations[tokenIndex] ?? null,
        })),
      }
    })
    onChange({ selectedIntent: intent, turns })
  }, [annotations, dialogue, intent, onChange])

  const updateTurn = (turnIndex: number, state: TokenAnnotationState) => {
    setAnnotations((prev) => ({
      ...prev,
      [turnIndex]: state,
    }))
  }

  return (
    <div className="annotator annotator--two-columns">
      <div className="annotator__sidebar">
        <LabelPalette
          labels={SLOT_LABELS}
          selectedLabelId={activeLabelId}
          onSelect={setActiveLabelId}
        />
        <div className="intent-selector">
          <p>Select dialogue intent</p>
          <div className="intent-selector__options">
            {INTENT_OPTIONS.map((option) => (
              <label key={option} className="intent-selector__option">
                <input
                  type="radio"
                  name="intent"
                  value={option}
                  checked={intent === option}
                  onChange={() => setIntent(option)}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
        <p className="annotator__note">
          Tag each slot entity in the dialogue transcript. Choose the intent that best matches the
          conversation flow.
        </p>
      </div>
      <div className="annotator__canvas">
        <h3>Intent Classification &amp; Slot Filling</h3>
        <div className="dialogue-list">
          {dialogue.map((turn, index) => (
            <section key={`${turn.speaker}-${index}`} className="dialogue-turn">
              <header>
                <span className="dialogue-turn__speaker">{turn.speaker}</span>
              </header>
              <TokenBoard
                heading="Tap words within the turn to assign slot labels."
                tokens={tokenizeText(turn.text)}
                annotations={annotations[index] ?? {}}
                activeLabelId={activeLabelId}
                labels={labelLookup}
                onUpdate={(state) => updateTurn(index, state)}
              />
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}

