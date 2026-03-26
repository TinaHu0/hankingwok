import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

export const metadata: Metadata = {
  title: "Han King Wok & Grill – Aziatisch Restaurant in Leuven",
  description:
    "Geniet van ons all-you-can-eat lunchbuffet en à-la-carte diner met Aziatische en Europese gerechten. Reserveer nu!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className={`${playfair.variable} ${lato.variable}`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-800">
        {children}
      </body>
    </html>
  );
}
