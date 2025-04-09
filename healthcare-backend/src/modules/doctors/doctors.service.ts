import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { DoctorProfileDto, UpdateDoctorProfileDto } from './dto/doctor-profile.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);
  private readonly doctorProfilesCollection = 'doctorProfiles';

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get Firestore instance
   */
  private get firestore() {
    return admin.firestore();
  }

  /**
   * Get doctor profile by ID
   */
  async findById(id: string): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.doctorProfilesCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Doctor profile with ID ${id} not found`);
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error(`Error getting doctor profile by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get doctor profile by user ID (Firebase UID)
   */
  async findByUserId(userId: string): Promise<any> {
    try {
      const snapshot = await this.firestore
        .collection(this.doctorProfilesCollection)
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
      this.logger.error(`Error getting doctor profile by user ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new doctor profile
   */
  async create(doctorProfileDto: DoctorProfileDto): Promise<any> {
    try {
      // Check if profile already exists for this user
      const existingProfile = await this.findByUserId(doctorProfileDto.userId);
      if (existingProfile) {
        throw new Error(`Doctor profile already exists for user ID ${doctorProfileDto.userId}`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...doctorProfileDto,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await this.firestore.collection(this.doctorProfilesCollection).add(data);
      const newDoc = await docRef.get();

      return {
        id: docRef.id,
        ...newDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error creating doctor profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing doctor profile
   */
  async update(id: string, updateDoctorProfileDto: UpdateDoctorProfileDto): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.doctorProfilesCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Doctor profile with ID ${id} not found`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...updateDoctorProfileDto,
        updatedAt: timestamp,
      };

      await docRef.update(data);
      const updatedDoc = await docRef.get();

      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error updating doctor profile: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for doctors by specialty
   */
  async searchBySpecialty(specialty: string, page = 1, limit = 10): Promise<PaginatedResponseDto<any>> {
    try {
      const query = this.firestore
        .collection(this.doctorProfilesCollection)
        .where('specialty', '==', specialty);

      return this.paginateQuery(query, page, limit);
    } catch (error) {
      this.logger.error(`Error searching doctors by specialty: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for doctors by location
   */
  async searchByLocation(location: string, page = 1, limit = 10): Promise<PaginatedResponseDto<any>> {
    try {
      const query = this.firestore
        .collection(this.doctorProfilesCollection)
        .where('location', '==', location);

      return this.paginateQuery(query, page, limit);
    } catch (error) {
      this.logger.error(`Error searching doctors by location: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper method to paginate Firestore queries
   */
  private async paginateQuery(
    query: FirebaseFirestore.Query,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponseDto<any>> {
    // Get total count (this is inefficient in Firestore but necessary for pagination)
    const countSnapshot = await query.get();
    const total = countSnapshot.size;

    // Calculate pagination
    const offset = (page - 1) * limit;
    const paginatedQuery = query.limit(limit).offset(offset);

    // Get paginated results
    const snapshot = await paginatedQuery.get();
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return new PaginatedResponseDto(data, total, page, limit);
  }
}
