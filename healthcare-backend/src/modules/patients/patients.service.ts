import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { PatientProfileDto, UpdatePatientProfileDto } from './dto/patient-profile.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);
  private readonly patientProfilesCollection = 'patientProfiles';

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get Firestore instance
   */
  private get firestore() {
    return admin.firestore();
  }

  /**
   * Get patient profile by ID
   */
  async findById(id: string): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.patientProfilesCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Patient profile with ID ${id} not found`);
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error(`Error getting patient profile by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get patient profile by user ID (Firebase UID)
   */
  async findByUserId(userId: string): Promise<any> {
    try {
      const snapshot = await this.firestore
        .collection(this.patientProfilesCollection)
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error(`Error getting patient profile by user ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new patient profile
   */
  async create(patientProfileDto: PatientProfileDto): Promise<any> {
    try {
      // Check if profile already exists for this user
      const existingProfile = await this.findByUserId(patientProfileDto.userId);
      if (existingProfile) {
        throw new Error(`Patient profile already exists for user ID ${patientProfileDto.userId}`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...patientProfileDto,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await this.firestore.collection(this.patientProfilesCollection).add(data);
      const newDoc = await docRef.get();

      return {
        id: docRef.id,
        ...newDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error creating patient profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing patient profile
   */
  async update(id: string, updatePatientProfileDto: UpdatePatientProfileDto): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.patientProfilesCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Patient profile with ID ${id} not found`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...updatePatientProfileDto,
        updatedAt: timestamp,
      };

      await docRef.update(data);
      const updatedDoc = await docRef.get();

      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error updating patient profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(id: string, medicalHistory: string[]): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.patientProfilesCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Patient profile with ID ${id} not found`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update({
        medicalHistory,
        updatedAt: timestamp,
      });

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error updating medical history: ${error.message}`);
      throw error;
    }
  }
}
