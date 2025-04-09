import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import * as admin from 'firebase-admin';
import { 
  AppointmentDto, 
  UpdateAppointmentDto, 
  AppointmentStatus,
  MedicalNotesDto
} from './dto/appointment.dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);
  private readonly appointmentsCollection = 'appointments';

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Get Firestore instance
   */
  private get firestore() {
    return admin.firestore();
  }

  /**
   * Get appointment by ID
   */
  async findById(id: string): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.appointmentsCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      return {
        id: doc.id,
        ...doc.data(),
      };
    } catch (error) {
      this.logger.error(`Error getting appointment by ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  async create(appointmentDto: AppointmentDto): Promise<any> {
    try {
      // Check for time conflicts
      await this.checkTimeConflicts(
        appointmentDto.doctorId,
        appointmentDto.date,
        appointmentDto.startTime,
        appointmentDto.endTime
      );

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...appointmentDto,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const docRef = await this.firestore.collection(this.appointmentsCollection).add(data);
      const newDoc = await docRef.get();

      return {
        id: docRef.id,
        ...newDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error creating appointment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  async update(id: string, updateAppointmentDto: UpdateAppointmentDto): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.appointmentsCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      // If updating time, check for conflicts
      if (updateAppointmentDto.date || updateAppointmentDto.startTime || updateAppointmentDto.endTime) {
        const currentData = doc.data();
        await this.checkTimeConflicts(
          currentData.doctorId,
          updateAppointmentDto.date || currentData.date,
          updateAppointmentDto.startTime || currentData.startTime,
          updateAppointmentDto.endTime || currentData.endTime,
          id // Exclude current appointment from conflict check
        );
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const data = {
        ...updateAppointmentDto,
        updatedAt: timestamp,
      };

      await docRef.update(data);
      const updatedDoc = await docRef.get();

      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error updating appointment: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update appointment status
   */
  async updateStatus(id: string, status: AppointmentStatus): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.appointmentsCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update({
        status,
        updatedAt: timestamp,
      });

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error updating appointment status: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add medical notes to an appointment
   */
  async addMedicalNotes(id: string, medicalNotesDto: MedicalNotesDto): Promise<any> {
    try {
      const docRef = this.firestore.collection(this.appointmentsCollection).doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new NotFoundException(`Appointment with ID ${id} not found`);
      }

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      await docRef.update({
        ...medicalNotesDto,
        updatedAt: timestamp,
      });

      const updatedDoc = await docRef.get();
      return {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      };
    } catch (error) {
      this.logger.error(`Error adding medical notes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get appointments by doctor ID
   */
  async findByDoctorId(doctorId: string, status?: string, page = 1, limit = 10): Promise<PaginatedResponseDto<any>> {
    try {
      let query = this.firestore
        .collection(this.appointmentsCollection)
        .where('doctorId', '==', doctorId);

      if (status) {
        query = query.where('status', '==', status);
      }

      return this.paginateQuery(query, page, limit);
    } catch (error) {
      this.logger.error(`Error getting appointments by doctor ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get appointments by patient ID
   */
  async findByPatientId(patientId: string, status?: string, page = 1, limit = 10): Promise<PaginatedResponseDto<any>> {
    try {
      let query = this.firestore
        .collection(this.appointmentsCollection)
        .where('patientId', '==', patientId);

      if (status) {
        query = query.where('status', '==', status);
      }

      return this.paginateQuery(query, page, limit);
    } catch (error) {
      this.logger.error(`Error getting appointments by patient ID: ${error.message}`);
      throw error;
    }
  }

  /**
   * Helper method to check for time conflicts
   */
  private async checkTimeConflicts(
    doctorId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<void> {
    // Get all appointments for the doctor on the given date
    let query = this.firestore
      .collection(this.appointmentsCollection)
      .where('doctorId', '==', doctorId)
      .where('date', '==', date)
      .where('status', '!=', AppointmentStatus.CANCELLED);

    const snapshot = await query.get();
    
    // Check for time conflicts
    for (const doc of snapshot.docs) {
      // Skip the current appointment if updating
      if (excludeId && doc.id === excludeId) {
        continue;
      }

      const appointment = doc.data();
      const existingStart = appointment.startTime;
      const existingEnd = appointment.endTime;

      // Check if the new appointment overlaps with an existing one
      const hasConflict = (
        (startTime >= existingStart && startTime < existingEnd) || // New start time is within existing appointment
        (endTime > existingStart && endTime <= existingEnd) || // New end time is within existing appointment
        (startTime <= existingStart && endTime >= existingEnd) // New appointment completely covers existing one
      );

      if (hasConflict) {
        throw new BadRequestException(`Time conflict with existing appointment from ${existingStart} to ${existingEnd}`);
      }
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
