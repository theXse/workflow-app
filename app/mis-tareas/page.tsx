'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type MailingTask = {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  urgencia: 'Baja' | 'Media' | 'Alta';
  fecha_limite: string;
};

export default function MisTareas() {
  const [tasks, setTasks] = useState<MailingTask[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [urgencia, setUrgencia] = useState<'Baja' | 'Media' | 'Alta'>('Baja');
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<MailingTask | null>(null);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tareas").select("*").order('created_at', { ascending: false });
    if (data) setTasks(data as MailingTask[]);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!newTitle.trim() || loading) return;
    await supabase.from("tareas").insert([{
      titulo: newTitle,
      estado: 'Pendiente',
      urgencia: urgencia,
      descripcion: "",
      fecha_limite: new Date().toLocaleDateString('es-CL')
    }]);
    setNewTitle("");
    fetchTasks();
  };

  const saveEdit = async () => {
    if (!editando) return;
    await supabase.from("tareas")
      .update({
        titulo: editando.titulo,
        descripcion: editando.descripcion,
        urgencia: editando.urgencia
      })
      .eq("id", editando.id);
    setEditando(null);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("¿Eliminar este mailing?")) return;
    await supabase.from("tareas").delete().eq("id", id);
    fetchTasks();
  };

  if (loading) return <div className="min-h-screen bg-zinc-100 flex items-center justify-center font-black text-zinc-400 uppercase italic">Cargando...</div>;

  return (
    <div className="min-h-screen bg-zinc-100 p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto md:max-w-xl">
        <h1 className="text-3xl font-black mb-8 text-zinc-900 pt-4 italic tracking-tighter text-center uppercase">Mailings / Civilia</h1>

        <div className="bg-white p-5 rounded-[2rem] shadow-xl mb-10 space-y-4 border-2 border-zinc-200">
          <input
            type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Nombre de la campaña..."
            className="w-full p-4 rounded-2xl bg-zinc-50 text-lg border-none focus:ring-2 focus:ring-blue-500 text-black font-bold outline-none"
          />
          <div className="flex gap-2">
            {(['Baja', 'Media', 'Alta'] as const).map((nivel) => (
              <button key={nivel} onClick={() => setUrgencia(nivel)}
                className={`flex-1 p-3 rounded-xl font-black text-[10px] uppercase transition-all ${urgencia === nivel ? (nivel === 'Alta' ? 'bg-red-600 text-white shadow-lg' : 'bg-zinc-800 text-white') : 'bg-zinc-100 text-zinc-500'}`}>
                {nivel}
              </button>
            ))}
          </div>
          <button onClick={addTask} className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-lg active:scale-95 shadow-lg shadow-blue-200 uppercase tracking-widest">Añadir</button>
        </div>

        <div className="space-y-5">
          {tasks.map((task) => (
            <div key={task.id} className={`p-6 rounded-[2rem] bg-white shadow-sm border-l-[12px] flex flex-col gap-4 ${task.urgencia === 'Alta' ? 'border-red-600' : task.urgencia === 'Media' ? 'border-orange-400' : 'border-zinc-300'}`}>
              <div className="flex justify-between items-start gap-3">
                <div className="flex-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase mb-2 inline-block ${task.urgencia === 'Alta' ? 'bg-red-600 text-white' : 'bg-zinc-200 text-zinc-500'}`}>{task.urgencia}</span>
                  <h3 className="text-xl font-black text-zinc-900 leading-tight uppercase tracking-tight">{task.titulo}</h3>
                  {task.descripcion && <p className="text-xs text-zinc-500 mt-2 italic line-clamp-2 leading-relaxed">{task.descripcion}</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => setEditando(task)} className="bg-zinc-100 p-3 rounded-2xl text-[9px] font-black uppercase text-zinc-600">Edit</button>
                  <button onClick={() => deleteTask(task.id)} className="bg-zinc-50 p-3 rounded-2xl text-zinc-300 hover:text-red-500">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editando && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white border-2 border-zinc-200 w-full max-w-sm rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic text-zinc-900 tracking-tighter">Editar Mailing</h2>
            <div className="space-y-4">
              <label className="text-[9px] font-black uppercase text-zinc-400 block tracking-widest">Prioridad</label>
              <div className="flex gap-2 bg-zinc-100 p-1 rounded-2xl">
                {(['Baja', 'Media', 'Alta'] as const).map((n) => (
                  <button key={n} onClick={() => setEditando({ ...editando, urgencia: n })}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${editando.urgencia === n ? (n === 'Alta' ? 'bg-red-600 text-white' : 'bg-zinc-900 text-white') : 'text-zinc-400'}`}>
                    {n}
                  </button>
                ))}
              </div>
              <label className="text-[9px] font-black uppercase text-zinc-400 block tracking-widest">Título</label>
              <input className="w-full bg-zinc-50 p-4 rounded-xl text-black font-bold outline-none border border-zinc-100 focus:border-blue-500"
                value={editando.titulo} onChange={(e) => setEditando({ ...editando, titulo: e.target.value })} />
              <label className="text-[9px] font-black uppercase text-zinc-400 block tracking-widest">Información / Links</label>
              <textarea className="w-full bg-zinc-50 p-4 rounded-xl text-zinc-700 outline-none border border-zinc-100 focus:border-blue-500 min-h-[120px] text-sm"
                value={editando.descripcion} onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white font-black p-4 rounded-2xl uppercase text-xs shadow-lg shadow-blue-200">Guardar</button>
              <button onClick={() => setEditando(null)} className="bg-zinc-100 text-zinc-400 font-black px-6 rounded-2xl uppercase text-[9px]">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}