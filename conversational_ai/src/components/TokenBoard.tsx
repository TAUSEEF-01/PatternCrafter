import clsx from 'clsx'
import type { LabelDefinition } from './LabelPalette'

export type TokenAnnotationState = Record<number, string | null>

interface TokenBoardProps {
  tokens: string[]
  annotations: TokenAnnotationState
  activeLabelId: string | null
  labels: Record<string, LabelDefinition>
  onUpdate: (next: TokenAnnotationState) => void
  heading?: string
}

export function TokenBoard({
  tokens,
  annotations,
  activeLabelId,
  labels,
  onUpdate,
  heading,
}: TokenBoardProps) {
  const handleClick = (index: number) => {
    const current = annotations[index] ?? null
    const nextState: TokenAnnotationState = { ...annotations }
    if (!activeLabelId) {
      delete nextState[index]
    } else if (current === activeLabelId) {
      delete nextState[index]
    } else {
      nextState[index] = activeLabelId
    }
    onUpdate(nextState)
  }

  return (
    <div className="token-board">
      {heading ? <p className="token-board__heading">{heading}</p> : null}
      <div className="token-board__tokens">
        {tokens.map((token, index) => {
          const labelId = annotations[index]
          const label = labelId ? labels[labelId] : undefined
          return (
            <button
              type="button"
              key={`${token}-${index}`}
              className={clsx('token-board__token', {
                'token-board__token--active': Boolean(label),
              })}
              style={
                label
                  ? {
                      background: label.color,
                      borderColor: label.color,
                      color: '#fff',
                    }
                  : undefined
              }
              onClick={() => handleClick(index)}
            >
              {token}
            </button>
          )
        })}
      </div>
    </div>
  )
}

