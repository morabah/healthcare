import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { DoctorProfileDto, UpdateDoctorProfileDto } from './dto/doctor-profile.dto';
import { ApiResponseDto } from '../common/dto/api-response.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  async getDoctorById(@Param('id') id: string): Promise<ApiResponseDto<any>> {
    try {
      const doctor = await this.doctorsService.findById(id);
      return ApiResponseDto.success(doctor);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('user/:userId')
  @UseGuards(FirebaseAuthGuard)
  async getDoctorByUserId(@Param('userId') userId: string): Promise<ApiResponseDto<any>> {
    try {
      const doctor = await this.doctorsService.findByUserId(userId);
      if (!doctor) {
        return ApiResponseDto.success(null, 'No doctor profile found for this user');
      }
      return ApiResponseDto.success(doctor);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  async createDoctorProfile(
    @Body() doctorProfileDto: DoctorProfileDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Ensure the user can only create a profile for themselves
      if (req.user.uid !== doctorProfileDto.userId) {
        throw new BadRequestException('You can only create a profile for yourself');
      }

      const doctor = await this.doctorsService.create(doctorProfileDto);
      return ApiResponseDto.success(doctor, 'Doctor profile created successfully');
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  async updateDoctorProfile(
    @Param('id') id: string,
    @Body() updateDoctorProfileDto: UpdateDoctorProfileDto,
    @Req() req: any,
  ): Promise<ApiResponseDto<any>> {
    try {
      // Get the doctor profile to check ownership
      const doctor = await this.doctorsService.findById(id);
      
      // Ensure the user can only update their own profile
      if (req.user.uid !== doctor.userId) {
        throw new BadRequestException('You can only update your own profile');
      }

      const updatedDoctor = await this.doctorsService.update(id, updateDoctorProfileDto);
      return ApiResponseDto.success(updatedDoctor, 'Doctor profile updated successfully');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('search')
  async searchDoctors(
    @Query('specialty') specialty: string,
    @Query('location') location: string,
    @Query() paginationDto: PaginationDto,
  ): Promise<ApiResponseDto<any>> {
    try {
      const { page, limit } = paginationDto;
      
      if (specialty) {
        const doctors = await this.doctorsService.searchBySpecialty(specialty, page, limit);
        return ApiResponseDto.success(doctors);
      } else if (location) {
        const doctors = await this.doctorsService.searchByLocation(location, page, limit);
        return ApiResponseDto.success(doctors);
      } else {
        throw new BadRequestException('Either specialty or location must be provided');
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
