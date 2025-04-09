import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';
import * as path from 'path';
import * as fs from 'fs'; // Import fs to check file existence

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  // Assume serviceAccountKey.json is in the healthcare-backend root directory
  // process.cwd() usually points to the project root when running via npm scripts
  private readonly serviceAccountPath = path.join(
    // Use process.env.SERVICE_ACCOUNT_KEY_PATH for better configuration
    process.env.SERVICE_ACCOUNT_KEY_PATH || path.join(process.cwd(), 'serviceAccountKey.json')
  );


  onModuleInit() {
    this.logger.log(`Attempting to initialize Firebase Admin SDK with key path: ${this.serviceAccountPath}`);

    if (!fs.existsSync(this.serviceAccountPath)) {
        this.logger.error(`Service account key file not found at: ${this.serviceAccountPath}`);
        this.logger.error(`Current working directory: ${process.cwd()}`);
        this.logger.error(`Please ensure 'serviceAccountKey.json' exists in the 'healthcare-backend' directory or set the SERVICE_ACCOUNT_KEY_PATH environment variable.`);
        // Decide how to handle this - throw error to prevent startup?
        throw new Error(`Service account key file not found at: ${this.serviceAccountPath}`);
    }

    try {
      // Check if Firebase Admin is already initialized to prevent errors during hot-reloads
      if (admin.apps.length === 0) {
        admin.initializeApp({
          credential: admin.credential.cert(this.serviceAccountPath),
        });
        this.logger.log('Firebase Admin SDK Initialized Successfully.');
      } else {
         this.logger.log('Firebase Admin SDK already initialized.');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase Admin SDK:', error);
      throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
    }
  }

  async verifyToken(token: string): Promise<DecodedIdToken> {
    if (!token) {
      throw new Error('No token provided for verification.');
    }
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken;
    } catch (error) {
      this.logger.error(`Error verifying Firebase token: ${error.message}`);
      // Provide more context if possible, but avoid leaking sensitive info
      if (error.code === 'auth/id-token-expired') {
          throw new Error('Firebase token has expired.');
      }
      if (error.code === 'auth/argument-error') {
          this.logger.warn('Token verification failed, possibly invalid token format.');
      }
      throw new Error('Invalid or expired Firebase token.');
    }
  }

  getAuth() {
    // Ensure SDK is initialized before returning auth object
     if (admin.apps.length === 0) {
         this.logger.error('Firebase Admin SDK not initialized when trying to get auth instance.');
         throw new Error('Firebase Admin SDK not initialized.');
     }
    return admin.auth();
  }
}
