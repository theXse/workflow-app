"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ViajeTask = {
  id: string;
  usuario: string;
  tarea: string;
  fecha_limite: string;
  categoria: string;
  estado: boolean;
  created_at: string;
};

export default function Viaje() {
  const [tasks, setTasks] = useState<ViajeTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [usuario, setUsuario] = useState("");
  const [tarea, setTarea] = useState("");
  const [fechaLimite, setFechaLimite] = useState("");
  const [categoria, setCategoria] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("viaje")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setTasks(data);
    if (error) console.error("Error fetching viaje tasks:", error);
    setLoading(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario.trim() || !tarea.trim()) return;

    const newTask = {
      usuario,
      tarea,
      fecha_limite: fechaLimite || null,
      categoria,
      estado: false,
    };

    const { data, error } = await supabase
      .from("viaje")
      .insert(newTask)
      .select()
      .single();

    if (error) {
      alert(`Error: ${error.message}`);
    } else if (data) {
      setTasks([data, ...tasks]);
      setTarea("");
      setFechaLimite("");
      setCategoria("");
      // No reseteamos usuario para que sea más fácil agregar múltiples tareas rápido
    }
  };

  const toggleTaskStatus = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === id ? { ...t, estado: nextStatus } : t));

    const { error } = await supabase
      .from("viaje")
      .update({ estado: nextStatus })
      .eq("id", id);

    if (error) {
      alert(`Error al actualizar estado: ${error.message}`);
      // Revert if error
      setTasks(tasks.map(t => t.id === id ? { ...t, estado: currentStatus } : t));
    }
  };

  const handleDeleteTask = async (id: string) => {
    // Optimistic UI update
    const previousTasks = [...tasks];
    setTasks(tasks.filter(t => t.id !== id));

    const { error } = await supabase
      .from("viaje")
      .delete()
      .eq("id", id);

    if (error) {
      alert(`Error al eliminar tarea: ${error.message}`);
      setTasks(previousTasks);
    }
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Cargando tareas de viaje...</div>;

  return (
    <div className="min-h-screen bg-black p-4 md:p-10 font-sans text-white">
      <div className="max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
          ✈️ Tareas de Viaje
        </h1>

        {/* Formulario de creación */}
        <div className="mb-10 bg-zinc-900 rounded-2xl p-6 border border-zinc-800 shadow-xl">
          <h2 className="text-xl font-bold mb-4 text-emerald-400">Agregar Nueva Tarea</h2>
          <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                className="p-3 rounded-xl bg-zinc-950 text-white text-sm border border-zinc-700 outline-none focus:border-green-500 transition-colors"
                value={usuario}
                onChange={e => setUsuario(e.target.value)}
                required
              >
                <option value="" disabled>Selecciona quién la hace...</option>
                <option value="Xime">Xime</option>
                <option value="Diana">Diana</option>
              </select>
              <input
                type="text"
                placeholder="Categoría (Ej. Vuelos, Hoteles, Equipaje)"
                className="p-3 rounded-xl bg-zinc-950 text-white text-sm border border-zinc-700 outline-none focus:border-green-500 transition-colors"
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
              />
            </div>
            
            <input
              type="text"
              placeholder="Descripción de la tarea..."
              className="p-3 rounded-xl bg-zinc-950 text-white text-sm border border-zinc-700 outline-none focus:border-green-500 transition-colors"
              value={tarea}
              onChange={e => setTarea(e.target.value)}
              required
            />
            
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="w-full md:w-1/2 flex items-center bg-zinc-950 border border-zinc-700 p-1 rounded-xl focus-within:border-green-500 transition-colors">
                <span className="text-zinc-500 px-3 text-sm">📅 Límite:</span>
                <input
                  type="date"
                  className="p-2 w-full bg-transparent text-white text-sm outline-none [color-scheme:dark]"
                  value={fechaLimite}
                  onChange={e => setFechaLimite(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="w-full md:w-1/2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold p-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transform hover:-translate-y-0.5"
              >
                Agregar Tarea
              </button>
            </div>
          </form>
        </div>

        {/* Lista de Tareas */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center p-10 bg-zinc-900/50 rounded-2xl border border-zinc-800 text-zinc-500">
              No hay tareas de viaje registradas. ¡Agrega la primera!
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center transition-all ${
                  task.estado 
                    ? "bg-zinc-950/60 border-zinc-800 opacity-60" 
                    : "bg-zinc-900 border-zinc-700 hover:border-zinc-500 shadow-md"
                }`}
              >
                <div className="flex items-start gap-4 flex-1 w-full">
                  <label className="flex items-center cursor-pointer relative mt-1">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={task.estado}
                      onChange={() => toggleTaskStatus(task.id, task.estado)}
                    />
                    <div className="w-6 h-6 rounded-full border-2 border-zinc-500 peer-checked:bg-green-500 peer-checked:border-green-500 transition-all flex items-center justify-center">
                      {task.estado && (
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </label>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm md:text-base break-words">
                        {task.usuario}
                      </span>
                      {task.categoria && (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/50">
                          {task.categoria}
                        </span>
                      )}
                    </div>
                    <p className={`text-base md:text-lg break-words ${task.estado ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {task.tarea}
                    </p>
                    {task.fecha_limite && (
                      <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${task.estado ? 'text-zinc-600' : 'text-zinc-400'}`}>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(task.fecha_limite).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="sm:ml-4 text-zinc-600 hover:text-red-500 transition-colors p-2 hover:bg-zinc-800 rounded-full shrink-0"
                  title="Eliminar tarea"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
