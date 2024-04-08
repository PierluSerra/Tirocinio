// We define the empty imports so the auto-complete feature works as expected.
import {} from '@dcl/sdk/math'
import { Material, MeshRenderer, Transform, VideoPlayer, engine } from '@dcl/sdk/ecs'

import { changeColorSystem, circularSystem } from './systems'
import { setupUi } from './ui'

export function main() {
  // Defining behavior. See `src/systems.ts` file.
  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)

  // #1
  const screen = engine.addEntity()
  MeshRenderer.setPlane(screen)
  Transform.create(screen, { position: { x: 4, y: 1, z: 4 } })

  // #2
  VideoPlayer.create(screen, {
    src: 'https://player.vimeo.com/external/552481870.m3u8?s=c312c8533f97e808fccc92b0510b085c8122a875',
    playing: true,
  })

  // #3
  const videoTexture = Material.Texture.Video({ videoPlayerEntity: screen })

  // #4
  Material.setPbrMaterial(screen, {
    texture: videoTexture,
    roughness: 1.0,
    specularIntensity: 0,
    metallic: 0,
  })
}
