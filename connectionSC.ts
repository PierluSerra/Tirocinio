// Importazione delle librerie necessarie
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
import { changeColorSystem, circularSystem } from './systems'

import { getPlayer } from '@dcl/sdk/src/players' // Importa la funzione getPlayer dal modulo @dcl/sdk/src/players
import { createEthereumProvider } from '@dcl/sdk/ethereum-provider' // Importa la funzione createEthereumProvider dal modulo @dcl/sdk/ethereum-provider
import { RequestManager, ContractFactory } from 'eth-connect' // Importa RequestManager e ContractFactory dal modulo eth-connect
import { executeTask } from '@dcl/sdk/ecs' //Per usare la funzione executeTask ho dovuto imolementare questa funzione


// ABI per lo SmartContract
const contractAbi = [ 	
  { 		
    "inputs": [ 			
      { 				
        "internalType": "address", 				
        "name": "_address", 				
        "type": "address" 			
      } 		
    ], 		
    "name": 
      "setMetaMaskAddress", 		
      "outputs": [], 		
    "stateMutability": 
    "nonpayable", 		
    "type": 
    "function" 	
  }, 	
  { 		
    "inputs": [], 		
    "name": "getMetaMaskAddress", 		
    "outputs": [ 			
      { 				
        "internalType": "address", 				
        "name": "", 				
        "type": "address" 			
      } 		
    ], 		
    "stateMutability": 
      "view", 		
      "type": 
      "function" 	
  }, 	
    { 		
      "inputs": [], 		
      "name": 
      "userAddress", 		
      "outputs": [ 			
        { 				
          "internalType": "address", 				
          "name": "", 				
          "type": "address" 			
        } 		], 		
        
      "stateMutability": "view", 		
      "type": "function" 	
    } 
];

const contractAddress = '0xe666A0E5c72e5Df911Eb42762B36A7708b3166b2'; // Indirizzo dello smart contract

//indirizzo autorizzato
//const authorizedAddress = '0xa8f01292f34e72954328c73ec3479528e0645b7d' // questo è il mio address di MetaMask

const openPos: Quaternion = Quaternion.create(0, 1, 0)
const closedPos: Quaternion = Quaternion.create(0, 0, 0)

// Funzione principale asincrona
executeTask(async () => {
  let userData = getPlayer() //prende le specifiche del giocatore
    try {
        engine.addSystem(circularSystem)
        engine.addSystem(changeColorSystem)
    
        // Inizializzazione del provider Ethereum
        const provider = createEthereumProvider() // Crea un provider Ethereum
        const requestManager = new RequestManager(provider) // Crea un gestore delle richieste usando il provider
        const factory = new ContractFactory(requestManager, contractAbi) // Crea una factory per il contratto utilizzando il gestore delle richieste e l'ABI
        
        const contract = (await factory.at(
            contractAddress
        )) as any // Ottiene un'istanza del contratto specificando il suo indirizzo

        // Verifica se l'utente è null o undefined prima di accedere, senza questo if dava errori su userData
        if (userData && !userData.isGuest) {
          // Ottieni l'indirizzo MetaMask memorizzato nello smart contract
          const storedAddress = await contract.getMetaMaskAddress();
          console.log("Indirizzo MetaMask memorizzato nello smart contract:", storedAddress);

          //associo ad un altra variabile l'indirizzo del player
          const userAddress = userData.userId
          console.log("Indirizzo Player:", userAddress);

          
          // Variabile booleana per l'autorizzazione dell'utente
          const isAuthorized = check(storedAddress, userAddress)
          console.log("Autorizzazione impostata a:", isAuthorized)

          setupDoor(isAuthorized)
        }

    } catch (error: any) { // Gestione degli errori
        console.log(error.toString()) // Stampa l'errore
    }
})

//questa funzione mi permette di controllare se i due indirizzi siano uguali
function check(storedAddress: any, userAddress: any): boolean {
  //faccio una normalizzazione dei dati perché ho notato che alcune lettere erano in maiuscolo o in minuscolo
  const storedAddressNormalized = storedAddress.toUpperCase();
  const userAddressNormalized = userAddress.toUpperCase();

  //controllo se i due indirizzi normalizzati sono uguali
  return storedAddressNormalized === userAddressNormalized;
}

function setupDoor(isAuthorized: boolean){
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

  if(isAuthorized){
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
  }else{
    Tween.createOrReplace(doorPivotEntity, {
          mode: Tween.Mode.Rotate({
            start: openPos,
            end: closedPos
          }),
          duration: 500,
          easingFunction: EasingFunction.EF_EASEINSINE
        })
  }
 

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
