import { useEffect, useRef, useState } from 'react'
import { loader } from '../story/loader'

// Start downloading the engine as soon as the page script runs, not after React's first render.
const engine = import('./engine')

/** The one fixed canvas behind the page. The engine is loaded separately so text paints first. */
export default function StoryCanvas() {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    engine
      .then(({ startStory }) => startStory(host.current!, controller.signal, (value, label) => {
        loader.progress(value, label)
        if (value >= 1) loader.done()
      }))
      .catch((error) => {
        console.error('[story] 3D unavailable', error)
        setFailed(true)
        loader.done()
      })
    return () => controller.abort()
  }, [])

  return <div ref={host} aria-hidden="true" className={`story-canvas ${failed ? 'story-canvas--off' : ''}`} />
}
