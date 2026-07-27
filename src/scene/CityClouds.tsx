import { Cloud, Clouds } from '@react-three/drei'
import { MeshBasicMaterial } from 'three'

/** A handful of soft procedural clouds drifting high above the skyline. */
export function CityClouds() {
  return (
    <Clouds material={MeshBasicMaterial} limit={30}>
      <Cloud
        seed={1}
        segments={20}
        bounds={[40, 6, 40]}
        volume={30}
        color="#ffffff"
        opacity={0.75}
        position={[-90, 95, -70]}
      />
      <Cloud
        seed={2}
        segments={20}
        bounds={[55, 7, 55]}
        volume={38}
        color="#ffffff"
        opacity={0.65}
        position={[70, 105, 50]}
      />
      <Cloud
        seed={3}
        segments={16}
        bounds={[38, 5, 38]}
        volume={26}
        color="#ffffff"
        opacity={0.6}
        position={[10, 115, -130]}
      />
      <Cloud
        seed={4}
        segments={16}
        bounds={[30, 5, 30]}
        volume={20}
        color="#ffffff"
        opacity={0.55}
        position={[-120, 90, 40]}
      />
    </Clouds>
  )
}
