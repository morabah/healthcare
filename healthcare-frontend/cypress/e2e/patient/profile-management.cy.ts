describe('Patient Profile Management', () => {
  beforeEach(() => {
    // Use our custom command to mock patient authentication
    cy.mockFirebaseAuth('patient');
    
    // Mock patient profile data
    cy.mockPatientProfile('patient-user-id', {
      firstName: 'Jane',
      lastName: 'Doe',
      dateOfBirth: '1990-01-01',
      gender: 'Female',
      contactNumber: '123456789',
      address: 'Oran, Algeria',
      bloodType: 'A+',
      allergies: ['Penicillin'],
      medicalHistory: ['Asthma']
    });
    
    // Visit the patient profile page
    cy.visit('/patient-profile');
  });

  it('should display the patient profile form with existing data', () => {
    // Verify the form is displayed with the correct title
    cy.contains('Patient Profile').should('be.visible');
    
    // Verify form fields are populated with existing data
    cy.get('input[name="firstName"]').should('have.value', 'Jane');
    cy.get('input[name="lastName"]').should('have.value', 'Doe');
    cy.get('input[name="dateOfBirth"]').should('have.value', '1990-01-01');
    cy.get('select[name="gender"]').should('have.value', 'Female');
    cy.get('input[name="contactNumber"]').should('have.value', '123456789');
    cy.get('input[name="address"]').should('have.value', 'Oran, Algeria');
    cy.get('select[name="bloodType"]').should('have.value', 'A+');
    
    // Verify allergies and medical history are displayed
    cy.contains('Penicillin').should('be.visible');
    cy.contains('Asthma').should('be.visible');
  });

  it('should update the patient profile successfully', () => {
    // Mock the update API endpoint
    cy.intercept('PUT', '**/patients/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Patient profile updated successfully',
        data: {
          id: 'patient-profile-id',
          userId: 'patient-user-id',
          address: 'Algiers, Algeria',
          // Other fields remain the same
        },
      },
    }).as('updateProfile');

    // Update the address field
    cy.get('input[name="address"]').clear().type('Algiers, Algeria');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the update request to complete
    cy.wait('@updateProfile');
    
    // Verify success message is displayed
    cy.contains('Profile updated successfully').should('be.visible');
  });

  it('should add a new allergy to the patient profile', () => {
    // Mock the update API endpoint for allergies
    cy.intercept('PATCH', '**/patients/*/allergies', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Allergies updated successfully',
        data: {
          id: 'patient-profile-id',
          userId: 'patient-user-id',
          allergies: ['Penicillin', 'Aspirin'],
        },
      },
    }).as('updateAllergies');

    // Click on add allergy button
    cy.contains('Add Allergy').click();
    
    // Type the new allergy in the input field
    cy.get('input[name="newAllergy"]').type('Aspirin');
    
    // Click the add button
    cy.get('button').contains('Add').click();
    
    // Wait for the update request to complete
    cy.wait('@updateAllergies');
    
    // Verify the new allergy is displayed
    cy.contains('Aspirin').should('be.visible');
  });

  it('should add a new medical history item to the patient profile', () => {
    // Mock the update API endpoint for medical history
    cy.intercept('PATCH', '**/patients/*/medical-history', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Medical history updated successfully',
        data: {
          id: 'patient-profile-id',
          userId: 'patient-user-id',
          medicalHistory: ['Asthma', 'Hypertension'],
        },
      },
    }).as('updateMedicalHistory');

    // Click on add medical history button
    cy.contains('Add Medical Condition').click();
    
    // Type the new condition in the input field
    cy.get('input[name="newCondition"]').type('Hypertension');
    
    // Click the add button
    cy.get('button').contains('Add').click();
    
    // Wait for the update request to complete
    cy.wait('@updateMedicalHistory');
    
    // Verify the new condition is displayed
    cy.contains('Hypertension').should('be.visible');
  });

  it('should handle validation errors for empty required fields', () => {
    // Clear required fields
    cy.get('input[name="firstName"]').clear();
    cy.get('input[name="lastName"]').clear();
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Check for validation error messages
    cy.contains('First name is required').should('be.visible');
    cy.contains('Last name is required').should('be.visible');
    
    // Verify the form was not submitted (no success message)
    cy.contains('Profile updated successfully').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Mock a failed API response
    cy.intercept('PUT', '**/patients/*', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Server error occurred',
      },
    }).as('updateProfileError');

    // Make a small change to trigger an update
    cy.get('input[name="contactNumber"]').clear().type('987654321');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the update request to complete
    cy.wait('@updateProfileError');
    
    // Verify error message is displayed
    cy.contains('Failed to update profile').should('be.visible');
  });
});
