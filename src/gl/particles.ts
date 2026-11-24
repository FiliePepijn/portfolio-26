import * as THREE from 'three/webgpu'
import {
  Fn, float, vec2, vec3, vec4, uniform, instancedArray, instanceIndex, hash, mix, smoothstep,
  mx_noise_vec3, uv, color, length, max, sin, step,
} from 'three/tsl'
import type { Shape } from './shapes'

/** `shapes` holds one entry per chapter, in story order; repeats share a buffer. */
export function createParticles(count: number, shapes: Shape[]) {
  const start = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    // Start as wide, dim dust so the first shape assembles on load.
    start.set([(Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 5, 0], i * 4)
  }

  const positions = instancedArray(start, 'vec4')
  const velocities = instancedArray(count, 'vec4')
  // Targets are uploaded once. Rewriting a storage buffer does not reach the WebGL2 fallback.
  const buffers = new Map(shapes.map((data) => [data, instancedArray(new Float32Array(data), 'vec4')]))

  const u = {
    blend: uniform(0),
    delta: uniform(1 / 60),
    time: uniform(0),
    turbulence: uniform(0),
    snap: uniform(0),
    pointer: uniform(new THREE.Vector3(99, 99, 0)),
    pointerForce: uniform(1),
    glow: uniform(1),
    scan: uniform(0),
    size: uniform(0.011),
    tintA: uniform(new THREE.Color('#ff7a00')),
    tintB: uniform(new THREE.Color('#ff7a00')),
    crawl: uniform(0),
  }

  const createUpdate = (from: Shape, to: Shape, pass: number) => Fn(() => {
    const position = positions.element(instanceIndex)
    const velocity = velocities.element(instanceIndex)
    const seed = hash(instanceIndex)

    // Each particle leaves at its own moment, so shapes pour into each other.
    const m = smoothstep(seed.mul(0.4), seed.mul(0.4).add(0.6), u.blend)
    const shape = mix(buffers.get(from)!.element(instanceIndex), buffers.get(to)!.element(instanceIndex), m)
    // A wave that ripples across the Superlocal tiles.
    const crawl = sin(shape.x.mul(4.2).add(u.time.mul(5))).mul(0.07).mul(u.crawl)
    // The tiny per-pass constant keeps every program's source unique: the WebGL2 backend
    // reuses one program, with the first pass's buffers, when two sources are identical.
    const unique = float(pass).mul(1e-9)
    const target = vec4(shape.xyz.add(vec3(unique, crawl, 0)), shape.w)
    const travel = m.mul(m.oneMinus()).mul(4)

    const noise = mx_noise_vec3(position.xyz.mul(1.35).add(vec3(0, 0, u.time.mul(0.22))))
    const strength = u.turbulence.mul(3.2).add(travel.mul(5.5))

    const away = position.xy.sub(u.pointer.xy)
    const near = max(float(1).sub(length(away).div(0.5)), 0)
    const push = vec3(away.normalize(), seed.sub(0.5).mul(2)).mul(near.mul(near).mul(18).mul(u.pointerForce))

    const spring = target.xyz.sub(position.xyz).mul(seed.mul(14).add(16))
    const acceleration = spring.add(noise.mul(strength)).add(push)

    const damping = float(0.86).pow(u.delta.mul(60))
    const nextVelocity = velocity.xyz.add(acceleration.mul(u.delta)).mul(damping)
    const simulated = position.xyz.add(nextVelocity.mul(u.delta))

    velocity.xyz.assign(mix(nextVelocity, vec3(0), u.snap))
    position.xyz.assign(mix(simulated, target.xyz, u.snap))
    position.w.assign(mix(position.w, target.w, mix(float(0.08), float(1), u.snap)))
  })().compute(count)

  const material = new THREE.SpriteNodeMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  })

  const point = positions.toAttribute()
  const speed = velocities.toAttribute().xyz.length()
  const seed = hash(instanceIndex.add(917))

  material.positionNode = point.xyz
  material.scaleNode = vec2(u.size.mul(seed.mul(seed).mul(1.5).add(0.45)))

  const heat = smoothstep(0.25, 2.6, speed)
  const band = smoothstep(0, 0.1, point.y.sub(u.time.mul(0.28).fract().mul(2.8).sub(1.4)).abs()).oneMinus().mul(u.scan)
  // Each particle changes colour as it leaves, so two projects never muddy into a third hue.
  const leaving = hash(instanceIndex).mul(0.4)
  const tint = mix(u.tintA, u.tintB, step(0.5, smoothstep(leaving, leaving.add(0.6), u.blend)))
  const base = mix(tint.mul(0.28), tint, smoothstep(0.1, 0.65, point.w))
  const hot = mix(base, mix(tint, color('#ffffff'), 0.7), max(smoothstep(0.82, 1, point.w), heat.mul(0.7)))
  material.colorNode = mix(hot, color('#fff1e0'), band.mul(0.35))

  const disc = smoothstep(0.12, 0.5, length(uv().sub(0.5))).oneMinus()
  material.opacityNode = disc.mul(point.w.mul(0.55).add(0.1).add(band.mul(0.12))).mul(u.glow)

  const object = new THREE.Sprite(material)
  object.count = count
  object.frustumCulled = false

  /** One compute pass per pair of neighbouring chapters. */
  const updates = shapes.slice(1).map((to, i) => createUpdate(shapes[i], to, i))

  return { object, updates, uniforms: u }
}
