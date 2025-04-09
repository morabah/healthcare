/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Declare the custom commands to extend Cypress namespace
declare namespace Cypress {
  interface Chainable<Subject = any> {
    mockFirebaseAuth(role?: 'patient' | 'doctor'): Chainable<void>
    login(email: string, password: string): Chainable<void>
    mockDoctorProfile(doctorId: string, profileData?: Record<string, any>): Chainable<void>
    mockPatientProfile(patientId: string, profileData?: Record<string, any>): Chainable<void>
  }
}

/**
 * Custom command to mock Firebase authentication
 */
Cypress.Commands.add('mockFirebaseAuth', (role: 'patient' | 'doctor' = 'patient') => {
  // Mock Firebase Auth state
  const mockUser = role === 'doctor' 
    ? {
        uid: 'doctor-user-id',
        email: 'doctor@example.com',
        displayName: 'Dr. Smith',
        emailVerified: true,
      }
    : {
        uid: 'patient-user-id',
        email: 'patient@example.com',
        displayName: 'Patient User',
        emailVerified: true,
      };

  // Mock auth state change
  cy.window().then((win) => {
    win.localStorage.setItem('firebase:auth:user', JSON.stringify(mockUser));
  });

  // Mock Firebase auth endpoints
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:lookup*', {
    statusCode: 200,
    body: {
      users: [mockUser],
    },
  });

  // Mock user data in Firestore
  cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/users/*', {
    statusCode: 200,
    body: {
      fields: {
        uid: { stringValue: mockUser.uid },
        email: { stringValue: mockUser.email },
        displayName: { stringValue: mockUser.displayName },
        role: { stringValue: role },
        createdAt: { stringValue: new Date().toISOString() },
        lastLogin: { stringValue: new Date().toISOString() },
      },
    },
  });
});

/**
 * Custom command to login via the UI
 */
Cypress.Commands.add('login', (email: string, password: string) => {
  // Mock successful Firebase sign-in
  cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
    statusCode: 200,
    body: {
      kind: 'identitytoolkit#VerifyPasswordResponse',
      localId: 'test-user-id',
      email: email,
      displayName: 'Test User',
      idToken: 'fake-token',
      registered: true,
    },
  }).as('signIn');

  // Visit login page
  cy.visit('/login');

  // Fill login form
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);

  // Submit form
  cy.get('button[type="submit"]').click();

  // Wait for sign-in to complete
  cy.wait('@signIn');
});

/**
 * Custom command to mock doctor profile data
 */
Cypress.Commands.add('mockDoctorProfile', (doctorId: string, profileData: Record<string, any> = {}) => {
  const defaultProfile = {
    userId: doctorId,
    firstName: 'John',
    lastName: 'Smith',
    specialty: 'Cardiology',
    location: 'Oran',
    languages: 'Arabic, English',
    yearsOfExperience: '10',
    education: 'Medical University',
    professionalBio: 'Experienced cardiologist with 10 years of practice.',
    consultationFee: '5000',
    profilePicture: '',
  };

  const mergedProfile = { ...defaultProfile, ...profileData };

  // Mock Firestore doctor profile data
  cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/doctorProfiles/*', {
    statusCode: 200,
    body: {
      fields: Object.entries(mergedProfile).reduce((acc: Record<string, any>, [key, value]) => {
        acc[key] = { stringValue: value };
        return acc;
      }, {}),
    },
  });

  // Mock API endpoint if using the backend
  cy.intercept('GET', '**/doctors/user/*', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        id: 'doctor-profile-id',
        ...mergedProfile,
      },
    },
  });
});

/**
 * Custom command to mock patient profile data
 */
Cypress.Commands.add('mockPatientProfile', (patientId: string, profileData: Record<string, any> = {}) => {
  const defaultProfile = {
    userId: patientId,
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '1990-01-01',
    gender: 'Female',
    contactNumber: '123456789',
    address: 'Oran, Algeria',
    medicalHistory: [],
    allergies: [],
  };

  const mergedProfile = { ...defaultProfile, ...profileData };

  // Mock API endpoint if using the backend
  cy.intercept('GET', '**/patients/user/*', {
    statusCode: 200,
    body: {
      success: true,
      data: {
        id: 'patient-profile-id',
        ...mergedProfile,
      },
    },
  });
});