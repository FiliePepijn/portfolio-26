import * as THREE from 'three/webgpu'
import type { Node } from 'three/webgpu'
import { pass, uniform, screenUV, smoothstep, vec2, vec4, hash, screenCoordinate, time, float } from 'three/tsl'
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js'
import { chromaticAberration } from 'three/examples/jsm/tsl/display/ChromaticAberrationNode.js'

export function createPost(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.Camera) {
  const aberration = uniform(0.15)
  const sceneTexture = pass(scene, camera).getTextureNode('output')
  const glow = sceneTexture.add(bloom(sceneTexture, 0.42, 0.4, 0.3))
  // The effect node samples like any vec4; its published type just doesn't say so.
  const split = chromaticAberration(glow, aberration, vec2(0.5), float(1.08)) as unknown as Node<'vec4'>

  const vignette = smoothstep(0.25, 0.95, screenUV.sub(0.5).length()).oneMinus().mul(0.45).add(0.55)
  // Build the grain seed in integer math. A float seed loses its low bits once the frame term passes 2^24
  // (about 30 s in), so neighbouring pixels share a value and the grain smears into horizontal bands.
  const frame = time.mul(61).floor().toUint()
  const seed = screenCoordinate.x.toUint().add(screenCoordinate.y.toUint().mul(4096)).add(frame.mul(7919))
  const grain = hash(seed).sub(0.5).mul(0.012)

  const pipeline = new THREE.RenderPipeline(renderer)
  pipeline.outputNode = vec4(split.rgb.mul(vignette).add(grain), 1)

  return { pipeline, aberration }
}
