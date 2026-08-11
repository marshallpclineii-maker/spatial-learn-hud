import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import { useMemo, useState } from "react";
import type { BookSummary } from "@/domain/types";

const store = createXRStore();
export const xrStore = store;

const ACCENT: Record<string, string> = {
  cyan: "#5fd0e6",
  amber: "#e6b95f",
  emerald: "#68d9a6",
  slate: "#8d9ab5",
};

function Spine({
  position,
  color,
  title,
  selected,
  onSelect,
}: {
  position: [number, number, number];
  color: string;
  title: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <group position={position}>
      <mesh
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={onSelect}
        scale={selected || hovered ? [1.15, 1.06, 1.15] : [1, 1, 1]}
      >
        <boxGeometry args={[0.22, 1.1, 0.7]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={selected ? 0.7 : hovered ? 0.4 : 0.12}
          roughness={0.45}
        />
      </mesh>
      {(hovered || selected) && (
        <Html center position={[0, 0.85, 0]} distanceFactor={7}>
          <span className="rounded bg-black/70 px-2 py-1 text-[10px] whitespace-nowrap text-white">
            {title}
          </span>
        </Html>
      )}
    </group>
  );
}

function Shelf({ y }: { y: number }) {
  return (
    <mesh position={[0, y, 0]} receiveShadow>
      <boxGeometry args={[6.4, 0.08, 0.9]} />
      <meshStandardMaterial color="#243044" roughness={0.8} />
    </mesh>
  );
}

export default function VirtualLibraryScene({
  books,
  selectedId,
  onSelect,
}: {
  books: BookSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const spines = useMemo(() => {
    const items: Array<{ book: BookSummary; position: [number, number, number] }> = [];
    const perShelf = 12;
    for (let i = 0; i < perShelf * 2; i++) {
      const book = books[i % Math.max(1, books.length)];
      if (!book) continue;
      const shelf = i < perShelf ? 0 : 1;
      const idx = i % perShelf;
      items.push({
        book,
        position: [-2.9 + idx * 0.52, shelf === 0 ? 0.62 : 2.02, 0],
      });
    }
    return items;
  }, [books]);

  return (
    <Canvas camera={{ position: [0, 1.6, 6], fov: 55 }} shadows>
      <XR store={store}>
        <color attach="background" args={["#0b1017"]} />
        <fog attach="fog" args={["#0b1017", 8, 22]} />
        <ambientLight intensity={0.45} />
        <pointLight position={[0, 4, 4]} intensity={40} color="#7fd8e8" />
        <pointLight position={[-5, 2, -3]} intensity={20} color="#e6b95f" />

        <group position={[0, -0.6, -1.5]}>
          <Shelf y={0} />
          <Shelf y={1.4} />
          {spines.map(({ book, position }, i) => (
            <Spine
              key={`${book.metadata.id}-${i}`}
              position={position}
              color={ACCENT[book.metadata.coverAccent] ?? "#8d9ab5"}
              title={book.metadata.title}
              selected={selectedId === book.metadata.id}
              onSelect={() => onSelect(book.metadata.id)}
            />
          ))}
        </group>

        {/* Central reading dock */}
        <group position={[0, -1.2, 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.1, 1.35, 48]} />
            <meshStandardMaterial color="#7fd8e8" emissive="#7fd8e8" emissiveIntensity={0.6} />
          </mesh>
          <Text position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.18} color="#cfe8f2">
            READING DOCK
          </Text>
        </group>

        <OrbitControls enablePan={false} maxPolarAngle={Math.PI / 1.9} minDistance={3} maxDistance={12} />
      </XR>
    </Canvas>
  );
}
