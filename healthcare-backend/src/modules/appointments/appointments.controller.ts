import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { 
  AppointmentDto, 
  UpdateAppointmentDto, 
  UpdateAppointmentStatusDto,
  MedicalNotesDto
} from './dto/appointment.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getAppointmentById(@Param('id') id: string, @Req() req: any): Promise<ApiResponseDto<any>> {
    try {
      const appointment = await this.appointmentsService.findById(id);
      
      // Check if the user is authorized to view this appointment
      // User must be either the patient or the doctor
      if (req.user.uid !== appointment.patientId && req.user.uid !== appointment.doctorId) {
        throw new ForbiddenException('You are not authorized to view this appointment');
      }
      
      return ApiResponseDto.success(appointment);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createAppointment(
    @Body() appointmentDto: AppointmentDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Ensure the user can only create appointments for themselves as a patient
      if (req.user.uid !== appointmentDto.patientId) {
        throw new ForbiddenException('You can only book appointments for yourself');
      }

      const appointment = await this.appointmentsService.create(appointmentDto);
      return ApiResponseDto.success(appointment, 'Appointment created successfully');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async updateAppointment(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the appointment to check authorization
      const appointment = await this.appointmentsService.findById(id);
      
      // Only the patient who booked the appointment can update it
      if (req.user.uid !== appointment.patientId) {
        throw new ForbiddenException('You can only update appointments you booked');
      }

      // Cannot update completed or cancelled appointments
      if (appointment.status === 'completed' || appointment.status === 'cancelled') {
        throw new BadRequestException('Cannot update completed or cancelled appointments');
      }

      const updatedAppointment = await this.appointmentsService.update(id, updateAppointmentDto);
      return ApiResponseDto.success(updatedAppointment, 'Appointment updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/status')
  @UseGuards(FirebaseAuthGuard)
  async updateAppointmentStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAppointmentStatusDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the appointment to check authorization
      const appointment = await this.appointmentsService.findById(id);
      
      // Only the doctor or patient involved can update the status
      if (req.user.uid !== appointment.doctorId && req.user.uid !== appointment.patientId) {
        throw new ForbiddenException('You are not authorized to update this appointment');
      }

      // Patients can only cancel appointments
      if (req.user.uid === appointment.patientId && updateStatusDto.status !== 'cancelled') {
        throw new ForbiddenException('Patients can only cancel appointments');
      }

      const updatedAppointment = await this.appointmentsService.updateStatus(id, updateStatusDto.status);
      return ApiResponseDto.success(updatedAppointment, 'Appointment status updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/medical-notes')
  @UseGuards(FirebaseAuthGuard)
  async addMedicalNotes(
    @Param('id') id: string,
    @Body() medicalNotesDto: MedicalNotesDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the appointment to check authorization
      const appointment = await this.appointmentsService.findById(id);
      
      // Only the doctor can add medical notes
      if (req.user.uid !== appointment.doctorId) {
        throw new ForbiddenException('Only the doctor can add medical notes');
      }

      // Can only add notes to completed appointments
      if (appointment.status !== 'completed') {
        throw new BadRequestException('Can only add medical notes to completed appointments');
      }

      const updatedAppointment = await this.appointmentsService.addMedicalNotes(id, medicalNotesDto);
      return ApiResponseDto.success(updatedAppointment, 'Medical notes added successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('doctor/:doctorId')
  @UseGuards(FirebaseAuthGuard)
  async getAppointmentsByDoctorId(
    @Param('doctorId') doctorId: string,
    @Query('status') status: string,
    @Query() paginationDto: PaginationDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Only the doctor can view their appointments
      if (req.user.uid !== doctorId) {
        throw new ForbiddenException('You can only view your own appointments');
      }

      const { page, limit } = paginationDto;
      const appointments = await this.appointmentsService.findByDoctorId(doctorId, status, page, limit);
      return ApiResponseDto.success(appointments);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('patient/:patientId')
  @UseGuards(FirebaseAuthGuard)
  async getAppointmentsByPatientId(
    @Param('patientId') patientId: string,
    @Query('status') status: string,
    @Query() paginationDto: PaginationDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Only the patient can view their appointments
      if (req.user.uid !== patientId) {
        throw new ForbiddenException('You can only view your own appointments');
      }

      const { page, limit } = paginationDto;
      const appointments = await this.appointmentsService.findByPatientId(patientId, status, page, limit);
      return ApiResponseDto.success(appointments);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
