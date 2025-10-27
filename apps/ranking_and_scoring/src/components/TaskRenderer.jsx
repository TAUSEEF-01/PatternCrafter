import { useMemo } from 'react'
import { useLabelingContext } from '../context/LabelingContext'
import { SafeImage } from './SafeImage'

export function TaskRenderer({ template }) {
  const { selections, updateSelection } = useLabelingContext()
  const currentSelection = selections[template.id]?.payload

  const renderer = useMemo(() => {
    switch (template.id) {
      case 'asr-hypothesis':
        return (
          <AsrHypothesisTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'content-based-image-search':
        return (
          <ContentImageTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'document-retrieval':
        return (
          <DocumentRetrievalTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'pairwise-classification':
        return (
          <PairwiseClassificationTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'pairwise-regression':
        return (
          <PairwiseRegressionTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'serp-ranking':
        return (
          <SerpRankingTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      case 'text-to-image':
        return (
          <TextToImageTask
            template={template}
            selection={currentSelection}
            onChange={(payload) => updateSelection(template.id, payload)}
          />
        )
      default:
        return <p>Unknown template type.</p>
    }
  }, [template, currentSelection, updateSelection])

  return <div className="task-renderer">{renderer}</div>
}

function AsrHypothesisTask({ template, selection, onChange }) {
  const selectedValue = selection?.transcription ?? ''
  return (
    <div className="task-card">
      <audio controls className="task-audio" src={template.data.audio}>
        Your browser does not support the audio element.
      </audio>
      <div className="task-options task-options--vertical" role="radiogroup" aria-label="Select ASR hypothesis">
        {template.data.transcriptions.map((item, index) => {
          const id = `${template.id}-${index}`
          const isChecked = selectedValue === item
          return (
            <label key={id} className={`option-card${isChecked ? ' is-selected' : ''}`} htmlFor={id}>
              <input
                id={id}
                type="radio"
                name="asr-transcription"
                value={item}
                checked={isChecked}
                onChange={() => onChange({ transcription: item })}
              />
              <span className="option-index">{String.fromCharCode(65 + index)}</span>
              <span>{item}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

function ContentImageTask({ template, selection, onChange }) {
  const selectedOptions = selection?.images ?? []

  const toggleOption = (id) => {
    const nextSelection = selectedOptions.includes(id)
      ? selectedOptions.filter((item) => item !== id)
      : [...selectedOptions, id]
    onChange({ images: nextSelection })
  }

  return (
    <div className="task-card">
      <div className="image-query">
        <p className="image-query__label">Query image</p>
        <SafeImage src={template.data.query} alt="Query" />
      </div>
      <div className="task-options task-options--grid" role="group" aria-label="Select matching images">
        {template.data.options.map((option) => {
          const isChecked = selectedOptions.includes(option.id)
          return (
            <button
              type="button"
              key={option.id}
              onClick={() => toggleOption(option.id)}
              className={`image-card${isChecked ? ' is-selected' : ''}`}
              aria-pressed={isChecked}
            >
              <SafeImage src={option.src} alt={option.label} />
              <span className="image-card__label">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DocumentRetrievalTask({ template, selection, onChange }) {
  const selectedDocs = selection?.documents ?? []

  const toggleDoc = (index) => {
    const nextSelection = selectedDocs.includes(index)
      ? selectedDocs.filter((item) => item !== index)
      : [...selectedDocs, index]
    onChange({ documents: nextSelection })
  }

  return (
    <div className="task-card task-card--stacked">
      <div className="task-card__query-block">
        <h3>Query</h3>
        <p>{template.data.query}</p>
      </div>
      <div className="task-options task-options--vertical" role="group" aria-label="Select relevant documents">
        {template.data.documents.map((doc, index) => {
          const isChecked = selectedDocs.includes(index)
          return (
            <button
              type="button"
              key={index}
              onClick={() => toggleDoc(index)}
              className={`document-card${isChecked ? ' is-selected' : ''}`}
              aria-pressed={isChecked}
            >
              <span className="document-card__tag">Document {index + 1}</span>
              <span>{doc}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PairwiseClassificationTask({ template, selection, onChange }) {
  const selectedSide = selection?.selected ?? ''

  const select = (side) => {
    onChange({ selected: side })
  }

  return (
    <div className="task-card task-card--pairwise">
      <button
        type="button"
        className={`pairwise-card${selectedSide === 'left' ? ' is-selected' : ''}`}
        onClick={() => select('left')}
        aria-pressed={selectedSide === 'left'}
      >
        <span className="pairwise-card__badge">Option A</span>
        <p>{template.data.left}</p>
      </button>
      <div className="pairwise-divider">
        <span>VS</span>
      </div>
      <button
        type="button"
        className={`pairwise-card${selectedSide === 'right' ? ' is-selected' : ''}`}
        onClick={() => select('right')}
        aria-pressed={selectedSide === 'right'}
      >
        <span className="pairwise-card__badge">Option B</span>
        <p>{template.data.right}</p>
      </button>
    </div>
  )
}

function PairwiseRegressionTask({ template, selection, onChange }) {
  const rating = selection?.rating ?? 0

  return (
    <div className="task-card task-card--stacked">
      <div className="task-options task-options--grid">
        <figure className="pairwise-image">
          <SafeImage src={template.data.image1} alt="Candidate A" />
          <figcaption>Candidate A</figcaption>
        </figure>
        <figure className="pairwise-image">
          <SafeImage src={template.data.image2} alt="Candidate B" />
          <figcaption>Candidate B</figcaption>
        </figure>
      </div>
      <label className="range-control">
        <span>How similar are these items?</span>
        <input
          type="range"
          min="0"
          max="5"
          step="1"
          value={rating}
          onChange={(event) => onChange({ rating: Number(event.target.value) })}
        />
        <div className="range-control__labels">
          <span>Not similar</span>
          <strong>{rating}</strong>
          <span>Identical</span>
        </div>
      </label>
    </div>
  )
}

function SerpRankingTask({ template, selection, onChange }) {
  const payload = selection ?? {
    choices: [],
    rating: 0,
    confidence: '',
  }

  const toggleChoice = (value) => {
    const nextChoices = payload.choices.includes(value)
      ? payload.choices.filter((item) => item !== value)
      : [...payload.choices, value]
    onChange({ ...payload, choices: nextChoices })
  }

  const renderOption = (option) => {
    const isChecked = payload.choices.includes(option.value)
    return (
      <div key={option.value} className={`serp-card${isChecked ? ' is-selected' : ''}`}>
        <button type="button" className="serp-card__toggle" onClick={() => toggleChoice(option.value)}>
          <span className="checkbox" aria-hidden="true">
            {isChecked ? '[x]' : '[ ]'}
          </span>
          <span
            className="serp-card__content"
            dangerouslySetInnerHTML={{ __html: option.html }}
          />
        </button>
        {option.children?.length ? (
          <div className="serp-card__children">
            {option.children.map((child) => renderOption(child))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div className="task-card task-card--stacked">
      <div className="serp-query">
        <span className="serp-query__label">Search query</span>
        <p>{template.data.query}</p>
      </div>
      <div className="serp-results">{template.data.options.map((option) => renderOption(option))}</div>
      <div className="serp-feedback">
        <label className="range-control">
          <span>Search quality</span>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={payload.rating ?? 0}
            onChange={(event) => onChange({ ...payload, rating: Number(event.target.value) })}
          />
          <div className="range-control__labels">
            <span>Poor</span>
            <strong>{payload.rating ?? 0}</strong>
            <span>Excellent</span>
          </div>
        </label>
        <div className="confidence-toggle">
          <span>Labeling confidence</span>
          <div className="confidence-toggle__group">
            {['Low', 'High'].map((level) => {
              const isActive = payload.confidence === level
              return (
                <button
                  key={level}
                  type="button"
                  className={`confidence-toggle__btn${isActive ? ' is-selected' : ''}`}
                  onClick={() => onChange({ ...payload, confidence: level })}
                >
                  {level}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function TextToImageTask({ template, selection, onChange }) {
  const selectedImages = selection?.images ?? []

  const toggle = (value) => {
    const nextSelection = selectedImages.includes(value)
      ? selectedImages.filter((item) => item !== value)
      : [...selectedImages, value]
    onChange({ images: nextSelection })
  }

  return (
    <div className="task-card">
      <div className="text-to-image__prompt">
        <h3>Prompt</h3>
        <p>{template.data.prompt}</p>
      </div>
      <div className="task-options task-options--grid text-to-image__grid">
        {template.data.images.map((image) => {
          const isChecked = selectedImages.includes(image.value)
          return (
            <button
              key={image.value}
              type="button"
              className={`image-card${isChecked ? ' is-selected' : ''}`}
              onClick={() => toggle(image.value)}
              aria-pressed={isChecked}
            >
              <SafeImage src={image.src} alt={image.label} loading="lazy" />
              <span className="image-card__label">{image.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
