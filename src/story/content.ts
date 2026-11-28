export interface Project {
  id: string
  title: string
  category: string
  /** Replaces "Built by me", for example for team work. */
  credit?: string
  /** A status badge that links to the contact form. */
  status?: string
  desc: string
  /** Short facts, taken from the project's own site or repository. */
  facts: [label: string, value: string][]
  /** The first link is the main button. */
  links: { label: string; url: string }[]
}

// These cards appear before the People section. Their ids match chapters in chapters.ts.
export const PROJECTS: Project[] = [
  {
    id: 'superlocal',
    title: 'Superlocal Crawlers',
    category: 'Creative / Interactive',
    desc: 'An installation at Dutch Design Week that makes AI data scraping visible. Students crawl through the exhibitions scanning what they encounter, and everything collected ends up in SUPERLOCAL: a tiny supermarket where the digital wares can be browsed.',
    facts: [
      ['Where', 'Dutch Design Week 2026, Eindhoven'],
      ['Collected', '1,000+ entries: objects and signage'],
      ['Crawlers', '50+ people feeding the archive'],
    ],
    links: [
      { label: 'Visit the market', url: 'https://superlocal.discount' },
      { label: 'Follow the crawlers', url: 'https://crawlers.superlocal.discount' },
    ],
  },
  {
    id: 'xkill',
    title: 'XKill',
    category: 'Mobile game',
    credit: 'Built as a duo',
    desc: 'A real-life game of tag on your phone. Every player gets a role: hunter or target. As the target you have to get away; once a hunter is close enough, Bluetooth proximity lets them shoot or kill you.',
    facts: [
      ['Context', 'Fontys case, made as a duo'],
      ['Our work', 'UX, design and development'],
      ['Stack', 'Flutter, Bluetooth proximity'],
    ],
    links: [],
  },
  {
    id: 'beatbox',
    title: 'BeatBox Soundlab',
    category: 'Logo design',
    desc: 'Logo design for BeatBox Soundlab, the sound recording studio in the Fontys R10 building. In this mark a soundwave and a single sweeping line frame the name.',
    facts: [
      ['Work', 'Logo design'],
      ['Studio', 'Sound recording, Fontys R10'],
      ['Explored', 'Three directions, several colourways'],
    ],
    links: [],
  },
]

/** Own and team-built apps, shown after the People chapter. */
export const OWN_APPS: Project[] = [
  {
    id: 'wiewanneer',
    title: 'WieWanneer',
    category: 'Group scheduling',
    status: 'In development · open for feedback',
    desc: 'Finding a date with a group, without the endless chat. Propose a few moments, let everyone vote yes, no or maybe, and confirm the one that works. Connected Google and Microsoft calendars flag clashes.',
    facts: [
      ['Platforms', 'Web, plus an iOS and Android app'],
      ['Stack', 'Next.js, Expo, Prisma, PostgreSQL'],
      ['Extra', 'AI-ranked suggestion for the best time'],
    ],
    links: [
      { label: 'Visit WieWanneer', url: 'https://wiewanneer.com' },
      { label: 'Open the app', url: 'https://app.wiewanneer.com' },
    ],
  },
  {
    id: 'sitesculpt',
    title: 'SiteSculpt',
    category: 'Web / UX',
    desc: 'Handcrafted websites built from scratch, without templates. Each one is designed around the business and its audience, and written as custom code so it stays fast.',
    facts: [
      ['Approach', 'Custom design, no templates'],
      ['Stack', 'Next.js, React, Tailwind CSS, GSAP'],
      ['Client work', 'Life of Light, spiritual coaching'],
    ],
    links: [{ label: 'See Life of Light', url: 'https://lifeoflight.nl' }],
  },
  {
    id: 'archerstats',
    title: 'ArcherStats',
    category: 'Sport / Data',
    desc: 'Statistics for archery. Record shooting sessions and rounds, look back through your history and stats, and join ranges and competitions.',
    facts: [
      ['Tracks', 'Sessions, rounds and arrows'],
      ['Stack', 'Next.js, Cloudflare Workers, D1'],
      ['Also', 'Competitions and range devices'],
    ],
    links: [{ label: 'Open ArcherStats', url: 'https://archery.platour.net' }],
  }

]

/** Shown in the Clarity chapter. */
export const SKILLS: [group: string, items: string[]][] = [
  ['Frontend', ['Next.js', 'React', 'Vue', 'TypeScript', 'Tailwind CSS', 'Vite', 'Bun']],
  ['Design', ['Figma', 'Adobe Creative Cloud', 'Blender']],
  ['3D / Motion', ['Three.js', 'WebGPU', 'TSL', 'GSAP']],
  ['Backend', ['PostgreSQL', 'Prisma', 'Cloudflare Workers', 'D1']],
  ['Mobile', ['Expo', 'Flutter']],
  ['AI', ['Claude']],
]

export const SOCIALS = [
  { name: 'GitHub', url: 'https://github.com/FiliePepijn' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com/in/pepijn-latour-a70055276/' },
  { name: 'Instagram', url: 'https://www.instagram.com/pepijn_latour/' },
  { name: 'Spotify', url: 'https://open.spotify.com/user/31lnbagl6q4eogohjrry5y57dyce?si=5a0dc02a9cd54f6a' },
]
