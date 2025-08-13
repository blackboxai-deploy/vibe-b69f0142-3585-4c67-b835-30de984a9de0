import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Next Todo App',
  description: 'A minimal Todo list built with Next.js',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header>
            <h1 className="title">Next Todo</h1>
            <small className="muted">Simple, local-first task list</small>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
