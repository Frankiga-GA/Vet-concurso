import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IAVET Agro — Inteligencia Artificial y Visión Móvil para Galpones",
  description: "Censo avícola, control de lotes y monitoreo zoosanitario con cámara de celular en Chincha, Pisco e Ica.",
  applicationName: "IAVET Agro",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#14634d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
