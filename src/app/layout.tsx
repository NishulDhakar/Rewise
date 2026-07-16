import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Rewise — Spaced Repetition Todo',
  description: 'An advanced Todo and learning manager with automated spaced repetition.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-bg-dark text-text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

