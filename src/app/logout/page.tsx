// src/app/logout/page.tsx
"use client";

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
  const { logout, currentUser } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (currentUser) {
      logout();
    }
    // Always redirect, even if currentUser was already null (e.g., direct navigation to /logout)
    router.push('/login'); 
  }, [logout, router, currentUser]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg text-muted-foreground">Logging out...</p>
    </div>
  );
}
