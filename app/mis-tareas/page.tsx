"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function MisTareas() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [editando, setEditando] = useState<any | null>(null);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tareas").select("*").order('created_at', { ascending: false });
    if (data) setTasks(data);
  };

  useEffect(() => { fetchTasks(); }, []);

  const addTask = async () => {
    if (!newTitle) return;
    // Ahora incluimos descripción vacía por defecto
    await supabase.from("tareas").insert([{ titulo: newTitle, estado: 'Pendiente', descripcion: "" }]);
    setNewTitle("");
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (!confirm("¿Eliminar este registro de Civilia?")) return;
    await supabase.from("tareas").delete().eq("id", id);
    fetchTasks();
  };

  const saveEdit = async () => {
    if (!editando) return;
    await supabase.from("tareas")
      .update({ titulo: editando.titulo, descripcion: editando.descripcion })
      .eq("id", editando.id);
    setEditando(null);
    fetchTasks();
  };

  return (
    <div className="p-10 font-sans min-h-screen bg-white text-black">
      <h1 className="text-3xl font-black mb-6 italic tracking-tighter uppercase">Mailings / Civilia</h1>

      <div className="mb-8 flex gap-2">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva campaña..."
          className="border-2 border-black p-3 flex-1 rounded-xl font-bold"
        />
        <button onClick={addTask} className="bg-blue-600 text-white px-6 rounded-xl font-black uppercase text-sm">Añadir</button>
      </div>

      <ul className="space-y-4">
        {tasks.map((task) => (
          <li key={task.id} className="border-2 border-zinc-100 p-5 rounded-2xl flex justify-between items-center shadow-sm">
            <div className="flex-1">
              <span className="font-black text-lg uppercase block">{task.titulo}</span>
              {task.descripcion && <p className="text-xs text-zinc-500 italic mt-1">{task.descripcion}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditando(task)} className="text-[10px] font-black bg-zinc-100 px-3 py-2 rounded-lg hover:bg-zinc-200 uppercase">Edit</button>
              <button onClick={() => deleteTask(task.id)} className="text-zinc-300 hover:text-red-500 font-bold px-2">✕</button>
            </div>
          </li>
        ))}
      </ul>

      {/* MODAL DE EDICIÓN SIMPLE */}
      {editando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white border-2 border-black w-full max-w-md rounded-3xl p-8 space-y-4">
            <h2 className="text-xl font-black uppercase italic">Editar Mailing</h2>
            <input
              className="w-full border-2 border-zinc-200 p-3 rounded-xl font-bold"
              value={editando.titulo}
              onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
            />
            <textarea
              className="w-full border-2 border-zinc-200 p-3 rounded-xl min-h-[100px] text-sm"
              placeholder="Notas o links adicionales..."
              value={editando.descripcion}
              onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
            />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex-1 bg-blue-600 text-white font-black p-3 rounded-xl uppercase text-xs">Guardar</button>
              <button onClick={() => setEditando(null)} className="bg-zinc-200 px-4 rounded-xl text-xs font-black">X</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}