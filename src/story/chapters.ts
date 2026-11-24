export type ShapeName =
  | 'head' | 'noise' | 'lattice' | 'superlocal' | 'sitesculpt' | 'wiewanneer' | 'archerstats' | 'beatbox' | 'xkill' | 'wave' | 'name'

export interface Pose {
  /** Offset from screen centre, as a fraction of the visible half width / height. */
  x: number
  y: number
  scale: number
  rotX: number
  rotY: number
}

export interface Chapter {
  id: string
  label: string
  shape: ShapeName
  desktop: Pose
  mobile: Pose
  /** Idle turn amplitude in radians. */
  sway: number
  /** Constant noise force while the chapter holds. */
  turbulence: number
  /** Particle brightness. */
  glow: number
  /** Strength of the scan line. */
  scan: number
  /** Particle colour. Projects borrow the accent from their own artwork. */
  tint?: string
  /** A ripple travelling across the shape. */
  crawl?: number
}

const pose = (x: number, y: number, scale: number, rotX = 0, rotY = 0): Pose => ({ x, y, scale, rotX, rotY })

export const BRAND = '#ff7a00'

export const CHAPTERS: Chapter[] = [
  { id: 'signal', label: 'Signal', shape: 'head', desktop: pose(0.44, -0.02, 1.08), mobile: pose(0, 0.42, 0.68), sway: 0.35, turbulence: 0.015, glow: 0.85, scan: 1 },
  { id: 'noise', label: 'Noise', shape: 'noise', desktop: pose(0.1, 0, 1.15), mobile: pose(0, 0.1, 0.8), sway: 0.5, turbulence: 1, glow: 0.45, scan: 0 },
  { id: 'clarity', label: 'Clarity', shape: 'lattice', desktop: pose(0.46, 0, 0.85, 0.42, 0.7), mobile: pose(0, 0.44, 0.55, 0.42, 0.7), sway: 0.12, turbulence: 0, glow: 0.65, scan: 0.6 },
  { id: 'superlocal', label: 'Superlocal', shape: 'superlocal', desktop: pose(-0.5, 0, 0.8, 0.08, 0.28), mobile: pose(0, 0.44, 0.62, 0.08, 0.28), sway: 0.22, turbulence: 0.006, glow: 0.7, scan: 0.25, tint: '#2f66ff', crawl: 0.35 },
  { id: 'sitesculpt', label: 'SiteSculpt', shape: 'sitesculpt', desktop: pose(0.45, 0, 0.95, 0.05, -0.35), mobile: pose(0, 0.44, 0.6, 0.05, -0.35), sway: 0.45, turbulence: 0.01, glow: 0.55, scan: 0.5, tint: '#1fcf86' },
  { id: 'beatbox', label: 'BeatBox', shape: 'beatbox', desktop: pose(-0.5, 0, 0.7, 0.05, 0.3), mobile: pose(0, 0.44, 0.6, 0.05, 0.3), sway: 0.28, turbulence: 0.006, glow: 0.65, scan: 0.25, tint: '#e0482c' },
  { id: 'people', label: 'People', shape: 'head', desktop: pose(0.45, -0.02, 1.08, 0, -0.35), mobile: pose(0, 0.44, 0.68, 0, -0.35), sway: 0.3, turbulence: 0.015, glow: 0.85, scan: 0.5 },
  { id: 'wiewanneer', label: 'WieWanneer', shape: 'wiewanneer', desktop: pose(-0.5, 0, 0.78, 0.08, 0.3), mobile: pose(0, 0.44, 0.6, 0.08, 0.3), sway: 0.35, turbulence: 0.008, glow: 0.6, scan: 0.3, tint: '#818cf8' },
  { id: 'archerstats', label: 'ArcherStats', shape: 'archerstats', desktop: pose(0.48, 0, 0.8, 0.08, -0.3), mobile: pose(0, 0.44, 0.58, 0.08, -0.3), sway: 0.35, turbulence: 0.008, glow: 0.65, scan: 0.3, tint: '#76c043' },
  { id: 'xkill', label: 'XKill', shape: 'xkill', desktop: pose(-0.5, 0, 0.7, 0.05, 0.3), mobile: pose(0, 0.44, 0.6, 0.05, 0.3), sway: 0.28, turbulence: 0.005, glow: 0.6, scan: 0.25, tint: '#d9262e' },
  { id: 'contact', label: 'Contact', shape: 'wave', desktop: pose(0, -0.45, 1.25, 0.28, 0), mobile: pose(0, -0.4, 0.9, 0.28, 0), sway: 0.08, turbulence: 0.03, glow: 0.22, scan: 0 },
  { id: 'latour', label: 'Latour', shape: 'name', desktop: pose(0, 0.18, 1), mobile: pose(0, 0.22, 1), sway: 0.04, turbulence: 0.008, glow: 0.5, scan: 0.35 },
]
