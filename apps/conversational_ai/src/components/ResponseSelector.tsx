import { useEffect, useState } from 'react'

interface DialogueTurn {
  speaker: string
  text: string
}

interface ResponseSelectorProps {
  dialogue: DialogueTurn[]
  options: string[]
  onChange: (result: { selectedIndex: number | null; selectedText: string | null }) => void
}

export function ResponseSelector({ dialogue, options, onChange }: ResponseSelectorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  useEffect(() => {
    setSelectedIndex(null)
  }, [dialogue, options])

  useEffect(() => {
    const selectedText = selectedIndex != null ? options[selectedIndex] ?? null : null
    onChange({ selectedIndex, selectedText })
  }, [selectedIndex, options, onChange])

  return (
    <div className="annotator annotator--single">
      <div className="annotator__canvas">
        <h3>Select the best response</h3>
        <p className="annotator__prompt">
          Read the dialogue context, then choose the assistant response that fits best.
        </p>
        <div className="dialogue-list">
          {dialogue.map((turn, index) => (
            <section key={`${turn.speaker}-${index}`} className="dialogue-turn">
              <header>
                <span className="dialogue-turn__speaker">{turn.speaker}</span>
              </header>
              <p className="dialogue-turn__text">{turn.text}</p>
            </section>
          ))}
        </div>
        <div className="response-options">
          {options.map((option, index) => (
            <label key={index} className="response-options__item">
              <input
                type="radio"
                name="response"
                value={index}
                checked={selectedIndex === index}
                onChange={() => setSelectedIndex(index)}
              />
              <span className="response-options__label">{String.fromCharCode(65 + index)}</span>
              <span className="response-options__text">{option}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}

