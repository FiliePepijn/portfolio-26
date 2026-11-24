import { useState } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CHAPTERS } from './chapters'

gsap.registerPlugin(ScrollTrigger, useGSAP)

/** Staggers each chapter's copy in and reports which chapter holds the middle of the screen. */
export function useChapterScroll(enabled = true) {
  const [active, setActive] = useState(CHAPTERS[0].id)

  useGSAP(() => {
    if (!enabled) return
    CHAPTERS.forEach(({ id }) => {
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => self.isActive && setActive(id),
      })
    })

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      gsap.utils.toArray<HTMLElement>('.chapter__copy').forEach((copy) => {
        gsap.from(copy.children, {
          y: 48,
          opacity: 0,
          duration: 0.9,
          stagger: 0.09,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: copy.closest('section'),
            start: 'top 65%',
            end: 'bottom 35%',
            toggleActions: 'play reverse play reverse',
          },
        })
      })
    })
  })

  return active
}
