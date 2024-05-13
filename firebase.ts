import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountKey from "./serviceAccountKey.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountKey as ServiceAccount),
  storageBucket: "gs://kpop-management-sim.appspot.com",
});

export const bucket = admin.storage().bucket();
