import { Test, TestingModule } from '@nestjs/testing';
import { DoctorsService } from './doctors.service';
import { FirebaseService } from '../../firebase/firebase.service';
import { NotFoundException } from '@nestjs/common';
import * as admin from 'firebase-admin';

// Mock Firebase admin
jest.mock('firebase-admin', () => {
  const firebaseMock = {
    firestore: jest.fn().mockReturnValue({
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
    }),
    FieldValue: {
      serverTimestamp: jest.fn().mockReturnValue('mock-timestamp'),
    },
  };
  return {
    firestore: jest.fn(() => firebaseMock.firestore()),
    FieldValue: firebaseMock.FieldValue,
  };
});

// Mock FirebaseService
const mockFirebaseService = {
  verifyToken: jest.fn(),
  getAuth: jest.fn(),
};

describe('DoctorsService', () => {
  let service: DoctorsService;
  let firestoreMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DoctorsService,
        {
          provide: FirebaseService,
          useValue: mockFirebaseService,
        },
      ],
    }).compile();

    service = module.get<DoctorsService>(DoctorsService);
    firestoreMock = admin.firestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a doctor profile when it exists', async () => {
      const mockDoctorData = {
        userId: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        specialty: 'Cardiology',
      };

      const mockDocSnapshot = {
        id: 'test-id',
        exists: true,
        data: () => mockDoctorData,
      };

      firestoreMock.collection().doc().get.mockResolvedValue(mockDocSnapshot);

      const result = await service.findById('test-id');

      expect(firestoreMock.collection).toHaveBeenCalledWith('doctorProfiles');
      expect(firestoreMock.collection().doc).toHaveBeenCalledWith('test-id');
      expect(result).toEqual({
        id: 'test-id',
        ...mockDoctorData,
      });
    });

    it('should throw NotFoundException when doctor profile does not exist', async () => {
      const mockDocSnapshot = {
        exists: false,
      };

      firestoreMock.collection().doc().get.mockResolvedValue(mockDocSnapshot);

      await expect(service.findById('non-existent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByUserId', () => {
    it('should return a doctor profile when it exists', async () => {
      const mockDoctorData = {
        userId: 'test-user-id',
        firstName: 'John',
        lastName: 'Doe',
        specialty: 'Cardiology',
      };

      const mockQuerySnapshot = {
        empty: false,
        docs: [
          {
            id: 'test-id',
            data: () => mockDoctorData,
          },
        ],
      };

      firestoreMock.collection().where().limit().get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findByUserId('test-user-id');

      expect(firestoreMock.collection).toHaveBeenCalledWith('doctorProfiles');
      expect(firestoreMock.collection().where).toHaveBeenCalledWith('userId', '==', 'test-user-id');
      expect(result).toEqual({
        id: 'test-id',
        ...mockDoctorData,
      });
    });

    it('should return null when doctor profile does not exist', async () => {
      const mockQuerySnapshot = {
        empty: true,
        docs: [],
      };

      firestoreMock.collection().where().limit().get.mockResolvedValue(mockQuerySnapshot);

      const result = await service.findByUserId('non-existent-user-id');

      expect(result).toBeNull();
    });
  });

  // Add more tests for create, update, searchBySpecialty, etc.
});
