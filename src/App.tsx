import { lazy, Suspense, type ReactNode } from 'react'
import ContactForm from './components/ContactForm'
import StoryCanvas from './gl/StoryCanvas'
import { CHAPTERS } from './story/chapters'
import { OWN_APPS, PROJECTS, SOCIALS, type Project } from './story/content'
import { useChapterScroll } from './story/useChapterScroll'

// Only used to capture the social image; keeps its React Three Fiber code out of the page bundle.
const OGPreview = lazy(() => import('./components/OGPreview'))

function Chapter({ id, side = 'left', project = false, children }: { id: string; side?: 'left' | 'right' | 'center'; project?: boolean; children: ReactNode }) {
  return (
    <section id={id} className={`chapter chapter--${side} chapter--tall ${project ? 'chapter--project' : ''}`}>
      <div className="chapter__stage">
        <div className="chapter__copy">{children}</div>
      </div>
    </section>
  )
}

const Label = ({ children }: { children: ReactNode }) => (
  <p className="mb-4 font-brutalist-mono text-[11px] uppercase tracking-[0.24em] text-[#FF7A00] md:text-xs">{children}</p>
)

const HEADLINE = 'font-clash font-bold uppercase leading-[0.95]'

function ProjectCard({ project, label }: { project: Project; label: string }) {
  return (
    <article className="border-2 border-[#FF7A00] bg-[#121212]/90 p-5 shadow-[10px_10px_0px_0px_rgba(255,122,0,0.15)] md:p-8">
      <Label>{label}</Label>
      <h2 className={`${HEADLINE} text-[clamp(2rem,4.2vw,4.25rem)]`}>{project.title}</h2>
      {project.status && (
        <a href="#contact" className="mt-4 inline-flex items-center gap-2 border border-dashed border-[#FF7A00] px-3 py-1.5 font-brutalist-mono text-[10px] uppercase tracking-widest text-[#FF7A00] transition-colors hover:bg-[#FF7A00] hover:text-[#121212] md:text-[11px]">
          <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
          {project.status}
        </a>
      )}
      <p className="mt-4 text-sm leading-relaxed text-white/75 md:text-base lg:text-lg">{project.desc}</p>
      <dl className="mt-5 border-t border-white/15 font-brutalist-mono text-[10px] uppercase md:text-[11px]">
        {project.facts.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-5 border-b border-white/15 py-2">
            <dt className="shrink-0 text-white/50">{label}</dt>
            <dd className="text-right text-[#FF7A00]">{value}</dd>
          </div>
        ))}
      </dl>
      <ul className="mt-5 flex flex-wrap gap-3 empty:hidden">
        {project.links.map((link, n) => (
          <li key={link.url}>
            <a href={link.url} target="_blank" rel="noopener noreferrer" className={`inline-block border-2 border-[#FF7A00] px-4 py-2.5 font-clash text-sm font-bold uppercase transition-colors md:text-base ${n === 0 ? 'bg-[#FF7A00] text-[#121212] hover:border-white hover:bg-white' : 'text-[#FF7A00] hover:bg-[#FF7A00] hover:text-[#121212]'}`}>{link.label} ↗</a>
          </li>
        ))}
      </ul>
    </article>
  )
}

function App() {
  const isOGPreview = new URLSearchParams(window.location.search).get('preview') === 'og'
  const active = useChapterScroll(!isOGPreview)

  if (isOGPreview) return <Suspense fallback={null}><OGPreview /></Suspense>

  return (
    <div className="story font-satoshi text-white selection:bg-[#FF7A00] selection:text-[#121212]">
      <StoryCanvas />

      <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-4 py-4 font-brutalist-mono text-[10px] uppercase tracking-[0.2em] md:px-8">
        <a href="#signal" className="text-[#FF7A00]">Latour, P.</a>
        <a href="#contact" className="border border-[#FF7A00] bg-[#121212]/70 px-3 py-2 text-[#FF7A00] transition-colors hover:bg-[#FF7A00] hover:text-[#121212]">Contact</a>
      </header>

      <nav className="fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 lg:flex" aria-label="Story chapters">
        {CHAPTERS.map((chapter, i) => {
          const current = active === chapter.id
          return (
            <a key={chapter.id} href={`#${chapter.id}`} aria-current={current ? 'location' : undefined}
              className={`group flex items-center justify-end gap-3 py-0.5 font-brutalist-mono text-[9px] uppercase tracking-widest transition-colors hover:text-[#FF7A00] ${current ? 'text-[#FF7A00]' : 'text-white/45'}`}>
              <span className={`transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${current ? 'opacity-100' : 'opacity-0'}`}>{String(i).padStart(2, '0')} / {chapter.label}</span>
              <span className={`h-2 border border-[#FF7A00]/60 transition-all ${current ? 'w-6 bg-[#FF7A00]' : 'w-2'}`} />
            </a>
          )
        })}
      </nav>

      <main className="relative z-10">
        <Chapter id="signal">
          <h1 className="font-clash font-bold uppercase leading-[0.85] text-[#FF7A00] text-[clamp(3.5rem,10.5vw,11.5rem)]">Pepijn</h1>
          <p className="mt-4 inline-block -rotate-1 bg-[#FF7A00] px-4 py-1.5 text-base font-black uppercase text-[#121212] shadow-[4px_4px_0px_0px_white] md:text-lg xl:text-2xl">UX/UI Designer &amp; Web-Developer</p>
          <p className="mt-7 max-w-xl border-l-4 border-[#FF7A00] pl-4 text-base font-bold uppercase leading-[1.15] text-white/80 md:text-xl">Reducing noise in digital systems. Designing for clarity, attention, and human intent</p>
          <dl className="mt-7 grid max-w-md grid-cols-[auto_1fr] gap-x-6 gap-y-1 font-brutalist-mono text-[10px] uppercase md:text-[11px]">
            <dt className="text-white/45">Subject_ID</dt><dd className="text-[#FF7A00]">Latour, P.</dd>
            <dt className="text-white/45">Location</dt><dd className="text-[#FF7A00]">Helmond</dd>
            <dt className="text-white/45">Status</dt><dd className="text-[#FF7A00]">Identified</dd>
          </dl>
          <p className="mt-8 animate-pulse font-brutalist-mono text-[10px] uppercase tracking-[0.3em] text-white/50">Scroll to decode ↓</p>
        </Chapter>

        <Chapter id="noise" side="center">
          <Label>01 // Reduce the noise</Label>
          <h2 className={`${HEADLINE} text-[clamp(3rem,10vw,9rem)]`}>Less friction.<br /><span className="text-[#FF7A00]">More signal.</span></h2>
          <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/75 md:text-xl">Good digital work makes the next step feel obvious. I look for the clutter, hesitation, and hidden complexity that get in the way.</p>
        </Chapter>

        <Chapter id="clarity">
          <Label>02 // Find the structure</Label>
          <h2 className={`${HEADLINE} text-[clamp(2.25rem,4.4vw,4.75rem)]`}>Complexity in.<br /><span className="text-[#FF7A00]">Clarity out.</span></h2>
          <ol className="mt-8 max-w-sm border-t border-white/15 font-brutalist-mono text-xs uppercase">
            {[['Input', 'Complexity'], ['Process', 'Question / Edit / Build'], ['Output', 'Clarity']].map(([k, v]) => (
              <li key={k} className="flex justify-between gap-6 border-b border-white/15 py-3"><span className="text-white/45">{k}</span><span className="text-[#FF7A00]">{v}</span></li>
            ))}
          </ol>
        </Chapter>

        {PROJECTS.map((project, i) => (
          <Chapter key={project.id} id={project.id} side={i % 2 === 0 ? 'right' : 'left'} project>
            <ProjectCard project={project} label={`03.${i + 1} // Selected work · ${project.category}`} />
          </Chapter>
        ))}

        <Chapter id="people">
          <Label>04 // Make it matter</Label>
          <h2 className={`${HEADLINE} text-[clamp(2.25rem,5.2vw,5.5rem)]`}>The best interface leaves room for <span className="text-[#FF7A00]">people.</span></h2>
          <p className="mt-6 font-brutalist-mono text-xs uppercase tracking-[0.2em] text-white/60">My own projects ↓</p>
        </Chapter>

        {OWN_APPS.map((app, i) => (
          <Chapter key={app.id} id={app.id} side={i % 2 === 0 ? 'right' : 'left'} project>
            <ProjectCard project={app} label={`04.${i + 1} // ${app.credit ?? 'Built by me'} · ${app.category}`} />
          </Chapter>
        ))}

        <section id="contact" className="chapter chapter--contact">
          <div className="w-full"><ContactForm /></div>
        </section>

        <footer id="latour" className="chapter chapter--footer text-[#FF7A00]">
          <h2 className="sr-only">Pepijn Latour</h2>
          <div className="mx-auto flex w-full max-w-[1400px] flex-col justify-between gap-8 px-6 pb-10 md:flex-row md:items-end">
            <ul className="flex flex-wrap gap-6 font-brutalist-mono text-xs uppercase">
              {SOCIALS.map((s) => (
                <li key={s.name}><a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[#FF7A00] underline-offset-8 transition-colors hover:text-white">{s.name}</a></li>
              ))}
            </ul>
            <p className="font-brutalist-mono text-[10px] uppercase leading-5 text-white/45 md:text-right">© Pepijn_Latour_Est_2026<br />Built_on_the_grid</p>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
