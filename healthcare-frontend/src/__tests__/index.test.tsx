/// <reference types="@testing-library/jest-dom" />

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '@/app/page';

// Mock the auth context
jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    userData: null,
  })),
}));

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  })),
  useSearchParams: jest.fn(() => null),
}));

describe('Home page', () => {
  it('renders healthcare content', () => {
    render(<Home />);
    
    // Check if the element exists
    const element = screen.getByText(/Healthcare Platform/i);
    expect(element).toBeDefined();
  });
});
