import { initializeApp, getApps } from "firebase/app";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApps()[0];

// getFirestore() usa o transporte de streaming (WebChannel/HTTP2) por
// padrão, que alguns firewalls/antivírus/VPNs locais bloqueiam ou
// interferem, causando "Could not reach Cloud Firestore backend" mesmo com
// internet normal. experimentalAutoDetectLongPolling tenta o caminho
// rápido primeiro e cai pra long-polling automaticamente só se precisar —
// sem isso, código rodando no servidor (Next.js Server Components, ex.
// getInitialData em app/page.tsx) é o mais exposto a esse tipo de bloqueio.
// initializeFirestore só pode ser chamado uma vez por app, por isso o
// guard isNewApp: em hot-reload local, getApps() já reaproveita a
// instância existente (que já foi inicializada com essa opção).
export const db = isNewApp
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
