/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";

admin.initializeApp();

// Dynamically load the NestJS app from the built backend code
// IMPORTANT: This assumes the backend is built and copied correctly
const { api } = require("../dist-backend/healthcare-backend/dist/main");

// Export the NestJS API as an HTTPS function named 'api'
// Any requests to https://<your-project-id>.cloudfunctions.net/api will be handled by your NestJS app
export { api };

// Optional: You can add other simple functions here if needed
// export const helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
