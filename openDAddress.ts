import {
  InputAction,
  pointerEventsSystem,
  engine,
  Transform,
  Entity,
  MeshRenderer,
  MeshCollider,
  Material,
  Schemas
} from '@dcl/ecs'
import { Quaternion, Vector3, Color4 } from '@dcl/ecs-math'
import * as utils from '@dcl-sdk/utils'
import { setupUi } from './ui'
import { EasingFunction, Tween } from '@dcl/sdk/ecs'
import { getUserData } from '~system/UserIdentity'
import { getPlayer } from '@dcl/sdk/src/players'
import { changeColorSystem, circularSystem } from './systems'


//0xa8f01292f34e72954328c73ec3479528e0645b7d
const openPos: Quaternion = Quaternion.create(0, 1, 0)
const closedPos: Quaternion = Quaternion.create(0, 0, 0)

//indirizzo autorizzato
const authorizedAddress = '0xa8f01292f34e72954328c73ec3479528e0645b7d' //questo è il mio address di MetaMask

export function main() {

  engine.addSystem(circularSystem)
  engine.addSystem(changeColorSystem)

  let userData = getPlayer() //prende le specifiche del giocatore

  if(userData && userData.userId == authorizedAddress) //controllo che l'identificativo del player sia uguale all'address desiderato
  {
      //se entra in questa parte di codice vuol dire che è l'utente giusto
      setupDoor() // di conseguenza apre lo script inerente la porta
  } else{
    console.log('Accesso negato. Solo gli utenti autorizzati possono aprire la porta')
  }
  
}

function setupDoor(){
  //crea i muri
  createWall(Vector3.create(5.75, 1, 3), Vector3.create(1.5, 2, 0.05))
  createWall(Vector3.create(3.25, 1, 3), Vector3.create(1.5, 2, 0.05))

  //Questa entità sarà il punto centrale intorno al quale la porta ruoterà quando viene aperta o chiusa.
  const doorPivotEntity = engine.addEntity()
  Transform.create(doorPivotEntity, {
    position: Vector3.create(4, 1, 3),
    rotation: closedPos
  })

  const doorEntity = createWall(Vector3.create(0.5, 0, 0), Vector3.create(1, 2, 0.05), doorPivotEntity) //crea l'entità della porta, La porta è anche collegata al pivot, in modo che possa ruotare intorno ad esso.

  //coloro la porta
  Material.setPbrMaterial(doorEntity, {
    albedoColor: Color4.Red(),
    metallic: 0.9,
    roughness: 0.1
  })

  //  Questo toggle cambierà lo stato della porta da aperto a chiuso e viceversa quando viene attivato dall'utente.
  utils.toggles.addToggle(doorPivotEntity, utils.ToggleState.Off, (value) => {
    if (value == utils.ToggleState.On) { //se ToggleState.On è True, significa che la porta deve essere aperta
      // open
      Tween.createOrReplace(doorPivotEntity, { //serve per ruotare la porta da closed a open
        mode: Tween.Mode.Rotate({
          start: closedPos,
          end: openPos
        }),
        duration: 500,
        easingFunction: EasingFunction.EF_EASEINSINE
      })
    } else {
      // close
      Tween.createOrReplace(doorPivotEntity, {
        mode: Tween.Mode.Rotate({
          start: openPos,
          end: closedPos
        }),
        duration: 500,
        easingFunction: EasingFunction.EF_EASEINSINE
      })
    }
  })

  //gestisce l'evento di click sulla porta, consentendo all'utente di aprire e chiudere la porta semplicemente cliccandoci sopra
  pointerEventsSystem.onPointerDown(
    {
      entity: doorEntity,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: 'Open / Close'
      }
    },
    () => {
      utils.toggles.flip(doorPivotEntity)
    }
  )
}

function createWall(position: Vector3, scale: Vector3, parent?: Entity) {
  const WallEntity = engine.addEntity()
  Transform.create(WallEntity, {
    position,
    scale,
    parent
  })
  MeshRenderer.setBox(WallEntity)
  MeshCollider.setBox(WallEntity)
  return WallEntity
}
