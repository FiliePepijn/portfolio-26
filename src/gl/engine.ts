import * as THREE from 'three/webgpu'
import { BRAND, CHAPTERS, type Chapter, type Pose } from '../story/chapters'
import { createShapes } from './shapes'
import { createParticles } from './particles'
import { createPost } from './post'
import { createScrollStory } from '../story/scroll'

const { clamp, lerp, damp, smoothstep } = THREE.MathUtils

export async function startStory(host: HTMLElement, signal: AbortSignal) {
  const mobile = window.matchMedia('(max-width: 767px)')
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
  // `?webgl` and `?still` force the fallback and reduced-motion paths for testing.
  const params = new URLSearchParams(location.search)
  const forceWebGL = params.has('webgl')
  const forceStill = import.meta.env.DEV && params.has('still')

  const renderer = new THREE.WebGPURenderer({ antialias: false, powerPreference: 'high-performance', forceWebGL })
  await renderer.init()
  if (signal.aborted) return renderer.dispose()

  const webgpu = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend === true
  const count = mobile.matches ? 45_000 : webgpu ? 140_000 : 70_000
  console.info(`[story] backend: ${webgpu ? 'WebGPU' : 'WebGL2'}, particles: ${count}`)
  host.dataset.backend = webgpu ? 'webgpu' : 'webgl2'

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0d0d0d')
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50)
  camera.position.z = 5

  const shapes = await createShapes(CHAPTERS.map((c) => c.shape), count)
  if (signal.aborted) return renderer.dispose()

  const particles = createParticles(count, CHAPTERS.map((c) => shapes.get(c.shape)!))
  const group = new THREE.Group()
  group.add(particles.object)
  scene.add(group)

  const post = createPost(renderer, scene, camera)

  const resize = () => {
    const { clientWidth: w, clientHeight: h } = host
    if (!w || !h) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setSize(w, h, false)
    camera.aspect = w / Math.max(1, h)
    camera.updateProjectionMatrix()
  }
  renderer.domElement.style.cssText = 'width:100%;height:100%;display:block'
  host.appendChild(renderer.domElement)
  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host)
  resize()

  const pointer = new THREE.Vector2(9, 9)
  const onPointer = (e: PointerEvent) => {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1)
  }
  const onLeave = () => pointer.set(9, 9)
  window.addEventListener('pointermove', onPointer, { passive: true })
  window.addEventListener('pointerup', onLeave, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)

  const scroll = createScrollStory(reduced.matches)
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
  particles.uniforms.delta.value = 0
  for (const update of particles.updates) renderer.compute(update)

  const frame = (delta: number, elapsed: number, position: number) => {
    const still = forceStill || reduced.matches
    const time = still ? 0 : elapsed

    // A hidden or collapsed pane reports no size; WebGPU cannot allocate empty targets.
    if (!host.clientWidth || !host.clientHeight) return
    const previous = chapter
    chapter = position
    speed = damp(speed, Math.abs(chapter - previous) / Math.max(delta, 1e-4), 5, delta)

    const i = Math.min(Math.floor(chapter), CHAPTERS.length - 2)
    const from = CHAPTERS[i]
    const to = CHAPTERS[i + 1]
    // Hold each shape around its anchor and do the change in the middle of the gap.
    const t = smoothstep(chapter - i, 0.18, 0.82)

    const u = particles.uniforms
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
    group.scale.setScalar(lerp(a.scale * widthFit(from), b.scale * widthFit(to), t))
    group.position.set(lerp(a.x, b.x, t) * halfWidth, lerp(a.y, b.y, t) * halfHeight, 0)

    const sway = still ? 0 : Math.sin(time * 0.35) * lerp(from.sway, to.sway, t)
    group.rotation.set(lerp(a.rotX, b.rotX, t), lerp(a.rotY, b.rotY, t) + sway, 0)
    group.updateMatrixWorld()

    ray.setFromCamera(pointer, camera)
    if (!still && pointer.x <= 1 && ray.ray.intersectPlane(plane, hit)) u.pointer.value.copy(group.worldToLocal(hit))
    else u.pointer.value.set(99, 99, 0)

    post.aberration.value = still ? 0 : 0.12 + clamp(speed * 0.55, 0, 1.4)

    renderer.compute(particles.updates[i])
    post.pipeline.render()
    host.classList.add('is-live')
  }

  renderer.setAnimationLoop((timestamp) => {
    timer.update(timestamp)
    frame(Math.min(timer.getDelta(), 1 / 30), timer.getElapsed(), scroll.position())
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
