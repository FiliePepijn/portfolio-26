import * as THREE from 'three/webgpu'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { build, mulberry, type Shape } from './shapes'

/** Kept in its own chunk: only downloaded when a project has a model in public/models. */
async function loadModel(url: string) {
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url)
  gltf.scene.updateMatrixWorld(true)
  const parts: THREE.BufferGeometry[] = []
  gltf.scene.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (!mesh.isMesh) return
    const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry
    // Copy to plain floats so quantised attributes survive the transform.
    const from = source.attributes.position
    const array = new Float32Array(from.count * 3)
    for (let i = 0; i < from.count; i++) array.set([from.getX(i), from.getY(i), from.getZ(i)], i * 3)
    const part = new THREE.BufferGeometry()
    part.setAttribute('position', new THREE.BufferAttribute(array, 3))
    part.applyMatrix4(mesh.matrixWorld)
    part.computeVertexNormals()
    parts.push(part)
  })
  return parts.length ? mergeGeometries(parts) : null
}

/** Centres a model, fits it to the same box as the marks and scatters points over its surface. */
function sampleModel(geometry: THREE.BufferGeometry, count: number): Shape {
  geometry.center()
  geometry.computeBoundingBox()
  const size = geometry.boundingBox!.getSize(new THREE.Vector3())
  const fit = Math.min(2.1 / size.y, 2.5 / Math.max(size.x, size.z))
  geometry.scale(fit, fit, fit)
  const sampler = new MeshSurfaceSampler(new THREE.Mesh(geometry))
  // Present at runtime, missing from the published types.
  ;(sampler as unknown as { setRandomGenerator(f: () => number): void }).setRandomGenerator(mulberry(11))
  sampler.build()
  const p = new THREE.Vector3()
  const n = new THREE.Vector3()
  const light = new THREE.Vector3(0.4, 0.7, 0.6).normalize()
  return build(count, (_i, rnd, out) => {
    sampler.sample(p, n)
    // Bake a key light and a rim into the brightness so form reads without shading.
    const lit = Math.max(0, n.dot(light))
    const rim = 1 - Math.abs(n.z)
    out.set(p.x, p.y, p.z, Math.min(0.95, 0.08 + lit * lit * 0.5 + rim * rim * 0.4 + rnd() * 0.12))
  })
}

export async function loadModelShape(url: string, count: number) {
  const geometry = await loadModel(url)
  return geometry ? sampleModel(geometry, count) : null
}
