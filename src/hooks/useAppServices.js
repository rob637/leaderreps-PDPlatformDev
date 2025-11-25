import { useContext } from 'react';
import AppServiceContext from '../services/AppServiceContext';

export const useAppServices = () => {
  const context = useContext(AppServiceContext);
  if (!context) {
    throw new Error('useAppServices must be used within an AppServiceContext.Provider');
  }
  return context;
};
