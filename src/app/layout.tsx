import React from 'react';

export const metadata = {
  title: 'TrailX - Gestão Tática de Trail Running',
  description: 'Plataforma de acompanhamento de Trail e Ultra Trail',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>{children}</body>
    </html>
  );
}
