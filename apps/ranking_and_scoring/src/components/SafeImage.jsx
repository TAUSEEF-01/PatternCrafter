import { useEffect, useMemo, useState } from 'react'

const FALLBACK_SVG =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'>" +
  "<rect width='400' height='300' fill='%23f1f5f9'/>" +
  "<g>" +
  "<path d='M60 220 H340' stroke='%23cbd5f5' stroke-width='4' stroke-linecap='round'/>" +
  "<circle cx='145' cy='155' r='48' fill='none' stroke='%23cbd5f5' stroke-width='6'/>" +
  "<circle cx='145' cy='155' r='8' fill='%237885a6'/>" +
  "<path d='M220 190 Q250 140 300 180 T360 170' fill='none' stroke='%23cbd5f5' stroke-width='6' stroke-linecap='round'/>" +
  "</g>" +
  "<text x='50%' y='84%' text-anchor='middle' font-family='Arial, Helvetica, sans-serif' font-size='20' fill='%237885a6'>Image unavailable</text>" +
  "</svg>"

export function SafeImage({ src, alt, fallbackSrc, onError, ...props }) {
  const fallback = useMemo(() => fallbackSrc || FALLBACK_SVG, [fallbackSrc])
  const [source, setSource] = useState(src || fallback)

  useEffect(() => {
    if (src) {
      setSource(src)
      return
    }
    setSource(fallback)
  }, [src, fallback])

  const handleError = (event) => {
    if (source === fallback) {
      return
    }

    setSource(fallback)
    if (typeof onError === 'function') {
      onError(event)
    }
  }

  return <img src={source || fallback} alt={alt} onError={handleError} {...props} />
}
