import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Box, Torus, Cone, Octahedron, Tetrahedron } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Animated rotating sphere with glow
function RotatingSphere({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.015;
    }
  });

  return (
    <group position={position}>
      <Sphere ref={meshRef} args={[1, 32, 32]}>
        <meshStandardMaterial 
          color={color} 
          metalness={0.9} 
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </Sphere>
    </group>
  );
}

// Floating cubes with pulsing effect
function FloatingCube({ position, rotationSpeed, color }: { position: [number, number, number], rotationSpeed: number, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += rotationSpeed;
      meshRef.current.rotation.y += rotationSpeed * 0.7;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.4;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Box ref={meshRef} args={[0.9, 0.9, 0.9]} position={position}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.7} 
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Box>
  );
}

// Spinning torus knot
function SpinningTorus({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.02;
      meshRef.current.rotation.y += 0.015;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.2;
    }
  });

  return (
    <Torus ref={meshRef} args={[1.2, 0.35, 16, 100]} position={position}>
      <meshStandardMaterial 
        color="#8b5cf6" 
        metalness={0.8} 
        roughness={0.15}
        emissive="#8b5cf6"
        emissiveIntensity={0.25}
      />
    </Torus>
  );
}

// Rotating cone
function RotatingCone({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.015;
      meshRef.current.rotation.z += 0.01;
      meshRef.current.position.y = position[1] + Math.cos(state.clock.elapsedTime * 1.5) * 0.3;
    }
  });

  return (
    <Cone ref={meshRef} args={[0.8, 1.5, 8]} position={position}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.6} 
        roughness={0.25}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Cone>
  );
}

// Octahedron with rotation
function RotatingOctahedron({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.012;
      meshRef.current.rotation.y += 0.018;
      meshRef.current.rotation.z += 0.01;
    }
  });

  return (
    <Octahedron ref={meshRef} args={[1]} position={position}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.75} 
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </Octahedron>
  );
}

// Tetrahedron
function RotatingTetrahedron({ position, color }: { position: [number, number, number], color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.013;
      meshRef.current.rotation.y += 0.016;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 1.8) * 0.15;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Tetrahedron ref={meshRef} args={[1]} position={position}>
      <meshStandardMaterial 
        color={color} 
        metalness={0.7} 
        roughness={0.22}
        emissive={color}
        emissiveIntensity={0.22}
      />
    </Tetrahedron>
  );
}

// Main 3D Scene Component
export default function Hero3D() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.6} color="#6366f1" />
        <pointLight position={[0, 10, -5]} intensity={0.8} color="#8b5cf6" />
        <directionalLight position={[5, 5, 5]} intensity={0.6} />
        
        <Suspense fallback={null}>
          {/* Central models */}
          <SpinningTorus position={[0, 0, 0]} />
          <RotatingSphere position={[-2.5, 1.5, 0]} color="#6366f1" />
          <RotatingSphere position={[2.5, -1.5, 0]} color="#8b5cf6" />
          
          {/* Floating cubes */}
          <FloatingCube position={[-4, -2, 1]} rotationSpeed={0.012} color="#6366f1" />
          <FloatingCube position={[4, 2, -1]} rotationSpeed={0.018} color="#ec4899" />
          
          {/* Additional geometric shapes */}
          <RotatingCone position={[-2, -2.5, -1]} color="#6366f1" />
          <RotatingOctahedron position={[2.5, 2, 1.5]} color="#8b5cf6" />
          <RotatingTetrahedron position={[0, -2.5, 2]} color="#ec4899" />
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.4}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}

