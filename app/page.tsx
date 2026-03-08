'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Campana = { id: string; nombre: string; ubicacion: string; estado: string };

export default function Home() {
  const [campanas, setCampanas] = useState<Campana[]>([]);

  useEffect(() => {
    async function fetchCampanas() {
      const { data } = await supabase.from("campanas").select("*");
      if (data) setCampanas(data);
    }
    fetchCampanas();
  }, []);

  return (
    <div className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">Panel de Control - Civilia</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campanas.map((c) => (
          <Link href={`/campanas/${c.id}`} key={c.id}>
            <div className="p-6 border rounded-xl hover:shadow-lg transition-shadow cursor-pointer bg-white">
              <h2 className="text-xl font-bold">{c.nombre}</h2>
              <p className="text-gray-600">{c.ubicacion}</p>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm ${c.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {c.estado}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-12">
        <Link href="/mis-tareas" className="text-blue-600 underline">Ir a Mis Tareas</Link>
      </div>
    </div>
  );
}
