import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useEmblaCarousel from 'embla-carousel-react'

const PROJECTS = [
  { id: 1, title: 'SiteSculpt', category: 'WEB/UX', img: '/images/SiteSculpt.png', desc: 'A high-performance design engine for scalable web architectures.' },
  { id: 2, title: 'Salve Mundi', category: 'COMMUNITY', img: '/images/Salvemundi.svg', desc: 'Centralized portal for the Salve Mundi academic community.' },
  
]

export default function Projects() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'start', skipSnaps: false })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  
  const selectedProject = PROJECTS.find(p => p.id === selectedId)

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev()
  const scrollNext = () => emblaApi && emblaApi.scrollNext()

  useEffect(() => {
    if (selectedId !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }, [selectedId])

  return (
    <section className="py-[10vh] px-6 max-w-[1400px] mx-auto overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-end mb-[5vh] border-b-4 border-[#FF7A00] pb-4">
        <div>
          <h2 style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }} className="font-clash tracking-tighter font-bold leading-[0.8] uppercase  text-[#FF7A00]">Selected_Works</h2>
          <p className="font-satoshi-mono text-[0.8rem] md:text-[1.1rem] uppercase opacity-60 mt-2">FILTER://VISUAL_ARCHIVE_2026</p>
        </div>
        <div className="flex gap-3 mb-2">
          <button onClick={scrollPrev} className="w-[3.5rem] h-[3.5rem] border-2 border-[#FF7A00] flex items-center justify-center text-[#FF7A00] text-2xl font-clash tracking-tighter font-bold hover:bg-[#FF7A00] hover:text-[#121212] transition-colors">&lt;</button>
          <button onClick={scrollNext} className="w-[3.5rem] h-[3.5rem] border-2 border-[#FF7A00] flex items-center justify-center text-[#FF7A00] text-2xl font-clash tracking-tighter font-bold hover:bg-[#FF7A00] hover:text-[#121212] transition-colors">&gt;</button>
        </div>
      </div>

      <div className="embla overflow-hidden" ref={emblaRef}>
        <div className="embla__container flex gap-5">
          {PROJECTS.map((project) => (
            <div key={project.id} className="embla__slide flex-[0_0_280px] md:flex-[0_0_420px]">
              <motion.div 
                whileHover={{ y: -8 }} 
                onClick={() => setSelectedId(project.id)}
                className="group cursor-pointer border-2 border-white/10 bg-[#121212] p-0 relative overflow-hidden flex flex-col h-[60vh] min-h-[400px] max-h-[600px] transition-colors hover:border-[#FF7A00]"
              >
                <div className="absolute inset-0 z-0 opacity-40 group-hover:opacity-60 transition-opacity grayscale overflow-hidden">
                  <img src={project.img} alt={project.title} className="w-full h-full object-fill scale-110 group-hover:scale-100 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-[#121212]/80 mix-blend-multiply" />
                </div>
                <div style={{ fontSize: 'clamp(4rem, 10vw, 8rem)' }} className="font-clash tracking-tighter font-bold leading-[0.8] text-white/10 absolute top-4 left-4 z-10">0{project.id}</div>
                <div className="p-8 relative z-20 flex-1 flex flex-col justify-end">
                  <span className="text-[0.7rem] font-satoshi-mono text-[#FF7A00] mb-1 block uppercase tracking-[0.2em] bg-[#121212]/80 self-start px-2 py-1">[{project.category}]</span>
                  <h3 
                    style={{ 
                      fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                      transform: 'scaleX(0.8)',
                      transformOrigin: 'left'
                    }} 
                    className="font-clash tracking-tighter font-bold leading-[0.8] uppercase mb-6 break-words group-hover:text-[#FF7A00] transition-colors drop-shadow-2xl"
                  >
                    {project.title}
                  </h3>
                </div>
                <div className="p-8 border-t-2 border-white/10 flex justify-between items-center group-hover:border-[#FF7A00] transition-colors relative z-20 bg-[#121212]/60 backdrop-blur-md">
                  <div className="font-clash tracking-tighter font-bold text-[1.5rem] group-hover:translate-x-3 transition-transform">OPEN_ARCHIVE &gt;</div>
                  <div className="w-5 h-5 rounded-full bg-[#FF7A00] shadow-[0_0_15px_#FF7A00]" />
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedId && selectedProject && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-[#121212] flex flex-col"
          >
            <div className="absolute inset-0 bg-grid-lines opacity-10" />
            <header className="p-6 md:p-8 flex justify-between items-center border-b-2 border-white/10 z-10 text-white">
              <div className="font-satoshi-mono text-xs text-[#FF7A00]">PROJECT_DECRYPT // {selectedProject.title}</div>
              <button 
                onClick={() => setSelectedId(null)}
                className="text-4xl md:text-6xl font-clash tracking-tighter font-bold text-[#FF7A00] hover:text-white transition-colors"
              >
                [CLOSE_X]
              </button>
            </header>
            
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 p-8 md:p-12 gap-8 md:gap-12 overflow-y-auto z-10 text-white">
              <div className="flex flex-col justify-center z-20">
                <span className="text-[#FF7A00] font-clash tracking-tighter font-bold text-2xl md:text-4xl mb-4">0{selectedProject.id}</span>
                <h2 
                  style={{ 
                    fontSize: 'clamp(3rem, 10vw, 8rem)',
                    transform: 'scaleX(0.8)',
                    transformOrigin: 'left'
                  }} 
                  className="font-clash tracking-tighter font-bold leading-[0.8] text-white uppercase mb-8 "
                >
                  {selectedProject.title}
                </h2>
                <div className="space-y-4 max-w-xl">
                   <p className="text-xl md:text-3xl font-bold uppercase text-[#FF7A00]">System Summary:</p>
                   <p className="text-lg md:text-2xl font-bold opacity-80 uppercase leading-tight">{selectedProject.desc}</p>
                </div>
                
                <div className="mt-8 md:mt-12 grid grid-cols-2 gap-6 md:gap-8 font-satoshi-mono text-xs opacity-60">
                  <div>[DATE]: 2026.05.14</div>
                  <div>[LOC]: AMSTERDAM_LABS</div>
                  <div>[VER]: 0.9.2_BETA</div>
                  <div>[PERM]: PUBLIC_ACCESS</div>
                </div>
              </div>
              <div className="relative border-2 md:border-4 border-[#FF7A00] overflow-hidden group min-h-[300px] lg:min-h-full z-10">
                <img src={selectedProject.img} className="w-full h-full object-cover" alt="" />
                {/* <div className="absolute inset-0 flex items-center justify-center font-clash tracking-tighter font-bold text-4xl opacity-30 rotate-[-15deg] group-hover:opacity-100 transition-opacity">IMAGE_NOT_AVAILABLE</div> */}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
