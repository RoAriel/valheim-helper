import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valheim Helper — Recetas y materiales",
  description: "Encontrá qué necesitás para crear objetos en Valheim y dónde conseguir cada material.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
