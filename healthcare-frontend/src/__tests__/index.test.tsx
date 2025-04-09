/// <reference types="@testing-library/jest-dom" />

import { render, screen } from '@testing-library/react';
import Page from '@/app/page'; // Import the Page component from src/app

describe('Page', () => {
  it('renders edit instruction text', () => {
    render(<Page />);

    // Find an element containing the specific text (case-insensitive)
    const instructionElement = screen.getByText(/Get started by editing/i);

    expect(instructionElement).toBeInTheDocument();
  });
});
