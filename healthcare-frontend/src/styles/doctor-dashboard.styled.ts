'use client';

import styled from '@emotion/styled';

// Styled components for the doctor dashboard
export const WelcomeTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

export const WelcomeSubtitle = styled.p`
  font-style: italic;
  color: #555;
  font-size: 0.95rem;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

export const StatCardIcon = styled.div<{ color: string }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-left: 1rem;
  flex-shrink: 0;
`;

export const PanelsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const QuickActionItem = styled.div`
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #f9fafb;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

export const QuickActionContent = styled.div`
  display: flex;
  align-items: center;
  overflow: hidden;
`;

export const QuickActionText = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const QuickActionTitle = styled.span`
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const QuickActionDescription = styled.span`
  font-size: 0.75rem;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ScheduleContent = styled.div`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 250px;
`;

export const ScheduleTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
`;

export const ScheduleDescription = styled.p`
  color: #6b7280;
  margin-bottom: 1rem;
  font-size: 0.875rem;
`;
