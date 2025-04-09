# End-to-End Testing with Cypress

This directory contains end-to-end tests for the healthcare application using Cypress. These tests replace the previous Swagger documentation approach with automated tests that verify critical user flows.

## Test Structure

The tests are organized by feature area:

- **Authentication** (`cypress/e2e/auth/`): Tests for login, signup, and password reset flows
- **Doctor** (`cypress/e2e/doctor/`): Tests for doctor-specific features like profile management
- **Patient** (`cypress/e2e/patient/`): Tests for patient-specific features like profile management
- **Appointments** (`cypress/e2e/appointments/`): Tests for appointment booking and management

## Custom Commands

We've created several custom Cypress commands to simplify testing:

- `mockFirebaseAuth(role)`: Mocks Firebase authentication for either a 'patient' or 'doctor'
- `login(email, password)`: Simulates a user login through the UI
- `mockDoctorProfile(doctorId, profileData)`: Mocks doctor profile data
- `mockPatientProfile(patientId, profileData)`: Mocks patient profile data

## Running Tests

You can run the tests using the following npm scripts:

```bash
# Open Cypress Test Runner UI
npm run cypress:open

# Run all tests headlessly
npm run cypress:run

# Run tests with the development server
npm run test:e2e
```

## Writing New Tests

When writing new tests:

1. Use the existing custom commands for authentication and data mocking
2. Follow the pattern of mocking API responses for both Firebase and NestJS backend
3. Verify both happy paths and error scenarios
4. Test validation logic where applicable

## Best Practices

- Mock external dependencies (Firebase, API calls) to ensure tests are reliable
- Use descriptive test names that explain the behavior being tested
- Keep tests independent of each other (no shared state)
- Use data attributes for test selectors where possible (e.g., `data-testid="login-button"`)

## Integration with Backend

These tests are designed to work with both the Firebase-only approach and the NestJS backend API. The tests mock responses from both systems to ensure they work regardless of which backend implementation is active.
