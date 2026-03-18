cat << 'EOF' > app / recordatorios / page.tsx
'use client';

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Recordatorio = {
    id: string;
    tarea: string;
    completada: boolean;
    urgencia: 'Baja' | 'Media' | 'Alta';
    created_at: string;
};

export default function RecordatoriosPage() {
    const [tasks, setTasks] = useState<Recordatorio[]>([]);
    const [nuevaTarea, setNuevaTarea] = useState("");
    const [urgencia, setUrgencia] = useState<'Baja' | 'Media' | 'Alta'>('Baja');
    const [loading, setLoading] = useState(true);

    const fetchTasks = async () => {
        const { data } = await supabase
            .from("recordatorios_generales")
            .select("*")
            .order('urgencia', { ascending: false })
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
            urgencia: urgencia
        }]);
        setNuevaTarea("");
        fetchTasks();
    };

    const toggleTask = async (id: string, current: boolean) => {
        await supabase.from("recordatorios_generales").update({ completada: !current }).eq("id", id);
    };

    // Función para verificar si pasaron 24 horas (86400000 ms)
    const esCritica = (fecha: string) => {
        const diferencia = new Date().getTime() - new Date(fecha).getTime();
        return diferencia > 86400000;
    };

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-black text-purple-500 italic uppercase tracking-widest">Sincronizando...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32 font-sans">
            <div className="max-w-xl mx-auto">
                <header className="mb-10">
                    <h1 className="text-5xl font-black tracking-tighter italic text-purple-500 mb-2 uppercase">Civilia Alertas</h1>
                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em]">Gestión de urgencia 24h</p>
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
                            <button
                                key={nivel}
                                type="button"
                                onClick={() => setUrgencia(nivel)}
                                className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${urgencia === nivel
                                        ? (nivel === 'Alta' ? 'bg-red-600 text-white shadow-[0_0_10px_rgba(220,38,38,0.5)]' : 'bg-purple-600 text-white')
                                        : 'text-zinc-600'
                                    }`}
                            >
                                {nivel}
                            </button>
                        ))}
                    </div>
                </form>

                <div className="space-y-6">
                    {tasks.map((task) => {
                        const antigua = esCritica(task.created_at) && !task.completada;
                        return (
                            <div key={task.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col gap-4 ${task.completada ? "bg-zinc-950 border-zinc-900 opacity-40" :
                                    task.urgencia === 'Alta' ? "bg-red-950/20 border-red-600 shadow-[0_0_20px_rgba(220,38,38,0.1)]" :
                                        "bg-zinc-900/50 border-purple-500/30"
                                }`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${task.urgencia === 'Alta' ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-500"
                                                }`}>
                                                {task.urgencia}
                                            </span>
                                            {antigua && <span className="text-[8px] font-black bg-orange-500 text-white px-2 py-0.5 rounded-full animate-pulse">ALERTA +24H</span>}
                                        </div>
                                        <p className={`text-lg font-bold leading-tight ${task.completada ? "line-through text-zinc-600" : "text-white"}`}>
                                            {task.tarea}
                                        </p>
                                    </div>
                                    <button onClick={() => toggleTask(task.id, task.completada)} className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${task.completada ? "bg-zinc-800 text-zinc-500" : task.urgencia === 'Alta' ? "bg-red-600 text-white" : "bg-white text-black"}`}>
                                        <span className="font-bold text-xl">{task.completada ? "✕" : "✓"}</span>
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
EOF