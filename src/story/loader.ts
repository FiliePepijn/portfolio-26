/** Bridge to the loading screen in index.html, which paints before any script arrives. */
interface StoryLoader {
  progress(value: number, label?: string): void
  done(): void
}

declare global {
  interface Window { __storyLoader?: StoryLoader }
}

export const loader: StoryLoader = {
  progress: (value, label) => window.__storyLoader?.progress(value, label),
  done: () => window.__storyLoader?.done(),
}
