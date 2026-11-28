import * as THREE from 'three/webgpu'
import { BRAND, CHAPTERS, type Chapter, type Pose } from '../story/chapters'
import { createShapes } from './shapes'
import { createParticles } from './particles'
import { createPost } from './post'
import { createScrollStory } from '../story/scroll'

const { clamp, lerp, damp, smoothstep } = THREE.MathUtils

/** Lets the browser paint (and the loading bar move) between long synchronous steps. */
const nextFrame = () => new Promise<void>((resolve) => {
  // rAF stalls in background tabs; the timeout keeps loading going there.
  const timeout = setTimeout(resolve, 50)
  requestAnimationFrame(() => { clearTimeout(timeout); resolve() })
})

export type Progress = (value: number, label?: string) => void

export async function startStory(host: HTMLElement, signal: AbortSignal, onProgress: Progress = () => {}) {
  const mobile = window.matchMedia('(max-width: 767px)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  // `?webgl` and `?still` force the fallback and reduced-motion paths for testing.
  const params = new URLSearchParams(location.search)
  const forceWebGL = params.has('webgl')
  const forceStill = import.meta.env.DEV && params.has('still')

  onProgress(0.02, 'Starting GPU')
  const renderer = new THREE.WebGPURenderer({ antialias: false, powerPreference: 'high-performance', forceWebGL })
  await renderer.init()
  if (signal.aborted) return renderer.dispose()

  const webgpu = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true
  // Use fewer dots on smaller screens or when the browser uses the WebGL2 fallback.
  const count = mobile.matches ? 45_000 : webgpu ? 140_000 : 70_000
  console.info(`[story] backend: ${webgpu ? 'WebGPU' : 'WebGL2'}, particles: ${count}`)
  host.dataset.backend = webgpu ? 'webgpu' : 'webgl2'

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0d0d0d')
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
  camera.position.z = 5

  // Progress budget: GPU start 5%, shapes 55%, shader compiles 35%, first frame 5%.
  onProgress(0.05, 'Sampling shapes')
  const shapes = await createShapes(CHAPTERS.map((c) => c.shape), count, (done, total, name) => {
    onProgress(0.05 + 0.55 * (done / total), `Sampled ${name}`)
  }, nextFrame)
  if (signal.aborted) return renderer.dispose()

  // Give the particles one set of home positions for each section, in scroll order.
  const particles = createParticles(count, CHAPTERS.map((c) => shapes.get(c.shape)!))
  const group = new THREE.Group()
  group.add(particles.object)
  scene.add(group)

  const post = createPost(renderer, scene, camera)

  // The host size is cached here so the frame loop never reads layout. Reading clientWidth
  // right after GSAP has written styles forces a synchronous style recalc every frame.
  let width = host.clientWidth
  let height = host.clientHeight
  // Starts at the sharpest ratio we allow and steps down if the GPU can't keep up (see `governor`).
  let pixelRatio = Math.min(window.devicePixelRatio, 1.5)
  const resize = () => {
    if (!width || !height) return
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(width, height, false)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
  }
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'
  host.appendChild(renderer.domElement)
  const resizeObserver = new ResizeObserver(([entry]) => {
    width = Math.round(entry.contentRect.width)
    height = Math.round(entry.contentRect.height)
    resize()
  })
  resizeObserver.observe(host)
  resize()

  /**
   * Drops the render resolution in small steps when frames keep arriving late. A GPU that
   * almost keeps up is the worst case: frames alternate between one and two refresh intervals,
   * which reads as judder even at a decent average fps. Stops at a pixel ratio of 1, only ever steps down, and only after
   * two slow seconds in a row, so a one-off hitch (a tab switch, a long task) never triggers it.
   */
  const governor = (() => {
    let refresh = Infinity // the fastest frame seen, which is the display's refresh interval
    let sampleTime = 0
    let sampleFrames = 0
    let slowSeconds = 0
    return (delta: number) => {
      if (!(delta > 0) || delta > 0.25) return // first frame, or back from a hidden tab
      refresh = Math.min(refresh, Math.max(delta, 1 / 240))
      sampleTime += delta
      sampleFrames++
      if (sampleTime < 1) return
      const average = sampleTime / sampleFrames
      sampleTime = 0
      sampleFrames = 0
      // Late against the display's own rate, or simply under 50 fps when every frame is slow alike.
      const slow = average > refresh * 1.3 || average > 1 / 50
      slowSeconds = slow ? slowSeconds + 1 : 0
      if (slowSeconds < 2 || pixelRatio <= 1) return
      slowSeconds = 0
      pixelRatio = Math.max(1, pixelRatio - 0.25)
      console.info(`[story] frames late (${(1 / average).toFixed(0)} fps), pixel ratio now ${pixelRatio}`)
      resize()
    }
  })()

  const pointer = new THREE.Vector2(9, 9)
  const onPointer = (e: PointerEvent) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
  }
  const onLeave = () => pointer.set(9, 9)
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerup', onLeave, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  const scroll = createScrollStory(reduced.matches)
  // The frame loop reads this scroll position and sends it to the particle shader.
  const timer = new THREE.Timer()
  timer.connect(document)
  const ray = new THREE.Raycaster()
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const hit = new THREE.Vector3()
  let chapter = scroll.position()
  let speed = 0

  const tints = CHAPTERS.map((c) => new THREE.Color(c.tint ?? BRAND))

  const poseOf = (c: Chapter): Pose => (mobile.matches ? c.mobile : c.desktop)

  // Compile every pass up front, with time stopped, so no chapter stutters on first arrival.
  // One pass per frame, so the loading bar keeps moving while the GPU compiles.
  particles.uniforms.delta.value = 0
  for (const [n, update] of particles.updates.entries()) {
    onProgress(0.6 + 0.35 * (n / particles.updates.length), `Compiling shader ${n + 1}/${particles.updates.length}`)
    await nextFrame()
    if (signal.aborted) return renderer.dispose()
    renderer.compute(update)
  }
  onProgress(0.95, 'Compiling materials')
  await nextFrame()
  if (signal.aborted) return renderer.dispose()

  let live = false
  let liveAt = 0

  const frame = (delta: number, elapsed: number, position: number) => {
    const still = forceStill || reduced.matches
    const time = still ? 0 : elapsed

    // A hidden or collapsed pane reports no size; WebGPU cannot allocate empty targets.
    if (!width || !height) return
    const previous = chapter
    chapter = position
    speed = damp(speed, Math.abs(chapter - previous) / Math.max(delta, 1e-4), 5, delta)

    // The current scroll position picks the two sections whose shapes can blend.
    const i = Math.min(Math.floor(chapter), CHAPTERS.length - 2)
    const from = CHAPTERS[i]
    const to = CHAPTERS[i + 1]
    // Hold each shape around its anchor and do the change in the middle of the gap.
    const t = smoothstep(chapter - i, 0.18, 0.82)

    const u = particles.uniforms
    // Tell the GPU how far each dot's home should move toward the next shape.
    u.blend.value = t
    u.delta.value = delta
    u.time.value = time
    u.snap.value = still ? 1 : 0
    u.turbulence.value = still ? 0 : lerp(from.turbulence, to.turbulence, t)
    u.glow.value = lerp(from.glow, to.glow, t) * (mobile.matches ? 0.8 : 1)
    u.scan.value = still ? 0 : lerp(from.scan, to.scan, t)
    u.tintA.value.copy(tints[i])
    u.tintB.value.copy(tints[i + 1])
    u.crawl.value = still ? 0 : lerp(from.crawl ?? 0, to.crawl ?? 0, t)
    u.size.value = mobile.matches ? 0.016 : webgpu ? 0.012 : 0.015

    const a = poseOf(from)
    const b = poseOf(to)
    const halfHeight = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z
    const halfWidth = halfHeight * camera.aspect
    // Narrow screens shrink wide shapes so they never leave the frame.
    const widthFit = (c: Chapter) => (c.shape === 'name' ? Math.min(1, (halfWidth * 1.85) / 3.4) : Math.min(1, camera.aspect / (mobile.matches ? 0.5 : 1.45)))
    // Move and turn the whole cloud as the section changes; dot homes move inside it.
    group.scale.setScalar(lerp(a.scale * widthFit(from), b.scale * widthFit(to), t))
    group.position.set(lerp(a.x, b.x, t) * halfWidth, lerp(a.y, b.y, t) * halfHeight, 0)

    const sway = still ? 0 : Math.sin(time * 0.35) * lerp(from.sway, to.sway, t)
    group.rotation.set(lerp(a.rotX, b.rotX, t), lerp(a.rotY, b.rotY, t) + sway, 0)
    group.updateMatrixWorld()

    ray.setFromCamera(pointer, camera)
    if (!still && pointer.x <= 1 && ray.ray.intersectPlane(plane, hit)) u.pointer.value.copy(group.worldToLocal(hit))
    else u.pointer.value.set(99, 99, 0)

    post.aberration.value = still ? 0 : 0.12 + clamp(speed * 0.55, 0, 1.4)

    // Run the movement for this pair of shapes, then draw the dots.
    renderer.compute(particles.updates[i])
    post.pipeline.render()
    if (!live) {
      live = true
      liveAt = elapsed
      host.classList.add('is-live')
      onProgress(1, 'Ready')
    }
  }

  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp)
    const delta = timer.getDelta()
    // Skip the first seconds after load: the fade-in and late pipeline setup are not steady state.
    if (live && timer.getElapsed() - liveAt > 2) governor(delta)
    frame(Math.min(delta, 1 / 30), timer.getElapsed(), scroll.position())
  })

  if (import.meta.env.DEV) {
    /** Render one chapter position to an image, independent of how fast the tab is ticking. */
    Object.assign(window, {
      __story: {
        capture(position: number, frames = 150) {
          // Post passes redraw once per node frame, which normally only the animation loop advances.
          const nodes = (renderer as unknown as { _nodes: { nodeFrame: { update(): void } } })._nodes
          for (let n = 0; n < frames; n++) {
            nodes.nodeFrame.update()
            frame(1 / 60, 3 + n / 60, position)
          }
          return renderer.domElement.toDataURL('image/jpeg', 0.85)
        },
      },
    })
  }

  signal.addEventListener('abort', () => {
    renderer.setAnimationLoop(null)
    scroll.dispose()
    timer.dispose()
    resizeObserver.disconnect()
    window.removeEventListener('pointermove', onPointer)
    window.removeEventListener('pointerup', onLeave)
    document.documentElement.removeEventListener('pointerleave', onLeave)
    renderer.domElement.remove()
    renderer.dispose()
  }, { once: true })
}
