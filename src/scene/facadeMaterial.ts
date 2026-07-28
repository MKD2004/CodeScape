import * as THREE from 'three'
import { getFacadeTexture, TILE_HEIGHT, TILE_WIDTH } from './facadeTexture'

/**
 * Building material with a facade whose windows keep a fixed real-world size.
 *
 * Every building of one archetype shares a single InstancedMesh, so the only
 * per-building information available to the shader is the instance matrix.
 * Its column lengths give the building's metre dimensions, which is enough to
 * project the window tile at a constant metres-per-window density: a wide
 * squat block gets many columns and few rows, a narrow tower gets few columns
 * and many rows, and neither one stretches a window out of shape.
 *
 * The projection is planar per dominant axis rather than UV-based, because the
 * archetype geometries mix boxes, cylinders and hexagonal prisms whose baked
 * UVs do not share a common parameterisation. Up-facing surfaces (roof caps,
 * helipads, the belt band) are masked out so windows never appear on a roof.
 */
const facadeVertexHead = /* glsl */ `
uniform vec2 uFacadeTile;
varying vec2 vFacadeUv;
varying float vFacadeWall;
`

const facadeVertexBody = /* glsl */ `
vec3 facadeScale = vec3(1.0);
#ifdef USE_INSTANCING
  facadeScale = vec3(
    length(instanceMatrix[0].xyz),
    length(instanceMatrix[1].xyz),
    length(instanceMatrix[2].xyz)
  );
#endif

// Metres from the building's own base/centre, before any camera transform.
vec3 facadePos = position * facadeScale;
vec3 facadeAxis = abs(normal);

// Roofs and other up-facing caps get no windows.
vFacadeWall = step(facadeAxis.y, 0.5);

vec2 facadePlane = facadeAxis.x > facadeAxis.z
  ? vec2(facadePos.z, facadePos.y)
  : vec2(facadePos.x, facadePos.y);
vFacadeUv = facadePlane / uFacadeTile;
`

const facadeFragmentHead = /* glsl */ `
varying vec2 vFacadeUv;
varying float vFacadeWall;
`

const facadeFragmentBody = /* glsl */ `
#ifdef USE_MAP
  vec4 facadeTexel = texture2D(map, vFacadeUv);
  diffuseColor *= mix(vec4(1.0), facadeTexel, vFacadeWall);
#endif
`

export function createFacadeMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    toneMapped: false,
    flatShading: true,
    roughness: 0.85,
    metalness: 0,
    map: getFacadeTexture(),
  })

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFacadeTile = {
      value: new THREE.Vector2(TILE_WIDTH, TILE_HEIGHT),
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${facadeVertexHead}`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>\n${facadeVertexBody}`,
      )
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${facadeFragmentHead}`)
      .replace('#include <map_fragment>', facadeFragmentBody)
  }

  // The injection is identical for every instance of this material, so a single
  // cache key keeps three from recompiling the program per archetype mesh.
  material.customProgramCacheKey = () => 'codescape-facade'

  return material
}
