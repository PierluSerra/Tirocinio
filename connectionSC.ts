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


// ABI dello SmartContract
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

//Variabile che memorizza l'indirizzo dello SmartContract
const contractAddress = '0xe666A0E5c72e5Df911Eb42762B36A7708b3166b2'; 

// Variabili che vengono utilizzate per l'interazione con la porta(Apertura e Chiusura)
const openPos: Quaternion = Quaternion.create(0, 1, 0)
const closedPos: Quaternion = Quaternion.create(0, 0, 0)

// Funzione principale asincrona
executeTask(async () => {
  // Variabile che permette di prendere le specifiche del giocatore
  let userData = getPlayer() 

    try {
        engine.addSystem(circularSystem)
        engine.addSystem(changeColorSystem)
    
        // Inizializzazione del Provider Ethereum
        const provider = createEthereumProvider() // Crea un provider Ethereum
        const requestManager = new RequestManager(provider) // Crea un gestore delle richieste usando il provider
        const factory = new ContractFactory(requestManager, contractAbi) // Crea una factory per il contratto utilizzando il gestore delle richieste e l'ABI
        
        // Mi creo una variabile per memorizzare lo SmartContract, specificando il suo indirizzo (ciò avviene grazie alla variabile contractAddress)
        const contract = (await factory.at(
            contractAddress
        )) as any 

        // Verifico se il player che sta interagendo con la scena è Loggato con metamask o no
        if (userData && !userData.isGuest) {
          // Ottengo l'indirizzo MetaMask memorizzato nello SmartContract grazie alla funzione getMetaMaskAddress inizializzata all'interno di esso
          const storedAddress = await contract.getMetaMaskAddress();
          console.log("Indirizzo MetaMask memorizzato nello smart contract:", storedAddress); //Faccio una log per un controllo di Routine

          // Creo ed associo ad un altra variabile l'indirizzo del Player
          const userAddress = userData.userId
          console.log("Indirizzo Player:", userAddress); // Faccio una log per controllare l'indirizzo del Player(pratica usata come debugging)

          
          // In queste righe di codice creo una variabile Booleana che viene settata grazie alla funzione check che controlla i due Address
          const isAuthorized = check(storedAddress, userAddress) // Variabile booleana per l'autorizzazione dell'utente
          console.log("Autorizzazione impostata a:", isAuthorized) // Log di Debugging

          // Richiamo una delle funzioni principali di questo script, che mostra i muri con la porta e permette di interagirci se Autorizzati
          setupDoor(isAuthorized)
        }

    } catch (error: any) { // Gestione degli errori
        console.log(error.toString()) // Stampa l'errore
    }
})

// Funzione che Returna True solo se i due indirizzi sono uguali(Confronto)
function check(storedAddress: any, userAddress: any): boolean {
  // Eseguo una Normalizzazione dei dati perché i due indirizzi possono essere uguali ma con Maiuscole/Minuscole
  const storedAddressNormalized = storedAddress.toUpperCase(); 
  const userAddressNormalized = userAddress.toUpperCase();

  // Confronto dei due indirizzi Normalizzati
  return storedAddressNormalized === userAddressNormalized;
}

// Funzione che permette la Creazione/Interazione dei muri e della porta
function setupDoor(isAuthorized: boolean){
  // Creazione dei muri
  createWall(Vector3.create(5.75, 1, 3), Vector3.create(1.5, 2, 0.05))
  createWall(Vector3.create(3.25, 1, 3), Vector3.create(1.5, 2, 0.05))

  //Questa entità sarà il punto centrale intorno al quale la porta ruoterà quando viene aperta o chiusa.
  const doorPivotEntity = engine.addEntity()
  Transform.create(doorPivotEntity, {
    position: Vector3.create(4, 1, 3),
    rotation: closedPos
  })

  // Creazione dell'entità della porta, La porta è anche collegata al pivot, in modo che possa ruotare intorno ad esso.
  const doorEntity = createWall(Vector3.create(0.5, 0, 0), Vector3.create(1, 2, 0.05), doorPivotEntity) 
  
  // Colorazione della porta
  Material.setPbrMaterial(doorEntity, {
    albedoColor: Color4.Red(),
    metallic: 0.9,
    roughness: 0.1
  })

  // Nel caso in cui l'utente non sia autorizzato, la porta non deve aprirsi.
  // Viene eseguito un check per vedere se l'utente è autorizzato(isAuthorized == True) o meno.
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
  }else{ // Nel caso non sia Autorizzato, la porta rimarrà sempre chiusa
    Tween.createOrReplace(doorPivotEntity, {
          mode: Tween.Mode.Rotate({
            start: openPos,
            end: closedPos
          }),
          duration: 500,
          easingFunction: EasingFunction.EF_EASEINSINE
        })
  }
 
  // Gestisce l'evento di click sulla porta, consentendo all'utente di aprire e chiudere la porta semplicemente cliccandoci sopra
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

// Funzione che permette la creazione dei Muri
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
