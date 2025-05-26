import type {Metadata} from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { EventsProvider } from '@/contexts/EventsContext';
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider

export const metadata: Metadata = {
  title: 'Event Horizon Calendar',
  description: 'Manage your schedule with Event Horizon Calendar',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider> {/* AuthProvider wraps EventsProvider */}
          <EventsProvider>
            {children}
            <Toaster />
          </EventsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
