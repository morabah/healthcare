describe('Login Flow', () => {
  beforeEach(() => {
    // Visit the login page before each test
    cy.visit('/login');
    
    // Intercept Firebase authentication requests
    cy.intercept('POST', 'https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword*').as('signIn');
  });

  it('should display the login form', () => {
    // Check if login form elements are visible
    cy.get('form').should('be.visible');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible').and('contain', 'Login');
  });

  it('should show validation errors for empty fields', () => {
    // Submit the form without filling any fields
    cy.get('button[type="submit"]').click();
    
    // Check for validation error messages
    cy.get('form').contains('Please enter your email');
    cy.get('form').contains('Please enter your password');
  });

  it('should show error for invalid credentials', () => {
    // Fill in invalid credentials
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the sign-in request to complete
    cy.wait('@signIn');
    
    // Check for error message
    cy.get('form').contains('Invalid email or password');
  });

  it('should navigate to signup page when clicking signup link', () => {
    // Click on the signup link
    cy.contains('Create an account').click();
    
    // Verify that we're on the signup form
    cy.get('form').contains('Sign Up');
    cy.get('input[name="name"]').should('be.visible');
  });

  it('should successfully log in with valid credentials', () => {
    // This test requires a valid Firebase account or mocking
    // For testing purposes, we'll mock a successful response
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
    }).as('successfulSignIn');
    
    // Fill in valid credentials
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('password123');
    
    // Submit the form
    cy.get('button[type="submit"]').click();
    
    // Wait for the sign-in request to complete
    cy.wait('@successfulSignIn');
    
    // Verify redirection to dashboard (depends on user role)
    // For this test, we'll check if we're no longer on the login page
    cy.url().should('not.include', '/login');
  });
});
