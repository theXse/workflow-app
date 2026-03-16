"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recordatorio = {
    id: string;
    tarea: string;
    completada: boolean;
    created_at: string;
};

export default function RecordatoriosPage() {
    const [tasks, setTasks] = useState<Recordatorio[]>([]);
    const [loading, setLoading] = useState(true);
    const [nuevaTarea, setNuevaTarea] = useState("");

    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("recordatorios_generales")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Error:", error);
        if (data) setTasks(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
        const channel = supabase.channel("cambios-recordatorios")
            .on("postgres_changes", { event: "*", schema: "public", table: "recordatorios_generales" }, () => fetchTasks())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    // FUNCIÓN PARA CREAR DESDE EL COMPUTADOR
    const handleCrearTarea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nuevaTarea.trim()) return;

        const { error } = await supabase
            .from("recordatorios_generales")
            .insert([{ tarea: nuevaTarea, completada: false }]);

        if (error) alert("Error al guardar: " + error.message);
        else {
            setNuevaTarea("");
            fetchTasks();
        }
    };

    const toggleTask = async (id: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completada: nextStatus } : t));
        await supabase.from("recordatorios_generales").update({ completada: nextStatus }).eq("id", id);
    };

    const eliminarTask = async (id: string) => {
        if (!confirm("¿Eliminar permanentemente?")) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from("recordatorios_generales").delete().eq("id", id);
    };

    const esAntiguo = (fechaStr: string) => {
        const diferenciaDias = (new Date().getTime() - new Date(fechaStr).getTime()) / (1000 * 60 * 60 * 24);
        return diferenciaDias >= 2;
    };

    if (loading) return <div className="p-10 text-white bg-black min-h-screen flex items-center justify-center font-black uppercase">Sincronizando...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans">
            <div className="max-w-xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-5xl font-black tracking-tighter italic text-purple-500 mb-2 uppercase">Recordatorios</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Dictado por voz o manual</p>
                </header>

                {/* --- ENTRADA MANUAL DESDE PC --- */}
                <form onSubmit={handleCrearTarea} className="mb-12 flex gap-3">
                    <input
                        type="text"
                        placeholder="Escribe un recordatorio desde el PC..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-sm outline-none focus:border-purple-500 transition-all"
                        value={nuevaTarea}
                        onChange={(e) => setNuevaTarea(e.target.value)}
                    />
                    <button type="submit" className="bg-white text-black font-black px-6 rounded-2xl text-xs uppercase hover:bg-purple-500 hover:text-white transition-all">
                        Añadir
                    </button>
                </form>

                {/* --- LISTADO --- */}
                <div className="space-y-6">
                    {tasks.map((task) => {
                        const alertaRoja = esAntiguo(task.created_at) && !task.completada;
                        return (
                            <div key={task.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${task.completada ? "bg-zinc-950 border-zinc-900 opacity-40" : alertaRoja ? "bg-red-950/20 border-red-500 animate-pulse" : "bg-zinc-900/50 border-purple-500/30"
                                }`}>
                                <div className="flex-1 pr-4">
                                    {alertaRoja && <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full mb-2 inline-block">¡HACE +2 DÍAS!</span>}
                                    <p className={`text-lg font-bold leading-tight ${task.completada ? "line-through text-zinc-600" : "text-white"}`}>{task.tarea}</p>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase mt-2">{new Date(task.created_at).toLocaleString('es-CL')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => toggleTask(task.id, task.completada)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${task.completada ? "bg-zinc-800 text-zinc-500" : alertaRoja ? "bg-red-600 text-white" : "bg-white text-black"}`}>
                                        <span className="font-bold text-xl">{task.completada ? "✕" : "✓"}</span>
                                    </button>
                                    <button onClick={() => eliminarTask(task.id)} className="text-zinc-800 hover:text-red-500 p-2"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}