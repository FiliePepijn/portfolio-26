import { useEffect, useRef, useState } from 'react'

/** The one fixed canvas behind the page. The engine is loaded separately so text paints first. */
export default function StoryCanvas() {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    import('./engine')
      .then(({ startStory }) => startStory(host.current!, controller.signal))
      .catch((error) => {
        console.error('[story] 3D unavailable', error)
        setFailed(true)
      })
    return () => controller.abort()
  }, [])

  return <div ref={host} aria-hidden="true" className={`story-canvas ${failed ? 'story-canvas--off' : ''}`} />
}
