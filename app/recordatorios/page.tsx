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

    const toggleTask = async (id: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completada: nextStatus } : t));
        await supabase.from("recordatorios_generales").update({ completada: nextStatus }).eq("id", id);
    };

    const eliminarTask = async (id: string) => {
        if (!confirm("¿Eliminar este recordatorio permanentemente?")) return;
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from("recordatorios_generales").delete().eq("id", id);
    };

    // FUNCIÓN PARA VERIFICAR SI TIENE MÁS DE 2 DÍAS
    const esAntiguo = (fechaStr: string) => {
        const fechaTarea = new Date(fechaStr).getTime();
        const ahora = new Date().getTime();
        const diferenciaDias = (ahora - fechaTarea) / (1000 * 60 * 60 * 24);
        return diferenciaDias >= 2;
    };

    if (loading) return <div className="p-10 text-white bg-black min-h-screen flex items-center justify-center font-black uppercase">Calculando tiempos...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans">
            <div className="max-w-xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-5xl font-black tracking-tighter italic text-purple-500 mb-2 uppercase">Recordatorios</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Alertas automáticas activadas</p>
                </header>

                <div className="space-y-6">
                    {tasks.map((task) => {
                        const alertaRoja = esAntiguo(task.created_at) && !task.completada;

                        return (
                            <div
                                key={task.id}
                                className={`group p-6 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${task.completada
                                        ? "bg-zinc-950 border-zinc-900 opacity-40 shadow-none"
                                        : alertaRoja
                                            ? "bg-red-950/20 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse" // ALERTA 2 DÍAS
                                            : "bg-zinc-900/50 border-purple-500/30"
                                    }`}
                            >
                                <div className="flex-1 pr-4">
                                    {alertaRoja && (
                                        <span className="text-[8px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full mb-2 inline-block animate-bounce">
                                            ¡HACE MÁS DE 2 DÍAS!
                                        </span>
                                    )}
                                    <p className={`text-lg font-bold leading-tight ${task.completada ? "line-through text-zinc-600" : "text-white"}`}>
                                        {task.tarea}
                                    </p>
                                    <p className="text-[9px] font-black text-zinc-500 uppercase mt-2 tracking-widest">
                                        {new Date(task.created_at).toLocaleDateString('es-CL')} · {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleTask(task.id, task.completada)}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${task.completada ? "bg-zinc-800 text-zinc-500" : alertaRoja ? "bg-red-600 text-white" : "bg-white text-black shadow-lg"
                                            }`}
                                    >
                                        <span className="font-bold text-xl">{task.completada ? "✕" : "✓"}</span>
                                    </button>
                                    <button onClick={() => eliminarTask(task.id)} className="text-zinc-800 hover:text-red-500 transition-colors p-2">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}