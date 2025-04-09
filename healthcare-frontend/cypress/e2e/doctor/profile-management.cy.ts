describe('Doctor Profile Management', () => {
  beforeEach(() => {
    // Mock authentication to simulate logged in doctor
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:lookup*', {
      statusCode: 200,
      body: {
        users: [
          {
            localId: 'doctor-user-id',
            email: 'doctor@example.com',
            displayName: 'Dr. Smith',
            emailVerified: true,
          },
        ],
      },
    });

    // Mock Firestore doctor profile data
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/doctorProfiles/*', {
      statusCode: 200,
      body: {
        fields: {
          userId: { stringValue: 'doctor-user-id' },
          firstName: { stringValue: 'John' },
          lastName: { stringValue: 'Smith' },
          specialty: { stringValue: 'Cardiology' },
          location: { stringValue: 'Oran' },
          languages: { stringValue: 'Arabic, English' },
          yearsOfExperience: { stringValue: '10' },
          education: { stringValue: 'Medical University' },
          professionalBio: { stringValue: 'Experienced cardiologist with 10 years of practice.' },
          consultationFee: { stringValue: '5000' },
        },
      },
    });

    // Mock API endpoints if they're being used
    cy.intercept('GET', '**/doctors/user/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 'doctor-profile-id',
          userId: 'doctor-user-id',
          firstName: 'John',
          lastName: 'Smith',
          specialty: 'Cardiology',
          location: 'Oran',
          languages: 'Arabic, English',
          yearsOfExperience: '10',
          education: 'Medical University',
          professionalBio: 'Experienced cardiologist with 10 years of practice.',
          consultationFee: '5000',
        },
      },
    });

    // Visit the doctor profile page
    cy.visit('/doctor-profile');
  });

  it('should display the doctor profile form with existing data', () => {
    // Verify the form is displayed with the correct title
    cy.contains('Doctor Profile Management').should('be.visible');
    
    // Verify form fields are populated with existing data
    cy.get('input[name="specialty"]').should('have.value', 'Cardiology');
    cy.get('input[name="location"]').should('have.value', 'Oran');
    cy.get('input[name="languages"]').should('have.value', 'Arabic, English');
    cy.get('input[name="yearsOfExperience"]').should('have.value', '10');
    cy.get('input[name="education"]').should('have.value', 'Medical University');
    cy.get('textarea[name="professionalBio"]').should('have.value', 'Experienced cardiologist with 10 years of practice.');
    cy.get('input[name="consultationFee"]').should('have.value', '5000');
  });

  it('should update the doctor profile successfully', () => {
    // Mock the update API endpoint or Firestore write
    cy.intercept('PUT', '**/doctors/*', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Doctor profile updated successfully',
        data: {
          id: 'doctor-profile-id',
          userId: 'doctor-user-id',
          specialty: 'Neurology',
          // Other fields remain the same
        },
      },
    }).as('updateProfile');

    // Update the specialty field
    cy.get('input[name="specialty"]').clear().type('Neurology');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the update request to complete
    cy.wait('@updateProfile');
    
    // Verify success message is displayed
    cy.contains('Profile saved successfully').should('be.visible');
  });

  it('should show validation errors for empty required fields', () => {
    // Clear required fields
    cy.get('input[name="specialty"]').clear();
    cy.get('input[name="location"]').clear();
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Check for validation error messages
    cy.contains('Specialty is required').should('be.visible');
    cy.contains('Location is required').should('be.visible');
    
    // Verify the form was not submitted (no success message)
    cy.contains('Profile saved successfully').should('not.exist');
  });

  it('should handle API errors gracefully', () => {
    // Mock a failed API response
    cy.intercept('PUT', '**/doctors/*', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Server error occurred',
      },
    }).as('updateProfileError');

    // Make a small change to trigger an update
    cy.get('input[name="yearsOfExperience"]').clear().type('12');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the update request to complete
    cy.wait('@updateProfileError');
    
    // Verify error message is displayed
    cy.contains('Failed to save your profile').should('be.visible');
  });
});
