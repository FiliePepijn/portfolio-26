import { useRef, useMemo, Suspense, forwardRef, useImperativeHandle, useState } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import { Points, PointMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { PCDLoader } from 'three-stdlib'

type TrackingMode = 'contact' | 'nav' | 'default'

interface PointsModelProps {
  url?: string;
  isTrackingRequested: boolean;
  trackingMode: TrackingMode;
  isCaptureMode?: boolean;
}

const PointsModel = forwardRef(({ url, isTrackingRequested, trackingMode, isCaptureMode = false }: PointsModelProps, forwardRef) => {
  const ref = useRef<THREE.Group>(null!)
  const pcd = url ? useLoader(PCDLoader, url) : null
  const { gl, scene, camera } = useThree()
  
  // Track continuous rotation for the turntable effect (even if disabled, we keep the ref)
  const turntableRotation = useRef(0)

  // Center the geometry once it's loaded
  useMemo(() => {
    if (pcd) {
      pcd.geometry.center()
    }
  }, [pcd])

  // Expose the capture method to the parent
  useImperativeHandle(forwardRef, () => ({
    capture: () => {
      // 1. Set front view
      const target = new THREE.Vector3(0, 0, 0)
      const distance = 2 // Match camera position
      camera.position.set(0, 0, distance)
      camera.lookAt(target)
      camera.updateProjectionMatrix()

      // 2. Render
      gl.render(scene, camera)

      // 3. Get Data URL
      return gl.domElement.toDataURL("image/png")
    },
    captureSvg: () => {
      if (!pcd) return null;
      
      const positions = pcd.geometry.attributes.position.array;
      const count = pcd.geometry.attributes.position.count;
      
      // Match PNG capture camera setup
      const target = new THREE.Vector3(0, 0, 0)
      const distance = 2
      camera.position.set(0, 0, distance)
      camera.lookAt(target)
      camera.updateProjectionMatrix()
      
      const width = gl.domElement.clientWidth;
      const height = gl.domElement.clientHeight;
      
      let svgContent = "";
      const pos = new THREE.Vector3();
      
      for (let i = 0; i < count; i++) {
        pos.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
        pos.multiplyScalar(1.8); // Match pointsContent scale
        
        pos.project(camera);
        
        const x = (pos.x * 0.5 + 0.5) * width;
        const y = (-pos.y * 0.5 + 0.5) * height;
        
        if (pos.z > -1 && pos.z < 1) {
          svgContent += `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="0.8" fill="#FF7A00" opacity="0.8" />`;
        }
      }
      
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">${svgContent}</svg>`;
    }
  }))

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

  useFrame((state) => {
    if (!ref.current) return
    const time = state.clock.getElapsedTime()
    
    if (isCaptureMode) {
      ref.current.rotation.set(0, 0, 0)
      ref.current.position.set(0, 0, 0)
      return
    }

    // Use state.mouse (canvas relative)
    const targetX = isTrackingRequested ? state.mouse.x : 0
    const targetY = isTrackingRequested ? state.mouse.y : 0

    const directionalX = trackingMode === 'contact'
      ? THREE.MathUtils.clamp(targetX * 0.35 - 0.30, -1, 1)
      : targetX
    const directionalY = trackingMode === 'contact'
      ? THREE.MathUtils.clamp(targetY * 0.25 - 0.50, -1, 1)
      : targetY

    const trackingRotationY = isTrackingRequested ? (directionalX * Math.PI) / 2.5 : 0
    const trackingRotationX = isTrackingRequested ? -(directionalY * Math.PI) / 4 : 0
    const trackingPositionX = isTrackingRequested ? directionalX * 0.1 : 0
    const trackingPositionY = isTrackingRequested ? directionalY * 0.1 : 0

    const targetRotationY = turntableRotation.current + trackingRotationY
    const targetRotationX = trackingRotationX
    
    const idleSwayX = Math.sin(time * 0.5) * 0.02
    const idleSwayY = Math.cos(time * 0.3) * 0.02

    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y, 
      targetRotationY + (isTrackingRequested ? idleSwayY : 0), 
      0.1
    )
    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x, 
      targetRotationX + (isTrackingRequested ? idleSwayX : 0), 
      0.1
    )

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
})

export default forwardRef(function PointCloudHead(
  { isExternalTracking = false, trackingMode = 'default', isCaptureMode = false }: 
  { isExternalTracking?: boolean; trackingMode?: TrackingMode; isCaptureMode?: boolean }, 
  ref
) {
  const scanUrl = '/PepijnPCD.pcd'
  const modelRef = useRef<{ capture: () => string; captureSvg: () => string | null }>(null)
  const [isInternalHovering, setIsInternalHovering] = useState(false)

  useImperativeHandle(ref, () => ({
    exportToPng: () => {
      if (modelRef.current) {
        const dataUrl = modelRef.current.capture()
        const a = document.createElement("a")
        a.href = dataUrl
        a.download = "pcd-front.png"
        a.click()
        return dataUrl
      }
    },
    exportToSvg: () => {
      if (modelRef.current) {
        const svg = modelRef.current.captureSvg()
        if (svg) {
          const blob = new Blob([svg], { type: 'image/svg+xml' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = "pcd-front.svg"
          a.click()
          URL.revokeObjectURL(url)
          return svg
        }
      }
    }
  }))

  return (
    <div 
      className='w-full h-full relative overflow-hidden bg-transparent touch-none'
      onPointerEnter={() => setIsInternalHovering(true)}
      onPointerLeave={() => setIsInternalHovering(false)}
    >
      <div className='absolute inset-0 pointer-events-none border-[1px] border-[#FF7A00]/20 z-10' />
      <Canvas 
        camera={{ position: [0, 0, 2], fov: 45 }} 
        gl={{ preserveDrawingBuffer: true }}
        style={{ touchAction: 'none' }}
      >
        <ambientLight intensity={2} />
        <Suspense fallback={null}>
          <PointsModel
            ref={modelRef}
            url={scanUrl}
            isTrackingRequested={isExternalTracking || isInternalHovering}
            trackingMode={isExternalTracking ? trackingMode : 'default'}
            isCaptureMode={isCaptureMode}
          />
        </Suspense>
      </Canvas>
    </div>
  )
})
