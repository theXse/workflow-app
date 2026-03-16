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
      <body className="bg-black text-white">
        {/* Navegación Global con las 3 pestañas integradas */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur-md border-b border-zinc-800 p-4 shadow-xl">
          <div className="max-w-7xl mx-auto flex justify-center items-center gap-4 md:gap-10">

            <Link
              href="/mis-tareas"
              className="text-white font-black text-[9px] md:text-xs hover:text-blue-400 transition-colors uppercase tracking-tighter md:tracking-normal"
            >
              📋 Tareas
            </Link>

            <Link
              href="/aprobaciones"
              className="text-white font-black text-[9px] md:text-xs hover:text-purple-400 transition-colors uppercase tracking-tighter md:tracking-normal"
            >
              📸 Aprobaciones
            </Link>

            <Link
              href="/recordatorios"
              className="text-purple-400 font-black text-[9px] md:text-xs hover:text-white transition-colors uppercase tracking-tighter md:tracking-normal border-l border-zinc-700 pl-4 md:pl-10"
            >
              🎙️ Recordatorios
            </Link>

          </div>
        </nav>

        {/* El pt-24 asegura que el contenido no quede tapado por el menú superior */}
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}