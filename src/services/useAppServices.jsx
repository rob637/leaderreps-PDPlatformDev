// src/services/useAppServices.jsx
import { useContext } from 'react';
import AppServiceContext from './AppServiceContext';

export const useAppServices = () => {
  const ctx = useContext(AppServiceContext);
  if (!ctx) throw new Error('useAppServices must be used within AppServiceProvider');
  return ctx;
};

