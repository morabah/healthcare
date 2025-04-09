describe('Appointment Booking Flow', () => {
  beforeEach(() => {
    // Mock authentication to simulate logged in patient
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:lookup*', {
      statusCode: 200,
      body: {
        users: [
          {
            localId: 'patient-user-id',
            email: 'patient@example.com',
            displayName: 'Patient User',
            emailVerified: true,
          },
        ],
      },
    });

    // Mock API endpoint for doctor search
    cy.intercept('GET', '**/doctors/search*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          data: [
            {
              id: 'doctor-1',
              userId: 'doctor-user-id-1',
              firstName: 'John',
              lastName: 'Smith',
              specialty: 'Cardiology',
              location: 'Oran',
              languages: 'Arabic, English',
              yearsOfExperience: '10',
              consultationFee: '5000',
              profilePicture: '',
            },
            {
              id: 'doctor-2',
              userId: 'doctor-user-id-2',
              firstName: 'Sarah',
              lastName: 'Ahmed',
              specialty: 'Dermatology',
              location: 'Algiers',
              languages: 'Arabic, French',
              yearsOfExperience: '8',
              consultationFee: '4500',
              profilePicture: '',
            },
          ],
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      },
    }).as('searchDoctors');

    // Mock API endpoint for doctor availability
    cy.intercept('GET', '**/doctors/*/availability*', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          {
            date: '2025-04-15',
            slots: [
              { startTime: '09:00', endTime: '09:30', available: true },
              { startTime: '09:30', endTime: '10:00', available: true },
              { startTime: '10:00', endTime: '10:30', available: false },
              { startTime: '10:30', endTime: '11:00', available: true },
            ],
          },
          {
            date: '2025-04-16',
            slots: [
              { startTime: '09:00', endTime: '09:30', available: true },
              { startTime: '09:30', endTime: '10:00', available: true },
              { startTime: '10:00', endTime: '10:30', available: true },
              { startTime: '10:30', endTime: '11:00', available: true },
            ],
          },
        ],
      },
    }).as('getDoctorAvailability');

    // Mock API endpoint for booking appointment
    cy.intercept('POST', '**/patients/*/appointments', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Appointment booked successfully',
        data: {
          id: 'new-appointment-id',
          patientId: 'patient-user-id',
          doctorId: 'doctor-1',
          date: '2025-04-15',
          startTime: '09:00',
          endTime: '09:30',
          status: 'scheduled',
          createdAt: '2025-04-09T15:45:00.000Z',
        },
      },
    }).as('bookAppointment');

    // Visit the patient dashboard page
    cy.visit('/patient-dashboard');
  });

  it('should allow searching for doctors by specialty', () => {
    // Click on the "Find a Doctor" button
    cy.contains('Find a Doctor').click();
    
    // Select specialty from dropdown
    cy.get('select[name="specialty"]').select('Cardiology');
    
    // Click search button
    cy.get('button').contains('Search').click();
    
    // Wait for search results
    cy.wait('@searchDoctors');
    
    // Verify search results are displayed
    cy.contains('Dr. John Smith').should('be.visible');
    cy.contains('Cardiology').should('be.visible');
    cy.contains('Oran').should('be.visible');
  });

  it('should display doctor details and allow booking an appointment', () => {
    // Search for doctors first
    cy.contains('Find a Doctor').click();
    cy.get('select[name="specialty"]').select('Cardiology');
    cy.get('button').contains('Search').click();
    cy.wait('@searchDoctors');
    
    // Click on a doctor to view details
    cy.contains('Dr. John Smith').click();
    
    // Verify doctor details are displayed
    cy.contains('Dr. John Smith').should('be.visible');
    cy.contains('Cardiology').should('be.visible');
    cy.contains('10 years of experience').should('be.visible');
    cy.contains('Consultation Fee: 5000').should('be.visible');
    
    // Click on "Book Appointment" button
    cy.contains('Book Appointment').click();
    
    // Wait for availability data
    cy.wait('@getDoctorAvailability');
    
    // Select a date
    cy.get('input[type="date"]').type('2025-04-15');
    
    // Select an available time slot
    cy.contains('09:00 - 09:30').click();
    
    // Add symptoms (optional)
    cy.get('textarea[name="symptoms"]').type('Chest pain and shortness of breath');
    
    // Confirm booking
    cy.get('button').contains('Confirm Booking').click();
    
    // Wait for booking request
    cy.wait('@bookAppointment');
    
    // Verify success message
    cy.contains('Appointment booked successfully').should('be.visible');
    
    // Verify redirection to appointments page
    cy.url().should('include', '/appointments');
  });

  it('should handle unavailable time slots', () => {
    // Search and select doctor
    cy.contains('Find a Doctor').click();
    cy.get('select[name="specialty"]').select('Cardiology');
    cy.get('button').contains('Search').click();
    cy.wait('@searchDoctors');
    cy.contains('Dr. John Smith').click();
    cy.contains('Book Appointment').click();
    cy.wait('@getDoctorAvailability');
    
    // Select a date
    cy.get('input[type="date"]').type('2025-04-15');
    
    // Try to select an unavailable time slot
    cy.contains('10:00 - 10:30').should('have.class', 'unavailable');
    cy.contains('10:00 - 10:30').click();
    
    // Verify that the confirm button is disabled
    cy.get('button').contains('Confirm Booking').should('be.disabled');
    
    // Select an available slot instead
    cy.contains('09:00 - 09:30').click();
    
    // Verify that the confirm button is now enabled
    cy.get('button').contains('Confirm Booking').should('not.be.disabled');
  });

  it('should handle API errors during booking', () => {
    // Mock a failed booking response
    cy.intercept('POST', '**/patients/*/appointments', {
      statusCode: 500,
      body: {
        success: false,
        message: 'Failed to book appointment',
      },
    }).as('bookAppointmentError');
    
    // Search and select doctor
    cy.contains('Find a Doctor').click();
    cy.get('select[name="specialty"]').select('Cardiology');
    cy.get('button').contains('Search').click();
    cy.wait('@searchDoctors');
    cy.contains('Dr. John Smith').click();
    cy.contains('Book Appointment').click();
    cy.wait('@getDoctorAvailability');
    
    // Select date and time
    cy.get('input[type="date"]').type('2025-04-15');
    cy.contains('09:00 - 09:30').click();
    
    // Confirm booking
    cy.get('button').contains('Confirm Booking').click();
    
    // Wait for booking request
    cy.wait('@bookAppointmentError');
    
    // Verify error message
    cy.contains('Failed to book appointment').should('be.visible');
  });
});
