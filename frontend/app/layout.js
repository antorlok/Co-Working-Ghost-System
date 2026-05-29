import "./globals.css";

export const metadata = {
  title: "Ghost Coworking | Espacios de Trabajo Flexibles & Reservación Premium",
  description: "Reserva salas de juntas, escritorios individuales y oficinas ejecutivas en nuestro sistema de co-working premium. Lógica distribuida con microservicios.",
  keywords: ["coworking", "reservaciones", "oficinas", "espacios de trabajo", "fastapi", "golang", "rust"],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full animate-fade-in">
        {children}
      </body>
    </html>
  );
}
