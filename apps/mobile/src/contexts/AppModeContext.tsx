import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'user' | 'merchant';

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  toggleMode: () => void;
  logout?: () => void; // Optional logout function
}

const AppModeContext = createContext<AppModeContextType | undefined>(undefined);

interface AppModeProviderProps {
  children: ReactNode;
  logout?: () => void; // Accept logout function from parent
}

export const AppModeProvider: React.FC<AppModeProviderProps> = ({ children, logout }) => {
  const [mode, setMode] = useState<AppMode>('user');

  const toggleMode = () => {
    setMode(mode === 'user' ? 'merchant' : 'user');
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, toggleMode, logout }}>
      {children}
    </AppModeContext.Provider>
  );
};

export const useAppMode = () => {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error('useAppMode must be used within an AppModeProvider');
  }
  return context;
}; 