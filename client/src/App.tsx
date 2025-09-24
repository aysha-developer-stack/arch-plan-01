import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { queryClient } from '@/lib/queryClient';
import AppRoutes from '@/AppRoutes';
import { UserAuthProvider } from '@/contexts/UserAuthContext';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserAuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppRoutes />
        </TooltipProvider>
      </UserAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
