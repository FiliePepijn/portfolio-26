import StoryCanvas from '../gl/StoryCanvas'

/**
 * The social share image, rendered at 1200x630 and captured to public/og-image.jpg
 * (`bun run capture-og` with the dev server running). It uses the live particle scene,
 * so the image matches the opening chapter of the site.
 */
export default function OGPreview() {
  return (
    <div className="story relative h-[630px] w-[1200px] overflow-hidden font-satoshi text-white">
      <StoryCanvas />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-14 pt-10 font-brutalist-mono text-[15px] uppercase tracking-[0.24em] text-[#FF7A00]">
        <span>Latour, P. // 00 Signal</span>
        <span className="border border-[#FF7A00] px-3 py-1.5">platour.net</span>
      </div>

      <div className="absolute left-14 top-[118px] z-10 w-[640px]">
        <h1 className="font-clash text-[176px] font-bold uppercase leading-[0.85] text-[#FF7A00]">Pepijn</h1>
        <p className="mt-5 inline-block -rotate-1 bg-[#FF7A00] whitespace-nowrap px-5 py-2 text-[30px] font-black uppercase text-[#121212] shadow-[5px_5px_0px_0px_white]">
          UX/UI Designer &amp; Web-Developer
        </p>
        <p className="mt-8 border-l-4 border-[#FF7A00] pl-5 text-[28px] font-bold uppercase leading-[1.12] text-white/85">
          Reducing noise in digital systems.<br />Designing for human intent.
        </p>
      </div>

      <dl className="absolute bottom-10 left-14 z-10 flex gap-10 font-brutalist-mono text-[15px] uppercase">
        {[['Subject_ID', 'Latour, P.'], ['Location', 'Helmond'], ['Status', 'Identified']].map(([k, v]) => (
          <div key={k} className="flex gap-3">
            <dt className="text-white/50">{k}</dt>
            <dd className="text-[#FF7A00]">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
