// src/contexts/AuthContext.tsx
"use client";

import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User } from '@/lib/types';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useToast } from "@/hooks/use-toast";
// No need for useRouter here anymore, pages will handle redirects

interface AuthContextType {
  currentUser: User | null;
  login: (username: string, password?: string) => Promise<boolean>; // Return boolean for success
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ALL_USERS_LOCAL_STORAGE_KEY = 'eventHorizonAllUsers';
const CURRENT_USER_SESSION_KEY = 'eventHorizonCurrentUserSession';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [allUsers, setAllUsers] = useLocalStorage<User[]>(ALL_USERS_LOCAL_STORAGE_KEY, []);
  const [currentUserSession, setCurrentUserSession] = useLocalStorage<User | null>(CURRENT_USER_SESSION_KEY, null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setCurrentUser(currentUserSession);
    setIsLoading(false);
  }, [currentUserSession]);

  const login = useCallback(async (usernameInput: string, passwordInput?: string): Promise<boolean> => {
    const username = usernameInput.trim();
    const password = passwordInput?.trim();

    if (!username || !password) {
      toast({ title: "Login Failed", description: "Username and password are required.", variant: "destructive" });
      return false;
    }

    setIsLoading(true);
    const lowerCaseUsername = username.toLowerCase();
    const existingUser = allUsers.find(u => u.id === lowerCaseUsername);

    if (existingUser) {
      if (existingUser.password === password) {
        const userToLogin = { ...existingUser, name: username };
        setCurrentUserSession(userToLogin);
        setCurrentUser(userToLogin);
        toast({ title: "Login Successful", description: `Welcome back, ${userToLogin.name}!` });
        setIsLoading(false);
        return true;
      } else {
        toast({ title: "Login Failed", description: "Incorrect password.", variant: "destructive" });
        setIsLoading(false);
        return false;
      }
    } else {
      const newUser: User = { id: lowerCaseUsername, name: username, password: password };
      setAllUsers([...allUsers, newUser]);
      setCurrentUserSession(newUser);
      setCurrentUser(newUser);
      toast({ title: "Signup Successful", description: `Welcome, ${newUser.name}! Your account has been created.` });
      setIsLoading(false);
      return true;
    }
  }, [allUsers, setAllUsers, setCurrentUserSession, toast]);

  const logout = useCallback(() => {
    const departingUser = currentUser;
    setCurrentUserSession(null);
    setCurrentUser(null);
    if (departingUser) {
        toast({ title: "Logged Out", description: `Goodbye, ${departingUser.name}!` });
    }
    // Redirect will be handled by the /logout page or components checking currentUser
  }, [setCurrentUserSession, currentUser, toast]);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
