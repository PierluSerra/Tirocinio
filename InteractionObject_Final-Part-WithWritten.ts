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
import { TextShape } from "@dcl/sdk/ecs"

// ABI dello SmartContract
const contractAbi = [
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "setAuth",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "isAuth",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

//Variabile che memorizza l'indirizzo dello SmartContract
const contractAddress = '0xC7135F80Aa2C50b116350F3bB80bE1de7b5027C9'; 

// Variabili che vengono utilizzate per l'interazione con la porta(Apertura e Chiusura)
const openPos: Quaternion = Quaternion.create(0, 1, 0)
const closedPos: Quaternion = Quaternion.create(0, 0, 0)

// Variabile sentinella che mi permette di aprire la porta
let isAuthorized = false

// Variabile per aprire la porta(Pivot)
let doorPivotEntity: Entity;

let colorDoor = false

// Funzione principale asincrona
executeTask(async () => {
  // Variabile che permette di prendere le specifiche del giocatore
  let userData = getPlayer() 

    try {
        engine.addSystem(circularSystem)
        engine.addSystem(changeColorSystem)

        // Verifico se il player che sta interagendo con la scena è Loggato con metamask o no
        if (userData && !userData.isGuest) {
          // Creo ed associo ad un altra variabile l'indirizzo del Player
          const userAddress = userData.userId
          console.log("Indirizzo Player:", userAddress); // Faccio una log per controllare l'indirizzo del Player(pratica usata come debugging)

          // Richiamo la funzione per la creazione della porta con variabile della check a false poiché l'utente non è autorizzato
          setupDoor()

          // Richiamo una delle funzioni principali di questo script, che mostra i muri con la porta e permette di interagirci se Autorizzati
          createButton(Vector3.create(3, 1, 6), Vector3.create(0.3, 0.3, 0.3))
        }

    } catch (error: any) { // Gestione degli errori
        console.log(error.toString()) // Stampa l'errore
    }
})

async function registerUser(){
  try {
    // Log di Debug
    console.log("Primo Punto")

   // Inizializzazione del Provider Ethereum
   const provider = createEthereumProvider() // Crea un provider Ethereum
   const requestManager = new RequestManager(provider) // Crea un gestore delle richieste usando il provider
   const factory = new ContractFactory(requestManager, contractAbi) // Crea una factory per il contratto utilizzando il gestore delle richieste e l'ABI
   
   // Log di Debug
   console.log("Secondo Punto, Provider, Request e Factory")

   // Mi creo una variabile per memorizzare lo SmartContract, specificando il suo indirizzo (ciò avviene grazie alla variabile contractAddress)
   const contract = (await factory.at(
       contractAddress
   )) as any 

   // Log di Debug
   console.log("Terzo Punto, Creazione del Contratto")

   // Prendo le Specifiche del Player
   let userData = getPlayer()

		if (userData && !userData.isGuest) {
        // Estrapolo il Numero del Blocco
        const block = await requestManager.eth_blockNumber()
        // Estrapolo il Numero della Transazione
        console.log(await requestManager.eth_getTransactionCount(userData.userId, block))

        // Log di Debug
        console.log("Quarto Punto, Dentro l'IF")

        // Res è la variabile con l'indirizzo della mia transazione, in questo caso richiamo la funzione setAuth presente nello SmartContract
        const res = await contract.setAuth(
        userData.userId,
        {
          from: userData.userId,
        }
      )

      // Log di Debug
      console.log("Quinto Punto, Dopo la chiamata della funzione")

      // Richiamo della funzione che permette di estrapolare la ricevuto della transazione, passando l'indirizzo della transazione
      transactionReceived(res)
    }

  } catch (error) {
      // Nel caso in cui nel codice sopra accadesse un errore, manda in esecuzione un error
      console.error('Errore durante la registrazione dell\'utente:', error);
  }
}

// Funzione che mi permette di Estrapolare la ricevuta di una transazione
async function transactionReceived(res: any){
  // Inizializzazione del Provider Ethereum
  const provider = createEthereumProvider() // Crea un provider Ethereum
  const requestManager = new RequestManager(provider) // Crea un gestore delle richieste usando il provider

  // Estrapolo la "ricevuta"(i dati) di una specifica transazione
  let tx_receipt1 = await requestManager.eth_getTransactionReceipt(res)
  console.log(tx_receipt1) // Stampo i dati della transazione (In questo momento è null)

  // Creo una seconda variabile che mi permetterà di fare un confronto con la variabile che possiede i dati della transazione
  let tx_receipt2 = tx_receipt1 // in questo momento tutte e due le variabili sono 'null'

  // Esce dal ciclo quando tx_receipt2 estrapolerà un valore diverso da quello contenuto in tx_receipt1(Ovvero quando assumerà la ricevutà della transazione)
  while(tx_receipt1 == tx_receipt2){
    tx_receipt2 = await requestManager.eth_getTransactionReceipt(res)
  } 

  const sign = engine.addEntity()
  Transform.create(sign, {
    position: Vector3.create(3.5, 1, 8),
  })

  TextShape.create(sign, {
    text: 'You can open the door',
    fontSize: 2
  })

  colorDoor = true

  // Log di Debug, mostra la transazione   
  console.log(tx_receipt2)

  // Imposto la variabile sentinella per l'apertura della porta a true(L'utente in questo punto è autorizzato)
  isAuthorized = true
  console.log(isAuthorized)

  // Rimuovo la vecchia Porta
  removeDoor()

  // Richiamo la creazione della porta
  setupDoor()
}

// Funzione che permette la Creazione/Interazione dei muri e della porta
function setupDoor(){
  // Creazione dei muri
  createWall(Vector3.create(5.75, 1, 3), Vector3.create(1.5, 2, 0.05))
  createWall(Vector3.create(3.25, 1, 3), Vector3.create(1.5, 2, 0.05))

  //Questa entità sarà il punto centrale intorno al quale la porta ruoterà quando viene aperta o chiusa.
  doorPivotEntity = engine.addEntity()
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

  if(colorDoor){
    Material.setPbrMaterial(doorEntity, {
      albedoColor: Color4.Green(), 
      metallic: 0.9, 
      roughness: 0.1
    })
  }

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

// Funzione per rimuovere la porta
function removeDoor() {
  if(doorPivotEntity){
    engine.removeEntity(doorPivotEntity)
  }
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

function createButton(position: Vector3, scale: Vector3, parent?: Entity){
  const ButtonEnity = engine.addEntity()
  Transform.create(ButtonEnity, {
    position,
    scale,
    parent
  })
  MeshRenderer.setBox(ButtonEnity)
  MeshCollider.setBox(ButtonEnity)

   // Colori del button quando è attivo e quando è cliccato
   const buttonActiveColor = Color4.fromHexString('#00FF00') // Green
   const buttonClickedColor = Color4.fromHexString('#FF0000') // Red
 
   // Gestisce l'evento di click sul button
   pointerEventsSystem.onPointerDown(
     {
       entity: ButtonEnity,
       opts: {
         button: InputAction.IA_PRIMARY,
         hoverText: 'Click me!' // Testo che apparirà quando il puntatore sarà sopra il button
       }
     },
     () => {
       // Cambia il colore del button quando viene cliccato
       Material.setPbrMaterial(ButtonEnity, {
         albedoColor: buttonClickedColor,
         metallic: 0.9,
         roughness: 0.1
       })
       registerUser()
       console.log('Button clicked!') // Azione eseguita quando il button viene cliccato
     }
   )

  return ButtonEnity
}

