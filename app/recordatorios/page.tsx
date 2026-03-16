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

    // Función para traer los datos
    const fetchTasks = async () => {
        const { data, error } = await supabase
            .from("recordatorios_generales")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) console.error("Error cargando recordatorios:", error);
        if (data) setTasks(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();

        // SUSCRIPCIÓN EN TIEMPO REAL
        // Esto hace que si dictas algo en la calle, aparezca en la pantalla sin refrescar
        const channel = supabase
            .channel("cambios-recordatorios")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "recordatorios_generales" },
                () => fetchTasks()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const toggleTask = async (id: string, currentStatus: boolean) => {
        const nextStatus = !currentStatus;
        // Actualización optimista (rápida en pantalla)
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completada: nextStatus } : t));

        await supabase
            .from("recordatorios_generales")
            .update({ completada: nextStatus })
            .eq("id", id);
    };

    const eliminarTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from("recordatorios_generales").delete().eq("id", id);
    };

    if (loading) return <div className="p-10 text-white bg-black min-h-screen flex items-center justify-center font-black uppercase tracking-widest">Sincronizando notas de voz...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans">
            <div className="max-w-xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-5xl font-black tracking-tighter italic text-purple-500 mb-2">RECORDATORIOS</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Buzón de voz inteligente</p>
                </header>

                <div className="space-y-4">
                    {tasks.length === 0 && (
                        <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                            <p className="text-zinc-600 font-bold uppercase text-xs tracking-widest">No hay mensajes dictados</p>
                        </div>
                    )}

                    {tasks.map((task) => (
                        <div
                            key={task.id}
                            className={`group p-6 rounded-[2.5rem] border-2 transition-all flex justify-between items-center ${task.completada
                                    ? "bg-zinc-950 border-zinc-900 opacity-40 shadow-none"
                                    : "bg-zinc-900/50 border-purple-500/30 shadow-[0_0_30px_rgba(168,85,247,0.1)]"
                                }`}
                        >
                            <div className="flex-1 pr-4">
                                <p className={`text-lg font-bold leading-tight transition-all ${task.completada ? "line-through text-zinc-600" : "text-white"}`}>
                                    {task.tarea}
                                </p>
                                <div className="flex gap-3 mt-3 items-center">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                        {new Date(task.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short' })}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-zinc-800"></span>
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                                        {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => toggleTask(task.id, task.completada)}
                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 ${task.completada ? "bg-zinc-800 text-zinc-500" : "bg-white text-black shadow-lg shadow-white/10"
                                        }`}
                                >
                                    <span className="font-bold text-xl">{task.completada ? "✕" : "✓"}</span>
                                </button>
                                <button
                                    onClick={() => eliminarTask(task.id)}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-800 hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}