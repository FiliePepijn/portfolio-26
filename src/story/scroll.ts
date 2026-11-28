import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTERS } from './chapters'

gsap.registerPlugin(ScrollTrigger)

/**
 * Turns the page scroll into one continuous chapter position: 2.5 is halfway between
 * chapter 2 and 3. Each gap between two section centres is its own scrubbed tween.
 */
export function createScrollStory(still: boolean) {
  const gaps = CHAPTERS.slice(1).map(() => ({ value: 0 }))
  const context = gsap.context(() => {
    gaps.forEach((gap, i) => {
      // GSAP turns the scroll between two sections into a number from 0 to 1.
      gsap.to(gap, {
        value: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: `#${CHAPTERS[i].id}`,
          start: 'center center',
          endTrigger: `#${CHAPTERS[i + 1].id}`,
          end: 'center center',
          scrub: still ? true : 0.8,
          invalidateOnRefresh: true,
        },
      })
    })
  })
  // Late fonts and images move the sections, so measure again whenever the page grows.
  let pending = 0
  const observer = new ResizeObserver(() => {
    window.clearTimeout(pending)
    pending = window.setTimeout(() => ScrollTrigger.refresh(), 150)
  })
  observer.observe(document.body)

  return {
    // Add the finished gaps to find which pair of sections we are between.
    position: () => gaps.reduce((sum, gap) => sum + gap.value, 0),
    dispose() {
      window.clearTimeout(pending)
      observer.disconnect()
      context.revert()
    },
  }
}
