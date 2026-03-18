'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recordatorio = {
    id: string;
    tarea: string;
    descripcion: string;
    completada: boolean;
    urgencia: 'Baja' | 'Media' | 'Alta';
    created_at: string;
};

export default function RecordatoriosPage() {
    const [tasks, setTasks] = useState<Recordatorio[]>([]);
    const [nuevaTarea, setNuevaTarea] = useState("");
    const [urgencia, setUrgencia] = useState<'Baja' | 'Media' | 'Alta'>('Baja');
    const [loading, setLoading] = useState(true);

    // Estado para el Modal de Edición
    const [editando, setEditando] = useState<Recordatorio | null>(null);

    const fetchTasks = async () => {
        const { data } = await supabase
            .from("recordatorios_generales")
            .select("*")
            .order('created_at', { ascending: false });
        if (data) setTasks(data as Recordatorio[]);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
        const channel = supabase.channel("realtime-civilia")
            .on("postgres_changes", { event: "*", schema: "public", table: "recordatorios_generales" }, () => fetchTasks())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleCrear = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevaTarea.trim()) return;
        await supabase.from("recordatorios_generales").insert([{
            tarea: nuevaTarea,
            completada: false,
            urgencia: urgencia,
            descripcion: ""
        }]);
        setNuevaTarea("");
        fetchTasks();
    };

    const handleGuardarEdicion = async () => {
        if (!editando) return;
        await supabase.from("recordatorios_generales")
            .update({ tarea: editando.tarea, descripcion: editando.descripcion })
            .eq("id", editando.id);
        setEditando(null);
        fetchTasks();
    };

    const toggleTask = async (id: string, current: boolean) => {
        await supabase.from("recordatorios_generales").update({ completada: !current }).eq("id", id);
        fetchTasks();
    };

    const eliminarTask = async (id: string) => {
        if (!confirm("¿Eliminar permanentemente de Civilia?")) return;
        await supabase.from("recordatorios_generales").delete().eq("id", id);
        fetchTasks();
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-black text-purple-500 italic uppercase tracking-widest text-sm">Sincronizando...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans relative">
            <div className="max-w-xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-5xl font-black italic text-purple-500 mb-2 uppercase tracking-tighter">Civilia Pro</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestión detallada activa</p>
                </header>

                <form onSubmit={handleCrear} className="mb-12 space-y-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Nuevo recordatorio..."
                            className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-purple-500 transition-all text-white"
                            value={nuevaTarea}
                            onChange={(e) => setNuevaTarea(e.target.value)}
                        />
                        <button type="submit" className="bg-white text-black font-black px-6 rounded-2xl text-xs uppercase hover:bg-purple-500 hover:text-white transition-all">
                            Añadir
                        </button>
                    </div>
                    <div className="flex gap-2 p-1 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                        {(['Baja', 'Media', 'Alta'] as const).map((nivel) => (
                            <button key={nivel} type="button" onClick={() => setUrgencia(nivel)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${urgencia === nivel ? (nivel === 'Alta' ? 'bg-red-600 text-white' : 'bg-purple-600 text-white') : 'text-zinc-600'}`}>
                                {nivel}
                            </button>
                        ))}
                    </div>
                </form>

                <div className="space-y-6">
                    {tasks.map((task) => (
                        <div key={task.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-4 ${task.completada ? "bg-zinc-950 border-zinc-900 opacity-40" : task.urgencia === 'Alta' ? "bg-red-950/20 border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.15)]" : "bg-zinc-900/50 border-purple-500/30"}`}>
                            <div className="flex justify-between items-start">
                                <div className="flex-1 pr-4">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase mb-2 inline-block ${task.urgencia === 'Alta' ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>
                                        {task.urgencia}
                                    </span>
                                    <p className={`text-lg font-bold leading-tight ${task.completada ? "line-through text-zinc-600" : "text-white"}`}>{task.tarea}</p>
                                    {task.descripcion && <p className="text-zinc-400 text-xs mt-2 italic line-clamp-2">{task.descripcion}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <button onClick={() => toggleTask(task.id, task.completada)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${task.completada ? "bg-zinc-800 text-zinc-500" : "bg-white text-black"}`}>
                                        <span className="font-bold">✓</span>
                                    </button>
                                    <button onClick={() => setEditando(task)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white">
                                        <span className="text-xs font-black">EDIT</span>
                                    </button>
                                    <button onClick={() => eliminarTask(task.id)} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-600 hover:text-red-500">
                                        <span className="text-[10px]">✕</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL DE EDICIÓN */}
            {editando && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-[2.5rem] p-8 space-y-6 shadow-2xl">
                        <h2 className="text-2xl font-black italic text-purple-500 uppercase">Detalles de Tarea</h2>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase text-zinc-500">Título</label>
                            <input
                                className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-purple-500"
                                value={editando.tarea}
                                onChange={(e) => setEditando({ ...editando, tarea: e.target.value })}
                            />
                            <label className="text-[10px] font-black uppercase text-zinc-500">Información Adicional (Contexto, Links, etc.)</label>
                            <textarea
                                className="w-full bg-black border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-purple-500 min-h-[150px]"
                                value={editando.descripcion}
                                onChange={(e) => setEditando({ ...editando, descripcion: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={handleGuardarEdicion} className="flex-1 bg-white text-black font-black p-4 rounded-2xl uppercase text-xs">Guardar Cambios</button>
                            <button onClick={() => setEditando(null)} className="bg-zinc-800 text-zinc-400 font-black px-6 rounded-2xl uppercase text-xs">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}