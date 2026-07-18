import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'
import * as dotenv from 'dotenv'

dotenv.config()

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const FAQs = [
  { q: 'where is my seat', ans: { en: 'Check your digital ticket for the section and gate number. Signs in the concourse will point you to your exact section.', es: 'Revisa tu boleto digital para ver la sección y el número de puerta. Los letreros en el vestíbulo te guiarán a tu sección exacta.' } },
  { q: 'nearest food stand', ans: { en: 'Food and beverage stands are located every 50 meters on all concourses. Premium options are near Gate C.', es: 'Hay puestos de comida cada 50 metros en todos los pasillos. Hay opciones premium cerca de la Puerta C.' } },
  { q: 'accessible entrance', ans: { en: 'Gate D (West) is our dedicated accessible entrance with elevators and no-step access. Gate B also has accessible lanes.', es: 'La Puerta D (Oeste) es nuestra entrada accesible dedicada con elevadores y sin escalones. La Puerta B también tiene carriles accesibles.' } },
  { q: 'book parking', ans: { en: 'You can book parking through the Smart Parking section in the app. Zones A and B are for standard parking.', es: 'Puedes reservar estacionamiento a través de la sección Smart Parking en la aplicación. Las Zonas A y B son para estacionamiento estándar.' } },
  { q: 'medical emergency', ans: { en: 'Please alert the nearest staff member immediately. Medical stations are located at Gate A Level 1, Gate C Level 2, and the Main Concourse.', es: 'Por favor avisa al miembro del personal más cercano de inmediato. Las estaciones médicas están en la Puerta A Nivel 1, Puerta C Nivel 2 y el Vestíbulo Principal.' } },
  { q: 'buy merchandise', ans: { en: 'The main megastore is located at Gate A. There are also merchandise kiosks at every other gate.', es: 'La mega tienda principal está ubicada en la Puerta A. También hay quioscos de mercancía en todas las demás puertas.' } }
]

async function seed() {
  console.log('Seeding FAQ Cache...')
  let count = 0
  for (const faq of FAQs) {
    for (const [lang, answer] of Object.entries(faq.ans)) {
      const normalizedQ = faq.q.toLowerCase().trim().replace(/[^a-z0-9]/g, '')
      const cacheKey = `${lang}_${normalizedQ}`
      try {
        await setDoc(doc(db, 'faqCache', cacheKey), {
          question: faq.q,
          language: lang,
          answer: answer,
          timestamp: new Date().toISOString()
        })
        count++
      } catch (e) {
        console.error('Failed to save:', cacheKey, e)
      }
    }
  }
  console.log(`Seeded ${count} FAQs successfully.`)
  process.exit(0)
}

seed()
