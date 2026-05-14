import { useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import PointCloudHead from './components/PointCloudHead'
import Projects from './components/Projects'
import ContactForm from './components/ContactForm'
import SplitText from './components/SplitText'
import OGPreview from './components/OGPreview'

gsap.registerPlugin(ScrollTrigger, useGSAP)

function App() {
  const container = useRef<HTMLDivElement>(null)
  const [isHoveringContact, setIsHoveringContact] = useState(false)

  const isOGPreview = new URLSearchParams(window.location.search).get('preview') === 'og';

  useGSAP(() => {
    if (isOGPreview) return;
    // Header Animation
    gsap.from('.header-reveal', {
      y: -50,
      opacity: 0,
      duration: 1.5,
      stagger: 0.15,
      ease: 'power4.out'
    })
  }, { scope: container })

  if (isOGPreview) {
    return <OGPreview />;
  }

  const scrollToContact = () => {
    const el = document.getElementById('contact-section')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div ref={container} className="min-h-screen bg-[#121212] text-white font-satoshi selection:bg-[#FF7A00] selection:text-[#121212] bg-grain overflow-x-hidden">
      {/* NOISE / GRAIN OVERLAY */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-[200] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* SCANNER LINE EFFECT */}
      <div className="fixed inset-0 pointer-events-none z-[190] overflow-hidden opacity-10">
        <div className="w-full h-[2px] bg-[#FF7A00] absolute top-0 left-0 animate-scanner-line" />
      </div>

      {/* SYSTEM HERO SCREEN */}
      <section className="p-4 md:p-8 max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center">
        
        <div className="border-2 border-[#FF7A00] bg-black overflow-hidden flex flex-col shadow-[20px_20px_0px_0px_rgba(255,122,0,0.1)] rounded-sm">
          {/* TOP BAR: SYSTEM STATUS */}
          <div className="h-10 border-b-2 border-[#FF7A00]/30 bg-[#121212] flex items-center justify-between px-4">
            <div className="flex gap-2 items-center">
              <div className="w-16 md:w-24 h-2 bg-[#FF7A00]/30 rounded-full" />
              <div className="w-2.5 h-2.5 bg-[#FF7A00] rounded-full animate-pulse" />
            </div>
            <div className="flex gap-3 md:gap-6">
              <div className="w-10 md:w-16 h-1.5 bg-[#FF7A00]/20 rounded-full" />
              <div className="w-8 md:w-12 h-1.5 bg-[#FF7A00]/20 rounded-full" />
              <div className="w-6 md:w-8 h-1.5 bg-[#FF7A00]/20 rounded-full" />
            </div>
          </div>
          
          {/* MAIN BODY */}
          <div className="flex flex-col lg:grid lg:grid-cols-[1fr_400px] border-b-2 border-[#FF7A00]/30">
            {/* LEFT COLUMN: IDENTITY & BIOMETRICS */}
            <div className="flex-1 p-6 md:p-12 border-b-2 lg:border-b-0 lg:border-r-2 border-[#FF7A00]/30 flex flex-col justify-center gap-5 bg-[#121212] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none bg-grid-lines" />
              
              <div className="header-reveal relative z-10">
                  <SplitText
                    className="font-clash font-bold tracking-tighter leading-[0.8] text-[#FF7A00] uppercase text-[clamp(6rem, 20vw, 26rem)]"
                    style={{ fontSize: 'clamp(12rem, 18vw, 19rem)' }}
                  >
                    PEPIJN
                  </SplitText>
              </div>
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
                <div className="header-reveal">
                  <div className="bg-[#FF7A00] text-[#121212] px-4 py-1.5 font-satoshi font-black tracking-tighter text-xl md:text-3xl uppercase transform -rotate-1 shadow-[4px_4px_0px_0px_white]">
                    UX/UI Designer & Web-Developer
                  </div>
                </div>
                
              </div>
              
              <div className="w-full md:w-2/3 h-[1px] bg-[#FF7A00]/30 header-reveal relative z-10" />
              
              <div className="header-reveal relative z-10">
                <p className="max-w-xl text-lg md:text-2xl font-bold uppercase opacity-80 leading-[1.1] border-l-4 border-[#FF7A00] pl-6 font-satoshi">
                  REDUCING NOISE IN DIGITAL SYSTEMS. <br/>
                  DESIGNING FOR CLARITY, ATTENTION, AND HUMAN INTENT
                </p>
              </div>
            </div>
            
            {/* RIGHT COLUMN: SCAN AREA & PARAMETERS */}
            <div className="w-full flex flex-col bg-[#121212]">
              {/* SCAN INTERFACE */}
              <div className="h-[350px] md:h-[450px] border-b-2 border-[#FF7A00]/30 relative bg-black bg-grid-lines overflow-hidden">
                 <div className="absolute top-3 right-4 font-brutalist-mono text-[10px] text-[#FF7A00] z-20 bg-black/50 px-2 py-1 border border-[#FF7A00]/20 uppercase tracking-tighter">STATUS: IDENTIFIED</div>
                 <div className="absolute bottom-3 left-4 font-brutalist-mono text-[10px] text-[#FF7A00] z-20 bg-black/50 px-2 py-1 border border-[#FF7A00]/20 uppercase tracking-tighter">SCAN_RES: HIGH_DENSITY</div>
                 
                 {/* PCD Rendering */}
                 <PointCloudHead
                   isExternalTracking={isHoveringContact}
                   trackingMode={isHoveringContact ? 'contact' : 'default'}
                 />
              </div>
              
              {/* PARAMETER FEED */}
              <div className="p-8 flex flex-col gap-6 justify-center flex-1">
                <div className="space-y-3 font-brutalist-mono text-[11px] md:text-xs uppercase">
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="opacity-40">Subject_ID</span>
                    <span className="text-[#FF7A00]">Latour, P.</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="opacity-40">Location</span>
                    <span className="text-[#FF7A00]">Helmond</span>
                  </div>
                  <div className="flex justify-between border-b border-white/10 pb-2">
                    <span className="opacity-40">Data_State</span>
                    <span className="text-[#FF7A00]">SYNCHRONIZED</span>
                  </div>
                </div>
                
                <button 
                  onClick={scrollToContact}
                  onMouseEnter={() => setIsHoveringContact(true)}
                  onMouseLeave={() => setIsHoveringContact(false)}
                  className="group w-full py-4 border-2 border-[#FF7A00] text-[#FF7A00] font-clash font-bold text-2xl uppercase hover:bg-[#FF7A00] hover:text-[#121212] transition-all relative overflow-hidden shadow-[6px_6px_0px_0px_rgba(255,122,0,0.2)]"
                >
                  <span className="relative z-10">[ Contact_System ]</span>
                  <div className="absolute inset-0 bg-[#FF7A00] translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </button>
              </div>
            </div>
          </div>
          
          {/* BOTTOM BAR: LOCAL NAVIGATION */}
          <div 
            className="h-12 bg-[#121212] flex items-center px-6 gap-8 overflow-x-auto no-scrollbar"
          >
            {[
              { name: 'github', url: 'https://github.com/FiliePepijn' },
              { name: 'linkedin', url: 'https://www.linkedin.com/in/pepijn-latour-a70055276/' },
              { name: 'instagram', url: 'https://www.instagram.com/pepijn_latour/' },
              { name: 'spotify', url: 'https://open.spotify.com/user/31lnbagl6q4eogohjrry5y57dyce?si=5a0dc02a9cd54f6a' }
            ].map((social, i) => (
              <div key={social.name} className="flex items-center gap-6 flex-shrink-0">
                <a 
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-brutalist-mono text-[10px] md:text-xs text-[#FF7A00] hover:text-white transition-colors tracking-[0.2em] uppercase"
                >
                  {social.name}
                </a>
                {i < 3 && <span className="text-[#FF7A00]/20 font-bold">/</span>}
              </div>
            ))}
            <div className="ml-auto hidden md:flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
              <span className="font-brutalist-mono text-[9px] opacity-40 uppercase tracking-widest">Connection_Secure</span>
            </div>
          </div>
        </div>
      </section>


      <div className="bg-[#121212]">
        <Projects />
      </div>
      
      <div id="contact-section" className="bg-[#121212] border-t-4 border-[#FF7A00]">
        <ContactForm />
      </div>

      {/* FOOTER */}
      <footer className="bg-[#121212] text-[#FF7A00] pt-[10vh] pb-[5vh] px-6 border-t-4 border-[#FF7A00] relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between gap-8 relative z-10">
          <div className="flex-1">
            <SplitText className="font-clash font-bold tracking-tighter leading-[0.9] opacity-20 hover:opacity-100 transition-opacity cursor-default mb-6 text-[clamp(5rem, 15vw, 12rem)]">
              LATOUR
            </SplitText>
            <div className="flex gap-6 font-brutalist-mono text-[clamp(0.7rem, 1vw, 0.9rem)] uppercase">
               <a href="https://github.com/FiliePepijn" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline underline-offset-8 decoration-[#FF7A00]">GitHub</a>
               <a href="https://www.linkedin.com/in/pepijn-latour-a70055276/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline underline-offset-8 decoration-[#FF7A00]">LinkedIn</a>
               <a href="https://www.instagram.com/pepijn_latour/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors underline underline-offset-8 decoration-[#FF7A00]">Instagram</a>
            </div>
          </div>
          
          <div className="md:text-right flex flex-col justify-end min-w-[200px]">
             <div className="inline-block bg-[#FF7A00] text-[#121212] px-3 py-1 font-clash font-bold tracking-tighter text-[clamp(1rem, 2vw, 1.5rem)] uppercase mb-2 self-start md:self-end">
              V1.0.0_STABLE
            </div>
            <p className="font-brutalist-mono text-[clamp(0.5rem, 0.7vw, 0.6rem)] uppercase opacity-40">
              © PEPIJN_LATOUR_EST_2026<br />
              BUILT_ON_THE_GRID
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
