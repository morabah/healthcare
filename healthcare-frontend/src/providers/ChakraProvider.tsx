'use client';

import { ChakraProvider as ChakraUIProvider, createTheme } from '@chakra-ui/react';
import { ReactNode } from 'react';

// Create a custom theme for Chakra UI v3
const theme = createTheme({
  colors: {
    brand: {
      blue: '#3b82f6',
      green: '#10b981',
      yellow: '#f59e0b',
      cyan: '#06b6d4',
    },
  },
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    heading: 'Inter, system-ui, sans-serif',
  },
});

interface CustomChakraProviderProps {
  children: ReactNode;
}

export function ChakraProvider({ children }: CustomChakraProviderProps) {
  return (
    <ChakraUIProvider theme={theme}>
      {children}
    </ChakraUIProvider>
  );
}
