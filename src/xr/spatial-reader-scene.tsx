import { Canvas } from "@react-three/fiber";
import { Html, OrbitControls, Text } from "@react-three/drei";
import { XR, createXRStore } from "@react-three/xr";
import type { AttentionItem } from "@/engines/attention-engine";
import type { TranscriptSegment, UniversalBookObject } from "@/domain/types";

const store = createXRStore();
export const spatialReaderStore = store;

/**
 * Spatial reading mode — a projection of the SAME Active Reader state.
 * Text pages, sentence highlighting and entity markers all read from the
 * shared audio/transcript/attention pipeline; nothing here is simulated.
 */
export default function SpatialReaderScene({
  book,
  segment,
  currentTime,
  attention,
  onSelectEntity,
  selectedName,
}: {
  book: UniversalBookObject;
  segment: TranscriptSegment | null;
  currentTime: number;
  attention: AttentionItem[];
  onSelectEntity: (id: string) => void;
  selectedName: string | null;
}) {
  const index = segment ? book.transcript.indexOf(segment) : 0;
  const window = book.transcript.slice(Math.max(0, index - 2), Math.max(0, index - 2) + 6);
  const markers = attention.filter((a) => a.level <= 2).slice(0, 5);

  return (
    <Canvas camera={{ position: [0, 1.1, 5.2], fov: 50 }}>
      <XR store={store}>
        <color attach="background" args={["#080d14"]} />
        <fog attach="fog" args={["#080d14", 6, 18]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 3, 3]} intensity={30} color="#7fd8e8" />

        {/* Virtual pages */}
        <group position={[0, 1.1, 0]}>
          {[-1.2, 1.2].map((x) => (
            <mesh key={x} position={[x, 0, -0.02]} rotation={[0, x < 0 ? 0.05 : -0.05, 0]}>
              <planeGeometry args={[2.3, 2.4]} />
              <meshStandardMaterial color="#121a26" emissive="#0d1620" emissiveIntensity={0.6} />
            </mesh>
          ))}

          {window.map((s, i) => {
            const active = segment?.id === s.id;
            const col = i < 3 ? -1.2 : 1.2;
            const row = i % 3;
            return (
              <Text
                key={s.id}
                position={[col, 0.72 - row * 0.72, 0.14]}
                maxWidth={1.9}
                fontSize={0.082}
                lineHeight={1.35}
                anchorY="top"
                color={active ? "#8ee7f7" : "#7d8ea3"}
                outlineWidth={active ? 0.004 : 0}
                outlineColor="#2ea8c4"
              >
                {s.text}
              </Text>
            );
          })}
        </group>

        {/* Spatial knowledge markers — entities reacting as they are spoken */}
        {markers.map((m, i) => {
          const angle = -0.9 + i * 0.45;
          return (
            <group key={m.entity.id} position={[Math.sin(angle) * 3.1, 1.9 - i * 0.28, Math.cos(angle) * -1.2]}>
              <mesh onClick={() => onSelectEntity(m.entity.id)}>
                <icosahedronGeometry args={[m.level === 1 ? 0.11 : 0.075, 1]} />
                <meshStandardMaterial
                  color={m.level === 1 ? "#7fd8e8" : "#e6b95f"}
                  emissive={m.level === 1 ? "#7fd8e8" : "#e6b95f"}
                  emissiveIntensity={m.level === 1 ? 0.9 : 0.4}
                />
              </mesh>
              <Html center position={[0, 0.22, 0]} distanceFactor={8}>
                <button
                  onClick={() => onSelectEntity(m.entity.id)}
                  className={`rounded-full px-2 py-1 text-[10px] whitespace-nowrap ${
                    selectedName === m.entity.name ? "bg-primary text-primary-foreground" : "bg-black/70 text-white"
                  }`}
                >
                  {m.entity.name}
                </button>
              </Html>
            </group>
          );
        })}

        <Text position={[0, -0.28, 0]} fontSize={0.1} color="#4d6274">
          {`${book.metadata.title} · ${Math.floor(currentTime)}s`}
        </Text>

        <OrbitControls
          enablePan={false}
          target={[0, 1.05, 0]}
          maxPolarAngle={Math.PI / 1.9}
          minDistance={2.4}
          maxDistance={9}
        />
      </XR>
    </Canvas>
  );
}