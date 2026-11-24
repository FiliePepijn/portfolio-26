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
  const grain = hash(screenCoordinate.x.add(screenCoordinate.y.mul(4096)).add(time.mul(61).floor().mul(7919))).sub(0.5).mul(0.012)

  const pipeline = new THREE.RenderPipeline(renderer)
  pipeline.outputNode = vec4(split.rgb.mul(vignette).add(grain), 1)

  return { pipeline, aberration }
}
