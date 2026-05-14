import { useRef } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function SplitText({ children, className = '', style, stagger = 0.03, trigger }: { children: string, className?: string, style?: React.CSSProperties, stagger?: number, trigger?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chars = children.split('')

  useGSAP(() => {
    const el = containerRef.current
    if (!el) return
    const charElements = el.querySelectorAll('.char')
    
    gsap.from(charElements, {
      y: '140%',
      opacity: 0,
      rotateX: -65,
      scale: 0.85,
      duration: 1.45,
      stagger: stagger,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: trigger || el,
        start: 'top 90%',
        toggleActions: 'play none none none'
      }
    })
  }, { scope: containerRef })

  return (
    <div ref={containerRef} className={`flex flex-wrap ${className}`} style={{ perspective: '1000px', ...style }}>
      {chars.map((char, i) => (
        <span 
          key={i} 
          className="char inline-block origin-top"
          style={{ whiteSpace: char === ' ' ? 'pre' : 'normal' }}
        >
          {char}
        </span>
      ))}
    </div>
  )
}
