import { useState } from 'react';
import { Alert } from '../types';

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const addAlert = (message: string) => {
    const newAlert: Alert = { 
      id: Date.now(), 
      message, 
      timestamp: new Date() 
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  return { alerts, addAlert };
}