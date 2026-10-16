import type { Metadata } from 'next';
import Navbar from '@/app/components/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'PrepEngine | Smart Student Hub',
  description: 'Dynamic spaced repetition and exam mastery platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 text-slate-900 font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1 pb-16">{children}</main>
        </div>
      </body>
    </html>
  );
}