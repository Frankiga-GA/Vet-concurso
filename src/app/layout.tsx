import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VetIA — cuidado conectado",
  description: "Orientación inicial y conexión con veterinarias aprobadas en Ica, Pisco y Chincha.",
  applicationName: "VetIA",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icons/icon.svg", apple: "/icons/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#14634d",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
