import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CENTÍMETRO",
  description:
    "Compara la talla en centímetros contra una prenda tuya, antes de comprar en línea. Sin cuenta, sin guardar nada en el servidor. Y una propuesta: la etiqueta en cm.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#F3C623" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-MX">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,700;9..144,900&family=Instrument+Sans:wght@400;600;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
