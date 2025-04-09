import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientProfileDto, UpdatePatientProfileDto } from './dto/patient-profile.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getPatientById(@Param('id') id: string, @Req() req: any): Promise<ApiResponseDto<any>> {
    try {
      const patient = await this.patientsService.findById(id);
      
      // Check if the user is accessing their own profile
      if (req.user.uid !== patient.userId) {
        throw new BadRequestException('You can only access your own profile');
      }
      
      return ApiResponseDto.success(patient);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId')
  @UseGuards(FirebaseAuthGuard)
  async getPatientByUserId(@Param('userId') userId: string, @Req() req: any): Promise<ApiResponseDto<any>> {
    try {
      // Check if the user is accessing their own profile
      if (req.user.uid !== userId) {
        throw new BadRequestException('You can only access your own profile');
      }
      
      const patient = await this.patientsService.findByUserId(userId);
      if (!patient) {
        return ApiResponseDto.success(null, 'No patient profile found for this user');
      }
      return ApiResponseDto.success(patient);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createPatientProfile(
    @Body() patientProfileDto: PatientProfileDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Ensure the user can only create a profile for themselves
      if (req.user.uid !== patientProfileDto.userId) {
        throw new BadRequestException('You can only create a profile for yourself');
      }

      const patient = await this.patientsService.create(patientProfileDto);
      return ApiResponseDto.success(patient, 'Patient profile created successfully');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async updatePatientProfile(
    @Param('id') id: string,
    @Body() updatePatientProfileDto: UpdatePatientProfileDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the patient profile to check ownership
      const patient = await this.patientsService.findById(id);
      
      // Ensure the user can only update their own profile
      if (req.user.uid !== patient.userId) {
        throw new BadRequestException('You can only update your own profile');
      }

      const updatedPatient = await this.patientsService.update(id, updatePatientProfileDto);
      return ApiResponseDto.success(updatedPatient, 'Patient profile updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id/medical-history')
  @UseGuards(FirebaseAuthGuard)
  async updateMedicalHistory(
    @Param('id') id: string,
    @Body('medicalHistory') medicalHistory: string[],
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the patient profile to check ownership
      const patient = await this.patientsService.findById(id);
      
      // Ensure the user can only update their own profile
      if (req.user.uid !== patient.userId) {
        throw new BadRequestException('You can only update your own medical history');
      }

      const updatedPatient = await this.patientsService.updateMedicalHistory(id, medicalHistory);
      return ApiResponseDto.success(updatedPatient, 'Medical history updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
