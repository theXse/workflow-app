"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contenido = {
    id: string;
    proyecto: string;
    mes: string;
    etapa: 'textos' | 'diseno' | 'cliente' | 'aprobado' | 'publicado';
    comentarios_xime: string;
    comentarios_cliente: string;
    link_textos: string;
    link_diseno: string;
    versiones: number;
    tarea_lista: boolean; // Nueva marca de control
};

const PROYECTOS = ["Portal Baquedano", "Jardines de Bellavista 3", "Jardín del Norte", "Circunvalación Sur", "Vive Janequeo", "Los Jesuitas", "Green Concepción", "Vive Ainavillo"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AprobacionesPage() {
    const [contenidos, setContenidos] = useState<Contenido[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<string>('todos');
    const [nuevoProyecto, setNuevoProyecto] = useState(PROYECTOS[0]);
    const [nuevoMes, setNuevoMes] = useState(MESES[new Date().getMonth()]);

    useEffect(() => { fetchContenidos(); }, []);

    const fetchContenidos = async () => {
        const { data } = await supabase.from("flujo_contenidos").select("*").order("created_at", { ascending: false });
        if (data) setContenidos(data as Contenido[]);
        setLoading(false);
    };

    const crearFicha = async () => {
        const { data } = await supabase.from("flujo_contenidos").insert({
            proyecto: nuevoProyecto, mes: nuevoMes, etapa: 'textos', versiones: 1, tarea_lista: false
        }).select().single();
        if (data) setContenidos([data as Contenido, ...contenidos]);
    };

    const actualizarCampo = async (id: string, campo: string, valor: any) => {
        setContenidos(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
        await supabase.from("flujo_contenidos").update({ [campo]: valor }).eq("id", id);
    };

    const filtrados = contenidos.filter(c => filtro === 'todos' ? true : c.etapa === filtro);

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24 text-center font-black">CARGANDO CONTROL...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans pb-40">
            <div className="max-w-6xl mx-auto">

                {/* CABECERA */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">Aprobaciones IG</h1>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Sincronizado con Diseñadora</p>
                        </div>
                    </div>
                    <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 shadow-xl">
                        {['todos', 'diseno', 'cliente', 'aprobado'].map((f) => (
                            <button key={f} onClick={() => setFiltro(f)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtro === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                                {f === 'todos' ? 'Ver Todo' : f === 'diseno' ? 'En Diseño' : f === 'cliente' ? 'Con Cliente' : 'Listos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* LISTADO */}
                <div className="space-y-12">
                    {filtrados.map(item => (
                        <div key={item.id} className={`rounded-[3rem] border-2 transition-all p-6 md:p-12 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.1)]" :
                                item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]" :
                                    item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.1)]" : "border-zinc-800 bg-zinc-900/40"
                            }`}>

                            {/* ITERACIÓN */}
                            <div className="absolute -top-4 right-12 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl z-20">
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Versión</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', Math.max(1, (item.versiones || 1) - 1))} className="text-zinc-500 hover:text-white px-1">-</button>
                                    <span className="text-sm font-black text-amber-500 min-w-[25px] text-center">V{item.versiones || 1}</span>
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', (item.versiones || 1) + 1)} className="text-zinc-500 hover:text-white px-1">+</button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter">{item.proyecto}</h2>
                                    <p className="text-purple-400 font-black text-[10px] uppercase tracking-[0.3em] mt-3 bg-purple-500/10 w-fit px-3 py-1 rounded-lg">{item.mes}</p>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <select
                                        value={item.etapa}
                                        onChange={(e) => {
                                            actualizarCampo(item.id, 'etapa', e.target.value);
                                            if (e.target.value === 'diseno') actualizarCampo(item.id, 'tarea_lista', false);
                                        }}
                                        className={`flex-1 md:flex-none text-xs font-black px-8 py-4 rounded-[1.5rem] border-none outline-none cursor-pointer shadow-2xl transition-all ${item.etapa === 'aprobado' ? "bg-green-500 text-black" :
                                                item.etapa === 'cliente' ? "bg-blue-600 text-white" :
                                                    item.etapa === 'diseno' ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-200"
                                            }`}
                                    >
                                        <option value="textos">✍️ FASE 1: TEXTOS</option>
                                        <option value="diseno">🎨 FASE 2: DISEÑO</option>
                                        <option value="cliente">🤝 FASE 3: CLIENTE</option>
                                        <option value="aprobado">✅ APROBADO FINAL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className={`transition-all p-6 rounded-[2rem] border-2 ${item.tarea_lista ? 'bg-green-900/10 border-green-900/30' : 'bg-zinc-950 border-zinc-800'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Instrucciones de Xime</label>
                                            <button
                                                onClick={() => actualizarCampo(item.id, 'tarea_lista', !item.tarea_lista)}
                                                className={`text-[9px] font-black px-3 py-1 rounded-full transition-all ${item.tarea_lista ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500 hover:text-white'}`}
                                            >
                                                {item.tarea_lista ? '✓ REALIZADO' : 'MARCAR REALIZADO'}
                                            </button>
                                        </div>
                                        <textarea
                                            placeholder="Qué debe hacer diseño..."
                                            className={`w-full bg-transparent text-sm h-40 outline-none transition-all ${item.tarea_lista ? 'text-zinc-600 italic line-through' : 'text-white'}`}
                                            value={item.comentarios_xime || ""}
                                            onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Link Arte Final (V{item.versiones})</label>
                                        <div className="flex gap-4">
                                            <input type="text" placeholder="Link de descarga..." className="flex-1 p-5 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-green-400 font-black outline-none" value={item.link_diseno || ""} onChange={e => actualizarCampo(item.id, 'link_diseno', e.target.value)} />
                                            {item.link_diseno && <a href={item.link_diseno} target="_blank" className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 flex items-center">↗</a>}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/20">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 block">Feedback Cliente</label>
                                        <textarea placeholder="Cambios del cliente..." className="w-full p-5 rounded-2xl bg-transparent border border-blue-500/20 text-sm h-40 text-blue-100 outline-none italic" value={item.comentarios_cliente || ""} onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}