import * as THREE from 'three/webgpu'
import type { ShapeName } from '../story/chapters'

/** Files under public/images, listed at build time (see vite.config.ts). */
declare const __PUBLIC_FILES__: string[]
const PUBLIC_FILES = __PUBLIC_FILES__

/** Every shape is `count` xyzw points; some also carry an RGBA colour for each point. */
export type Shape = Float32Array & { colors?: Float32Array }

/** Small seeded generator so the cloud looks the same on every visit. */
export function mulberry(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function build(count: number, fill: (i: number, rnd: () => number, out: THREE.Vector4) => void, seed = 7): Shape {
  const rnd = mulberry(seed)
  // Pack each dot's x, y, z and brightness into four numbers for the GPU.
  const data = new Float32Array(count * 4)
  const v = new THREE.Vector4()
  for (let i = 0, o = 0; i < count; i++, o += 4) {
    v.set(0, 0, 0, rnd())
    fill(i, rnd, v)
    data[o] = v.x
    data[o + 1] = v.y
    data[o + 2] = v.z
    data[o + 3] = v.w
  }
  return data
}

// ---------------------------------------------------------------- you

/**
 * Reads the x, y, z of a PCD point cloud (ascii or binary float32). A few lines here instead of
 * three's PCDLoader, which drags the whole WebGL build of three into the engine bundle.
 */
export async function loadPCD(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: ${response.status}`)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  // The header is ascii and ends with the DATA line.
  let end = 0
  let header = ''
  for (let line = ''; end < bytes.length; end++) {
    const c = bytes[end]
    if (c !== 10) { line += String.fromCharCode(c); continue }
    header += line + '\n'
    if (line.startsWith('DATA')) { end++; break }
    line = ''
  }
  const field = (key: string) => header.match(new RegExp(`^${key} (.*)$`, 'm'))?.[1].trim().split(/\s+/) ?? []
  const fields = field('FIELDS')
  const sizes = field('SIZE').map(Number)
  const types = field('TYPE')
  const counts = field('COUNT').map(Number)
  const points = Number(field('POINTS')[0])
  const format = field('DATA')[0]
  const axes = ['x', 'y', 'z'].map((a) => fields.indexOf(a))
  if (axes.includes(-1) || !points) throw new Error(`${url}: no x y z`)
  const out = new Float32Array(points * 3)
  if (format === 'ascii') {
    const rows = new TextDecoder().decode(bytes.subarray(end)).split('\n').filter((r) => r.trim())
    for (let i = 0; i < points; i++) {
      const values = rows[i].trim().split(/\s+/)
      for (let a = 0; a < 3; a++) out[i * 3 + a] = parseFloat(values[axes[a]])
    }
  } else if (format === 'binary') {
    const offsets: number[] = []
    let stride = 0
    fields.forEach((_f, k) => { offsets.push(stride); stride += sizes[k] * (counts[k] || 1) })
    if (axes.some((k) => types[k] !== 'F' || sizes[k] !== 4)) throw new Error(`${url}: x y z are not float32`)
    const view = new DataView(buffer, end)
    for (let i = 0; i < points; i++) {
      for (let a = 0; a < 3; a++) out[i * 3 + a] = view.getFloat32(i * stride + offsets[axes[a]], true)
    }
  } else throw new Error(`${url}: unsupported PCD data "${format}"`)
  return out
}

async function headShape(count: number): Promise<Shape> {
  const geometry = new THREE.BufferGeometry()
  // The head is a real point scan. Centre and resize it before assigning dot homes.
  geometry.setAttribute('position', new THREE.BufferAttribute(await loadPCD('/PepijnPCD.pcd'), 3))
  geometry.center()
  geometry.computeBoundingBox()
  const scale = 2.2 / geometry.boundingBox!.getSize(new THREE.Vector3()).y
  const positions = geometry.attributes.position
  return build(count, (i, rnd, out) => {
    const k = i % positions.count
    // The first pass is the exact scan; extra particles thicken it with a little spread.
    const j = i < positions.count ? 0 : 0.012
    const z = positions.getZ(k) * scale
    out.set(
      positions.getX(k) * scale + (rnd() - 0.5) * j,
      positions.getY(k) * scale + (rnd() - 0.5) * j,
      z + (rnd() - 0.5) * j,
      THREE.MathUtils.clamp(0.3 + z * 0.55 + rnd() * 0.2, 0.08, 0.9),
    )
  }, 61)
}

// ---------------------------------------------------------------- project elements

/** `onload`, not `decode()`: decode can stay pending forever in a background tab. */
function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })
}

/**
 * Turns the opaque part of a project's artwork into a thick 3D slab of points,
 * with bright edges so the mark stays crisp while it turns.
 */
async function artworkShape(
  count: number, url: string, height: number, isMark: (r: number, g: number, b: number, a: number) => boolean,
  /** For multicolour marks: how bright each colour burns, so the parts stay distinct. */
  weight?: (r: number, g: number, b: number) => number,
  /** Keep only this share of the artwork's width, from the left. */
  crop = 1,
): Promise<Shape> {
  const image = await loadImage(url)
  const scale = 900 / Math.max(image.naturalWidth, image.naturalHeight)
  const w = Math.round(image.naturalWidth * scale)
  const h = Math.round(image.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  // Draw the PNG or SVG on a hidden canvas so we can read its pixels.
  ctx.drawImage(image, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  const solid = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= w * crop || y >= h) return false
    const i = (y * w + x) * 4
    return isMark(data[i], data[i + 1], data[i + 2], data[i + 3])
  }
  const face: number[] = []
  const edge: number[] = []
  const box = new THREE.Box2()
  const p = new THREE.Vector2()
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!solid(x, y)) continue
      box.expandByPoint(p.set(x, y))
      const border = !solid(x - 3, y) || !solid(x + 3, y) || !solid(x, y - 3) || !solid(x, y + 3)
      ;(border ? edge : face).push(y * w + x)
    }
  }
  if (!face.length || !edge.length) throw new Error(`no mark found in ${url}`)
  const centre = box.getCenter(new THREE.Vector2())
  const size = box.getSize(new THREE.Vector2())
  const unit = Math.min(height / size.y, (height * 1.45) / size.x)
  const depth = 0.24
  return build(count, (_i, rnd, out) => {
    const kind = rnd()
    const list = kind < 0.42 ? edge : face
    // Pick a visible pixel as this dot's home in the logo or image.
    const pixel = list[Math.floor(rnd() * list.length)]
    const x = ((pixel % w) + rnd() - 0.5 - centre.x) * unit
    const y = (centre.y - Math.floor(pixel / w) + rnd() - 0.5) * unit
    if (weight) {
      const c = pixel * 4
      const w0 = weight(data[c], data[c + 1], data[c + 2])
      const front = kind < 0.16 || (kind >= 0.42 && kind < 0.9)
      const z = front ? depth / 2 : kind < 0.42 ? (rnd() - 0.5) * depth : -depth / 2
      out.set(x, y, z, w0 * (front ? 0.9 + rnd() * 0.1 : 0.3))
      return
    }
    // Edges: front rim, back rim and the walls between them. Faces: mostly the front.
    if (kind < 0.16) out.set(x, y, depth / 2, 0.95)
    else if (kind < 0.24) out.set(x, y, -depth / 2, 0.45)
    else if (kind < 0.42) out.set(x, y, (rnd() - 0.5) * depth, 0.2 + rnd() * 0.2)
    else if (kind < 0.88) out.set(x, y, depth / 2, 0.3 + rnd() * 0.25)
    else out.set(x, y, -depth / 2, 0.08 + rnd() * 0.15)
  }, 71)
}

/** A drawing of the Superlocal logo: hand-cut blue tiles, one letter on each. */
async function drawSuperlocal(ctx: CanvasRenderingContext2D) {
  const font = '700 100px "Clash Display"'
  await document.fonts.load(font, 'SUPERLOCAL').catch(() => [])
  // letter, centre x, centre y, width, height, tilt in degrees
  const tiles: [string, number, number, number, number, number][] = [
    ['S', 80, 92, 54, 66, -9], ['u', 132, 96, 48, 62, 4], ['P', 186, 84, 58, 76, -4], ['E', 240, 90, 48, 62, 6], ['R', 289, 88, 48, 64, -3],
    ['L', 82, 164, 52, 66, 5], ['O', 135, 161, 50, 62, -6], ['C', 186, 164, 50, 60, 3], ['A', 238, 160, 52, 66, -5], ['l', 290, 166, 46, 70, 8],
  ]
  ctx.save()
  ctx.scale(ctx.canvas.width / 360, ctx.canvas.height / 260)
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (const [letter, x, y, w, h, tilt] of tiles) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((tilt * Math.PI) / 180)
    ctx.fillStyle = '#1b4bd8'
    ctx.beginPath()
    // Uneven corners, as if cut with scissors.
    ctx.moveTo(-w / 2, -h / 2 + 2)
    ctx.lineTo(w / 2 - 3, -h / 2)
    ctx.lineTo(w / 2, h / 2 - 3)
    ctx.lineTo(-w / 2 + 3, h / 2)
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = `700 ${h * 0.82}px "Clash Display"`
    if (letter === 'l') {
      // The logo's last letter is a looping handwritten l.
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-12, 8)
      ctx.bezierCurveTo(4, 2, 14, -22, 3, -22)
      ctx.bezierCurveTo(-9, -22, -8, 8, -2, 18)
      ctx.bezierCurveTo(2, 25, 10, 22, 14, 15)
      ctx.stroke()
    } else ctx.fillText(letter, 0, 3, w * 0.8)
    ctx.restore()
  }
  ctx.restore()
}

/**
 * The Superlocal logo as particles: tiles in blue, letters in white and a touch forward.
 * Uses /images/superlocal-logo.png when that file exists, and the drawing above when it doesn't.
 */
async function superlocalShape(count: number): Promise<Shape> {
  const canvas = document.createElement('canvas')
  canvas.width = 900
  canvas.height = 650
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const original = PUBLIC_FILES.includes('images/superlocal-logo.png')
    ? await loadImage('/images/superlocal-logo.png').catch(() => null)
    : null
  // Use the supplied logo when available; otherwise draw the same mark in code.
  if (original) {
    const fitted = Math.min(canvas.width / original.naturalWidth, canvas.height / original.naturalHeight)
    ctx.drawImage(original, 0, 0, original.naturalWidth * fitted, original.naturalHeight * fitted)
  } else await drawSuperlocal(ctx)

  const w = canvas.width
  const h = canvas.height
  const { data } = ctx.getImageData(0, 0, w, h)
  // 1 = blue tile, 0 = white or transparent.
  const blue = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) blue[i] = data[i * 4 + 3] > 128 && data[i * 4 + 2] > 110 && data[i * 4] < 150 ? 1 : 0
  // Flood the white around the logo; any white left over is a letter.
  const outside = new Uint8Array(w * h)
  const queue = [0]
  outside[0] = 1
  while (queue.length) {
    const i = queue.pop()!
    const x = i % w
    for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (n < 0 || n >= w * h || outside[n] || blue[n]) continue
      outside[n] = 1
      queue.push(n)
    }
  }
  const tiles: number[] = []
  const letters: number[] = []
  const box = new THREE.Box2()
  const p = new THREE.Vector2()
  for (let i = 0; i < w * h; i++) {
    if (outside[i]) continue
    ;(blue[i] ? tiles : letters).push(i)
    box.expandByPoint(p.set(i % w, Math.floor(i / w)))
  }
  if (!tiles.length || !letters.length) throw new Error('no logo found')
  const centre = box.getCenter(new THREE.Vector2())
  const unit = 2.5 / box.getSize(new THREE.Vector2()).x
  return build(count, (_i, rnd, out) => {
    const isLetter = rnd() < 0.34
    const list = isLetter ? letters : tiles
    const pixel = list[Math.floor(rnd() * list.length)]
    const x = ((pixel % w) + rnd() - 0.5 - centre.x) * unit
    const y = (centre.y - Math.floor(pixel / w) + rnd() - 0.5) * unit
    if (isLetter) out.set(x, y, 0.14, 0.9 + rnd() * 0.1)
    else out.set(x, y, rnd() < 0.8 ? 0.06 : -0.08 - rnd() * 0.06, 0.4 + rnd() * 0.22)
  }, 83)
}

// ---------------------------------------------------------------- procedural

function noiseShape(count: number) {
  // This chapter deliberately gives dots scattered homes instead of a logo outline.
  return build(count, (_i, rnd, out) => {
    const u = rnd() * 2 - 1
    const a = rnd() * Math.PI * 2
    const r = 0.3 + Math.pow(rnd(), 0.55) * 2.4
    const s = Math.sqrt(1 - u * u)
    out.set(Math.cos(a) * s * r * 1.5, u * r * 0.85, Math.sin(a) * s * r * 0.8, rnd() * 0.8)
  }, 23)
}

/** Expertise logos scattered in fixed, irregular spots with their SVG colours. */
async function expertiseShape(count: number): Promise<Shape> {
  const size = 256
  const fit = 224
  const logos = [
    { url: '/images/ExpertiseCloudflare.svg', ratio: 1 },
    { url: '/images/ExpertiseFlutter.svg', ratio: 1, paleBackground: true },
    { url: '/images/ExpertiseVite.svg', ratio: 23 / 14 },
    { url: '/images/ExpertiseVue.svg', ratio: 261.76 / 226.69 },
    { url: '/images/ExpertiseNext.svg', ratio: 1 },
    { url: '/images/ExpertiseReact.svg', ratio: 1 },
    { url: '/images/ExpertiseTailwind.svg', ratio: 1 },
    { url: '/images/ExpertiseFigma.svg', ratio: 1 },
    { url: '/images/ExpertiseAdobe.svg', ratio: 1 },
    { url: '/images/ExpertiseBlender.svg', ratio: 1 },
    { url: '/images/ExpertiseClaude.svg', ratio: 1 },
    { url: '/images/ExpertiseBun.svg', ratio: 1 },
  ]
  // These were picked with a fixed random seed and spaced apart so the logos do not overlap.
  const homes = [
    [-0.272, 0.302], [-0.918, -0.636], [-0.896, 0.395], [0.412, -0.596],
    [0.091, -0.086], [-0.222, 0.814], [1.117, -0.159], [-0.367, -0.486],
    [0.373, 0.551], [-0.968, -0.123], [1.018, 0.536], [0.591, 0.005],
  ] as const
  const masks = await Promise.all(logos.map(async ({ url, ratio, paleBackground }) => {
    const image = await loadImage(url)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!
    const width = ratio > 1 ? fit : fit * ratio
    const height = ratio > 1 ? fit / ratio : fit
    ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height)
    const { data } = ctx.getImageData(0, 0, size, size)
    const pixels: number[] = []
    for (let i = 0; i < size * size; i++) {
      const offset = i * 4
      const r = data[offset]
      const g = data[offset + 1]
      const b = data[offset + 2]
      const a = data[offset + 3]
      // The Flutter file has a pale square behind its symbol; keep only the symbol.
      const background = paleBackground && r > 205 && g > 205 && b > 205 && Math.max(r, g, b) - Math.min(r, g, b) < 20
      if (a > 96 && !background) pixels.push(i)
    }
    if (!pixels.length) throw new Error(`no mark found in ${url}`)
    return { pixels, data }
  }))

  const colors = new Float32Array(count * 4)
  const linear = (value: number) => {
    const channel = value / 255
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  }
  const shape = build(count, (i, rnd, out) => {
    const logo = i % masks.length
    const { pixels, data } = masks[logo]
    const pixel = pixels[Math.floor(rnd() * pixels.length)]
    const [homeX, homeY] = homes[logo]
    const x = ((pixel % size + rnd()) / size - 0.5) * 0.46 + homeX
    const y = (0.5 - (Math.floor(pixel / size) + rnd()) / size) * 0.46 + homeY
    out.set(x, y, (rnd() - 0.5) * 0.1, 0.45 + rnd() * 0.25)
    const source = pixel * 4
    const target = i * 4
    colors[target] = linear(data[source])
    colors[target + 1] = linear(data[source + 1])
    colors[target + 2] = linear(data[source + 2])
    colors[target + 3] = 1
  }, 31)
  shape.colors = colors
  return shape
}

function waveShape(count: number) {
  const cols = Math.ceil(Math.sqrt(count * 2.2))
  const rows = Math.ceil(count / cols)
  return build(count, (i, rnd, out) => {
    const x = ((i % cols) / (cols - 1) - 0.5) * 6.5
    const z = (Math.floor(i / cols) / (rows - 1) - 0.5) * 3
    const y = Math.sin(x * 1.7 + z * 0.8) * 0.14 + Math.cos(z * 2.6 - x * 0.6) * 0.1
    out.set(x, y, z, 0.15 + Math.max(0, y) * 2.5 + rnd() * 0.15)
  }, 41)
}

async function nameShape(count: number): Promise<Shape> {
  const font = '700 300px "Clash Display"'
  await document.fonts.load(font, 'PEPIJN LATOUR').catch(() => [])
  // Draw the name as pixels, then sample those pixels just like project artwork.
  const canvas = document.createElement('canvas')
  canvas.width = 1400
  canvas.height = 700
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.fillText('PEPIJN', canvas.width / 2, 205, canvas.width - 20)
  ctx.fillText('LATOUR', canvas.width / 2, 495, canvas.width - 20)
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const filled: number[] = []
  for (let i = 3; i < data.length; i += 4) if (data[i] > 128) filled.push((i - 3) / 4)
  if (!filled.length) return noiseShape(count)
  const scale = 3.4 / canvas.width
  return build(count, (_i, rnd, out) => {
    const px = filled[Math.floor(rnd() * filled.length)]
    const x = (px % canvas.width) + rnd() - canvas.width / 2
    const y = canvas.height / 2 - Math.floor(px / canvas.width) - rnd()
    out.set(x * scale, y * scale, (rnd() - 0.5) * 0.12, 0.2 + rnd() * 0.5)
  }, 53)
}

// ---------------------------------------------------------------- loading

const SHAPES: Record<ShapeName, (count: number) => Shape | Promise<Shape>> = {
  head: headShape,
  noise: noiseShape,
  expertise: expertiseShape,
  superlocal: superlocalShape,
  sitesculpt: (n) => artworkShape(n, '/images/SiteSculpt.png', 2, (r, g, _b, a) => a > 128 && r < 120 && g > 40),
  // The app icon: bright and dim day tiles around the chosen column. Its dark backdrop is dropped.
  wiewanneer: (n) => artworkShape(n, '/images/WieWanneer.svg', 1.9,
    (r, g, b) => Math.max(r, g, b) > 45,
    (r, _g, b) => (r > 200 ? 0.92 : b > 200 ? 0.62 : 0.22)),
  // The target and arrow from the logo; the wordmark to its right is cropped away.
  archerstats: (n) => artworkShape(n, '/images/ArcherStats.svg', 1.9,
    (r, g, b) => Math.max(r, g, b) > 60,
    (r, g, b) => THREE.MathUtils.clamp((r * 0.3 + g * 0.6 + b * 0.1) / 255, 0.25, 0.95), 0.405),
  // The soundwave, line and wordmark; cream burns brighter than the red lettering.
  beatbox: (n) => artworkShape(n, '/images/BeatBox.svg', 1.9,
    (_r, _g, _b, a) => a > 100,
    (_r, g) => (g > 160 ? 1.08 : 0.56)),
  // The red plate and white X; the black lettering stays open as negative space.
  xkill: (n) => artworkShape(n, '/images/XKill.png', 1.9,
    (r) => r > 110,
    (_r, g) => (g > 170 ? 1.08 : 0.55)),
  wave: waveShape,
  name: nameShape,
}

/**
 * Builds every shape. Files download in parallel; the starts are staggered one frame apart so
 * the synchronous sampling does not all land in one long task, and `onShape` reports progress.
 */
export async function createShapes(
  names: ShapeName[], count: number,
  onShape: (done: number, total: number, name: ShapeName) => void = () => {},
  yieldFrame: () => Promise<void> = () => Promise.resolve(),
) {
  const unique = [...new Set(names)]
  let start = Promise.resolve()
  let done = 0
  const entries = await Promise.all(unique.map(async (name): Promise<[ShapeName, Shape]> => {
    let shape: Shape
    start = start.then(yieldFrame)
    try {
      await start
      shape = await SHAPES[name](count)
    } catch (error) {
      console.warn(`[story] shape "${name}" failed, showing noise instead`, error)
      shape = noiseShape(count)
    }
    onShape(++done, unique.length, name)
    return [name, shape]
  }))
  return new Map(entries)
}
