// src/components/AppHeader.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Search, CalendarDays, LogIn, LogOut, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

interface AppHeaderProps {
  onAddEventClick: () => void;
  onSearchChange: (searchTerm: string) => void;
  // onLoginClick and onLogoutClick are removed as we use Links now
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  onAddEventClick, 
  onSearchChange,
}) => {
  const { currentUser } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <CalendarDays className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Event Horizon</h1>
        </Link>
        <div className="flex items-center gap-4">
          {currentUser && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                  type="search" 
                  placeholder="Search events..." 
                  className="pl-10 w-64"
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <Button onClick={onAddEventClick} className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Event
              </Button>
            </>
          )}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/logout">
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout
                </Link>
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
