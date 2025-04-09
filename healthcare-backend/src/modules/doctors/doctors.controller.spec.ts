import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

// Mock DoctorsService
const mockDoctorsService = {
  findById: jest.fn(),
  findByUserId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  searchBySpecialty: jest.fn(),
  searchByLocation: jest.fn(),
};

// Mock FirebaseAuthGuard
const mockFirebaseAuthGuard = {
  canActivate: jest.fn().mockImplementation(() => true),
};

describe('DoctorsController', () => {
  let controller: DoctorsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorsController],
      providers: [
        {
          provide: DoctorsService,
          useValue: mockDoctorsService,
        },
      ],
    })
      .overrideGuard(FirebaseAuthGuard)
      .useValue(mockFirebaseAuthGuard)
      .compile();

    controller = module.get<DoctorsController>(DoctorsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getDoctorById', () => {
    it('should return a doctor profile when it exists', async () => {
      const mockDoctorProfile = {
        id: 'test-id',
        userId: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        specialty: 'Cardiology',
      };

      mockDoctorsService.findById.mockResolvedValue(mockDoctorProfile);

      const mockRequest = {
        user: {
          uid: 'test-user-id',
        },
      };

      const result = await controller.getDoctorById('test-id', mockRequest);

      expect(mockDoctorsService.findById).toHaveBeenCalledWith('test-id');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDoctorProfile);
    });

    it('should throw NotFoundException when doctor profile does not exist', async () => {
      mockDoctorsService.findById.mockRejectedValue(new NotFoundException());

      const mockRequest = {
        user: {
          uid: 'test-user-id',
        },
      };

      await expect(controller.getDoctorById('non-existent-id', mockRequest)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDoctorByUserId', () => {
    it('should return a doctor profile when it exists', async () => {
      const mockDoctorProfile = {
        id: 'test-id',
        userId: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        specialty: 'Cardiology',
      };

      mockDoctorsService.findByUserId.mockResolvedValue(mockDoctorProfile);

      const mockRequest = {
        user: {
          uid: 'test-user-id',
        },
      };

      const result = await controller.getDoctorByUserId(mockRequest);

      expect(mockDoctorsService.findByUserId).toHaveBeenCalledWith('test-user-id');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockDoctorProfile);
    });

    it('should return a success response with null data when profile does not exist', async () => {
      mockDoctorsService.findByUserId.mockResolvedValue(null);

      const mockRequest = {
        user: {
          uid: 'test-user-id',
        },
      };

      const result = await controller.getDoctorByUserId(mockRequest);

      expect(result.success).toBe(true);
      expect(result.data).toBeNull();
      expect(result.message).toBe('No doctor profile found for this user');
    });

    it('should throw ForbiddenException when user tries to access another user\'s profile', async () => {
      const mockRequest = {
        user: {
          uid: 'different-user-id',
        },
      };

      await expect(controller.getDoctorByUserId(mockRequest)).rejects.toThrow(ForbiddenException);
    });
  });

  // Add more tests for createDoctorProfile, updateDoctorProfile, searchDoctors, etc.
});
