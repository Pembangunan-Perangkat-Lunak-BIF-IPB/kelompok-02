import { Suspense, useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, useGLTF, Center, Float, Resize, Environment } from '@react-three/drei'
import * as THREE from 'three'

const MODEL_PATH = '/models/dna.glb'

function DnaModel({ isPipelinePage }: { isPipelinePage: boolean }) {
  const outerGroupRef = useRef<THREE.Group>(null)
  const spinGroupRef = useRef<THREE.Group>(null)
  const piecesRef = useRef<THREE.Group>(null)

  const { scene } = useGLTF(MODEL_PATH)

  const [hovered, setHovered] = useState(false)
  const [exploded, setExploded] = useState(false)
  const explodeFactor = useRef(0)

  const { fragmentedGroup, directions, rotSpeeds } = useMemo(() => {
    const group = new THREE.Group()
    const dirs: THREE.Vector3[] = []
    const rots: THREE.Vector3[] = []

    scene.updateMatrixWorld(true)

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh
       const origMaterial = (mesh.material as THREE.MeshStandardMaterial).clone()

// === TAMBAHKAN KODE INI UNTUK MENGGANTI WARNA ===
// Ganti kode hex di bawah dengan warna pilihanmu (misal: '#38bdf8' untuk Cyan, '#f59e0b' untuk Amber/Oranye, atau '#ec4899' untuk Pink)
origMaterial.color.set('#f59e0b') 
// ===============================================

origMaterial.roughness = 0.35
origMaterial.metalness = 0.25

        const geom = mesh.geometry.clone()
        geom.applyMatrix4(mesh.matrixWorld)
        const nonIndexed = geom.index ? geom.toNonIndexed() : geom

        const posAttr = nonIndexed.getAttribute('position')
        const normAttr = nonIndexed.getAttribute('normal')
        const uvAttr = nonIndexed.getAttribute('uv')
        const uv1Attr = nonIndexed.getAttribute('uv1')

        const totalVerts = posAttr.count
        const numChunks = 140
        const trisPerChunk = Math.max(1, Math.floor(totalVerts / 3 / numChunks))
        const vertsPerChunk = trisPerChunk * 3

        for (let i = 0; i < totalVerts; i += vertsPerChunk) {
          const count = Math.min(vertsPerChunk, totalVerts - i)
          const subGeom = new THREE.BufferGeometry()

          const subPos = new Float32Array(count * 3)
          for (let j = 0; j < count; j++) {
            subPos[j * 3] = posAttr.getX(i + j)
            subPos[j * 3 + 1] = posAttr.getY(i + j)
            subPos[j * 3 + 2] = posAttr.getZ(i + j)
          }
          subGeom.setAttribute('position', new THREE.BufferAttribute(subPos, 3))

          if (normAttr) {
            const subNorm = new Float32Array(count * 3)
            for (let j = 0; j < count; j++) {
              subNorm[j * 3] = normAttr.getX(i + j)
              subNorm[j * 3 + 1] = normAttr.getY(i + j)
              subNorm[j * 3 + 2] = normAttr.getZ(i + j)
            }
            subGeom.setAttribute('normal', new THREE.BufferAttribute(subNorm, 3))
          }

          if (uvAttr) {
            const subUv = new Float32Array(count * 2)
            for (let j = 0; j < count; j++) {
              subUv[j * 2] = uvAttr.getX(i + j)
              subUv[j * 2 + 1] = uvAttr.getY(i + j)
            }
            subGeom.setAttribute('uv', new THREE.BufferAttribute(subUv, 2))
          }

          if (uv1Attr) {
            const subUv1 = new Float32Array(count * 2)
            for (let j = 0; j < count; j++) {
              subUv1[j * 2] = uv1Attr.getX(i + j)
              subUv1[j * 2 + 1] = uv1Attr.getY(i + j)
            }
            subGeom.setAttribute('uv1', new THREE.BufferAttribute(subUv1, 2))
          }

          const subMesh = new THREE.Mesh(subGeom, origMaterial)
          group.add(subMesh)

          const dir = new THREE.Vector3(
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 45,
            (Math.random() - 0.5) * 45
          )
          dirs.push(dir)

          rots.push(
            new THREE.Vector3(
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3,
              (Math.random() - 0.5) * 3
            )
          )
        }
      }
    })

    return { fragmentedGroup: group, directions: dirs, rotSpeeds: rots }
  }, [scene])

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto'
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [hovered])

  useFrame((_, delta) => {
    if (!outerGroupRef.current || !spinGroupRef.current || !piecesRef.current) return

    spinGroupRef.current.rotation.z += delta * (exploded ? 0.15 : 0.5)

    const baseScale = isPipelinePage ? 21.0 : 17.5
    const currentScale = outerGroupRef.current.scale.x
    const nextScale = THREE.MathUtils.lerp(currentScale, baseScale, delta * 4)
    outerGroupRef.current.scale.set(nextScale, nextScale, nextScale)

    const targetExplode = exploded ? 1 : 0
    explodeFactor.current = THREE.MathUtils.lerp(
      explodeFactor.current,
      targetExplode,
      delta * (exploded ? 7 : 4)
    )

    const children = piecesRef.current.children
    for (let i = 0; i < children.length; i++) {
      const piece = children[i]
      const dir = directions[i]
      const rot = rotSpeeds[i]
      if (dir && rot) {
        piece.position.set(
          dir.x * explodeFactor.current,
          dir.y * explodeFactor.current,
          dir.z * explodeFactor.current
        )
        piece.rotation.set(
          rot.x * explodeFactor.current,
          rot.y * explodeFactor.current,
          rot.z * explodeFactor.current
        )
      }
    }
  })

  return (
    <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.4}>
      <group
        ref={outerGroupRef}
        rotation={[0.45, 0.55, -0.65]}
        onPointerDown={(e) => {
          e.stopPropagation()
          setExploded(true)
        }}
        onPointerUp={() => setExploded(false)}
        onPointerLeave={() => {
          setHovered(false)
          setExploded(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          setExploded(true)
          setTimeout(() => setExploded(false), 900)
        }}
        onPointerOver={() => setHovered(true)}
      >
        <Resize>
          <Center>
            <group ref={spinGroupRef}>
              <primitive ref={piecesRef} object={fragmentedGroup} />
            </group>
          </Center>
        </Resize>
      </group>
    </Float>
  )
}

useGLTF.preload(MODEL_PATH)

export function DnaBackground3D({ isPipelinePage = false }: { isPipelinePage?: boolean }) {
  return (
    <div 
      className="absolute inset-0 z-10 w-full h-full pointer-events-auto"
      onMouseUp={() => window.dispatchEvent(new Event('pointerup'))}
    >
      <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
        <ambientLight intensity={3.5} />
        <directionalLight position={[5, 10, 7]} intensity={4.5} color="#ffffff" />
        <directionalLight position={[-5, -10, -5]} intensity={2.5} color="#ffffff" />
        <Environment preset="city" />

        <Suspense fallback={null}>
          <DnaModel isPipelinePage={isPipelinePage} />
        </Suspense>

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          rotateSpeed={0.6}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  )
}