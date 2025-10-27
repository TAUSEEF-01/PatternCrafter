import { useEffect, useState } from 'react'

interface DialogueTurn {
  speaker: string
  text: string
}

interface ResponseGeneratorProps {
  dialogue: DialogueTurn[]
  onChange: (result: { response: string }) => void
}

export function ResponseGenerator({ dialogue, onChange }: ResponseGeneratorProps) {
  const [response, setResponse] = useState('')

  useEffect(() => {
    setResponse('')
  }, [dialogue])

  useEffect(() => {
    onChange({ response })
  }, [response, onChange])

  return (
    <div className="annotator annotator--single">
      <div className="annotator__canvas">
        <h3>Craft the next response</h3>
        <p className="annotator__prompt">
          Review the dialogue and compose the assistant&apos;s next message in your own words.
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
        <label className="response-input">
          <span>Assistant response</span>
          <textarea
            value={response}
            rows={6}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="Type the response here..."
          />
          <span className="response-input__count">{response.length} characters</span>
        </label>
      </div>
    </div>
  )
}

