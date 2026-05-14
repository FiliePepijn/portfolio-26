import { useRef, useMemo, Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { PCDLoader } from 'three-stdlib'

type TrackingMode = 'contact' | 'nav' | 'default'

function PointsModel({ url, isTrackingRequested, trackingMode }: { url?: string; isTrackingRequested: boolean; trackingMode: TrackingMode }) {
  const ref = useRef<THREE.Group>(null!)
  const pcd = url ? useLoader(PCDLoader, url) : null
  
  // Global mouse position tracking
  const mouse = useRef({ x: 0, y: 0 })
  
  // Track continuous rotation for the turntable effect
  const turntableRotation = useRef(0)

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // Center the geometry once it's loaded
  useMemo(() => {
    if (pcd) {
      pcd.geometry.center()
    }
  }, [pcd])

  const placeholderPoints = useMemo(() => {
    if (pcd) return null
    const p = new Float32Array(8000 * 3)
    for (let i = 0; i < 8000; i++) {
      const theta = THREE.MathUtils.randFloatSpread(360)
      const phi = THREE.MathUtils.randFloatSpread(360)
      p[i * 3] = 1.8 * Math.sin(theta) * Math.cos(phi)
      p[i * 3 + 1] = 1.8 * Math.sin(theta) * Math.sin(phi)
      p[i * 3 + 2] = 1.8 * Math.cos(theta)
    }
    return p
  }, [pcd])

  useFrame((_state, delta) => {
    if (!ref.current) return
    const time = _state.clock.getElapsedTime()
    
    // 1. Update Turntable Rotation
    // When NOT tracking, we increment it.
    // When tracking, we lerp it to the nearest "front" position (multiple of 2PI)
    // to prevent the "death spin" when switching modes.
    if (!isTrackingRequested) {
      turntableRotation.current += delta * 0.5
    } else {
      const nearestFullCircle = Math.round(turntableRotation.current / (Math.PI * 2)) * (Math.PI * 2)
      turntableRotation.current = THREE.MathUtils.lerp(turntableRotation.current, nearestFullCircle, 0.05)
    }

    // 2. Calculate Tracking Offset
    // Contact hover gets a stronger preset bias to make the head look down/right.
    const directionalX = trackingMode === 'contact'
      ? THREE.MathUtils.clamp(mouse.current.x * 0.35 - 0.30, -1, 1)
      : mouse.current.x
    const directionalY = trackingMode === 'contact'
      ? THREE.MathUtils.clamp(mouse.current.y * 0.25 - 0.50, -1, 1)
      : mouse.current.y

    const trackingRotationY = isTrackingRequested ? (directionalX * Math.PI) / 2.4 : 0
    const trackingRotationX = isTrackingRequested ? (directionalY * Math.PI) / 5.5 : 0
    const trackingPositionX = isTrackingRequested ? directionalX * 0.15 : 0
    const trackingPositionY = isTrackingRequested ? directionalY * 0.15 : 0

    // 3. Combine rotations
    const targetRotationY = turntableRotation.current + trackingRotationY
    const targetRotationX = trackingRotationX
    
    const idleSwayX = Math.sin(time * 0.5) * 0.05
    const idleSwayY = Math.cos(time * 0.3) * 0.05

    // Smooth rotation follow
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y, 
      targetRotationY + (isTrackingRequested ? idleSwayY : 0), 
      0.08
    )
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x, 
      -targetRotationX + (isTrackingRequested ? idleSwayX : 0), 
      0.08
    )

    // Smooth parallax position shift
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, trackingPositionX, 0.05)
    ref.current.position.y = THREE.MathUtils.lerp(ref.current.position.y, trackingPositionY, 0.05)
  })

  const pointsContent = pcd ? (
    <primitive object={pcd} scale={1.8}>
      <pointsMaterial
        vertexColors={!!pcd.geometry.attributes.color}
        color={pcd.geometry.attributes.color ? undefined : '#FF7A00'}
        size={0.006}
        sizeAttenuation={true}
        transparent={true}
        opacity={0.8}
      />
    </primitive>
  ) : (
    <Points positions={placeholderPoints!} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent={true}
        color='#FF7A00'
        size={0.035}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  )

  return (
    <group ref={ref}>
      {pointsContent}
    </group>
  )
}

export default function PointCloudHead({ isExternalTracking = false, trackingMode = 'default' }: { isExternalTracking?: boolean; trackingMode?: TrackingMode }) {
  const scanUrl = '/PepijnPCD.pcd'
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div 
      className='w-full h-full relative overflow-hidden bg-transparent touch-none'
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='absolute inset-0 pointer-events-none border-[1px] border-[#FF7A00]/20 z-10' />
      <Canvas camera={{ position: [0, 0, 2], fov: 45 }} style={{ touchAction: 'none' }}>
        <ambientLight intensity={2} />
        <Suspense fallback={null}>
          <PointsModel
            url={scanUrl}
            isTrackingRequested={isExternalTracking || isHovered}
            trackingMode={trackingMode}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}