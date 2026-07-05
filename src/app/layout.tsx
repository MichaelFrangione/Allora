import type { Metadata } from "next";
import { Baloo_2, Nunito, Geist_Mono } from "next/font/google";
import "./globals.css";

// Body: Nunito — rounded, warm, extremely legible at quiz sizes.
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

// Display: Baloo 2 — chunky and friendly; headings, big numbers, buttons.
const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Allora",
  description: "Italian language learning app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${nunito.variable} ${baloo.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
