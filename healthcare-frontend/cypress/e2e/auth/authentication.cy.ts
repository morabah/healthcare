describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage();
    
    // Visit the login page
    cy.visit('/login');
  });

  it('should allow a user to sign in with email and password', () => {
    // Mock successful Firebase sign-in
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'test-user-id',
        email: 'test@example.com',
        displayName: 'Test User',
        idToken: 'fake-token',
        registered: true,
      },
    }).as('signIn');
    
    // Mock user data in Firestore
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/users/*', {
      statusCode: 200,
      body: {
        fields: {
          uid: { stringValue: 'test-user-id' },
          email: { stringValue: 'test@example.com' },
          displayName: { stringValue: 'Test User' },
          role: { stringValue: 'patient' },
          createdAt: { stringValue: new Date().toISOString() },
        },
      },
    }).as('getUserData');

    // Fill login form
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for sign-in to complete
    cy.wait('@signIn');
    cy.wait('@getUserData');
    
    // Verify redirection to dashboard based on role
    cy.url().should('include', '/patient-dashboard');
  });

  it('should allow a user to sign in with Google', () => {
    // Mock Google Auth popup
    cy.window().then((win) => {
      cy.stub(win, 'open').as('googleAuthPopup').returns({
        closed: false,
        close: cy.stub(),
      });
    });
    
    // Mock successful Firebase Google sign-in
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp*', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#VerifyCustomTokenResponse',
        localId: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User',
        idToken: 'fake-google-token',
        registered: true,
      },
    }).as('googleSignIn');
    
    // Mock user data in Firestore for Google user
    cy.intercept('GET', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/users/*', {
      statusCode: 200,
      body: {
        fields: {
          uid: { stringValue: 'google-user-id' },
          email: { stringValue: 'google@example.com' },
          displayName: { stringValue: 'Google User' },
          role: { stringValue: 'doctor' },
          createdAt: { stringValue: new Date().toISOString() },
        },
      },
    }).as('getGoogleUserData');
    
    // Click Google sign-in button
    cy.contains('Sign in with Google').click();
    
    // Verify Google Auth popup was opened
    cy.get('@googleAuthPopup').should('be.called');
    
    // Simulate successful Google auth callback
    cy.window().then((win) => {
      // Trigger the auth state change
      win.localStorage.setItem('firebase:auth:user', JSON.stringify({
        uid: 'google-user-id',
        email: 'google@example.com',
        displayName: 'Google User',
      }));
      
      // Manually trigger the auth state change event that Firebase would normally trigger
      win.dispatchEvent(new Event('storage'));
    });
    
    // Wait for sign-in to complete
    cy.wait('@getGoogleUserData');
    
    // Verify redirection to dashboard based on role
    cy.url().should('include', '/doctor-dashboard');
  });

  it('should show error message for invalid credentials', () => {
    // Mock failed Firebase sign-in
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*', {
      statusCode: 400,
      body: {
        error: {
          code: 400,
          message: 'INVALID_PASSWORD',
          errors: [
            {
              message: 'INVALID_PASSWORD',
              domain: 'global',
              reason: 'invalid',
            },
          ],
        },
      },
    }).as('signInError');
    
    // Fill login form with invalid credentials
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for sign-in error
    cy.wait('@signInError');
    
    // Verify error message is displayed
    cy.contains('Invalid email or password').should('be.visible');
    
    // Verify we're still on the login page
    cy.url().should('include', '/login');
  });

  it('should allow a user to sign up with email and password', () => {
    // Navigate to signup page
    cy.contains('Sign up').click();
    cy.url().should('include', '/signup');
    
    // Mock successful Firebase sign-up
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signUp*', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#SignupNewUserResponse',
        localId: 'new-user-id',
        email: 'new@example.com',
        idToken: 'fake-token',
      },
    }).as('signUp');
    
    // Mock Firestore user creation
    cy.intercept('POST', '**/firestore.googleapis.com/v1/projects/*/databases/*/documents/users*', {
      statusCode: 200,
      body: {
        name: 'projects/healthcare-app/databases/(default)/documents/users/new-user-id',
        fields: {
          uid: { stringValue: 'new-user-id' },
          email: { stringValue: 'new@example.com' },
          displayName: { stringValue: 'New User' },
          role: { stringValue: 'patient' },
          createdAt: { stringValue: new Date().toISOString() },
        },
      },
    }).as('createUser');
    
    // Fill signup form
    cy.get('input[name="displayName"]').type('New User');
    cy.get('input[type="email"]').type('new@example.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('input[name="confirmPassword"]').type('password123');
    
    // Select role
    cy.get('input[type="radio"][value="patient"]').check();
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for sign-up and user creation to complete
    cy.wait('@signUp');
    cy.wait('@createUser');
    
    // Verify redirection to role selection or dashboard
    cy.url().should('include', '/patient-dashboard');
  });

  it('should validate the signup form', () => {
    // Navigate to signup page
    cy.contains('Sign up').click();
    
    // Submit empty form
    cy.get('button[type="submit"]').click();
    
    // Verify validation errors
    cy.contains('Name is required').should('be.visible');
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
    
    // Fill with invalid data
    cy.get('input[name="displayName"]').type('A');
    cy.get('input[type="email"]').type('invalid-email');
    cy.get('input[type="password"]').type('short');
    cy.get('input[name="confirmPassword"]').type('different');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Verify validation errors
    cy.contains('Name must be at least 2 characters').should('be.visible');
    cy.contains('Invalid email format').should('be.visible');
    cy.contains('Password must be at least 8 characters').should('be.visible');
    cy.contains('Passwords do not match').should('be.visible');
  });

  it('should allow a user to reset their password', () => {
    // Click on forgot password link
    cy.contains('Forgot password?').click();
    
    // Verify we're on the reset password page
    cy.url().should('include', '/reset-password');
    
    // Mock successful password reset request
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode*', {
      statusCode: 200,
      body: {
        kind: 'identitytoolkit#GetOobConfirmationCodeResponse',
        email: 'test@example.com',
      },
    }).as('resetPassword');
    
    // Fill reset password form
    cy.get('input[type="email"]').type('test@example.com');
    
    // Submit form
    cy.get('button[type="submit"]').click();
    
    // Wait for reset password request to complete
    cy.wait('@resetPassword');
    
    // Verify success message
    cy.contains('Password reset email sent').should('be.visible');
  });
});
