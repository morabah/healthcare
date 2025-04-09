import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class DoctorProfileDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  languages?: string;

  @IsString()
  @IsOptional()
  yearsOfExperience?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  professionalBio?: string;

  @IsString()
  @IsOptional()
  consultationFee?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}

export class UpdateDoctorProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  languages?: string;

  @IsString()
  @IsOptional()
  yearsOfExperience?: string;

  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  professionalBio?: string;

  @IsString()
  @IsOptional()
  consultationFee?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}
