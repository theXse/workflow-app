import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "Workflow Xime",
  description: "Gestión de agencia y contenidos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="bg-black">
        {/* Este es el menú que te permitirá saltar entre secciones */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/80 backdrop-blur-md border-b border-zinc-800 p-4 shadow-lg">
          <div className="max-w-7xl mx-auto flex justify-center gap-10">
            <Link href="/mis-tareas" className="text-white font-bold text-xs md:text-sm hover:text-blue-400 transition-colors">
              📋 TAREAS Y MAILINGS
            </Link>
            <Link href="/aprobaciones" className="text-white font-bold text-xs md:text-sm hover:text-purple-400 transition-colors">
              📸 APROBACIONES IG
            </Link>
          </div>
        </nav>
        {/* El pt-24 asegura que el contenido empiece debajo del menú */}
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}