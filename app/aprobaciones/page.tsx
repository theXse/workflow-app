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
};

const PROYECTOS = ["Portal Baquedano", "Jardines de Bellavista 3", "Jardín del Norte", "Circunvalación Sur", "Vive Janequeo", "Los Jesuitas", "Green Concepción", "Vive Ainavillo"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AprobacionesPage() {
    const [contenidos, setContenidos] = useState<Contenido[]>([]);
    const [loading, setLoading] = useState(true);
    const [nuevoProyecto, setNuevoProyecto] = useState(PROYECTOS[0]);
    const [nuevoMes, setNuevoMes] = useState(MESES[new Date().getMonth()]);

    useEffect(() => {
        fetchContenidos();
    }, []);

    const fetchContenidos = async () => {
        const { data } = await supabase.from("flujo_contenidos").select("*").order("created_at", { ascending: false });
        if (data) setContenidos(data as Contenido[]);
        setLoading(false);
    };

    const crearFicha = async () => {
        const { data } = await supabase.from("flujo_contenidos").insert({ proyecto: nuevoProyecto, mes: nuevoMes, etapa: 'textos' }).select().single();
        if (data) setContenidos([data as Contenido, ...contenidos]);
    };

    const actualizarCampo = async (id: string, campo: string, valor: string) => {
        setContenidos(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
        await supabase.from("flujo_contenidos").update({ [campo]: valor }).eq("id", id);
    };

    const eliminarFicha = async (id: string) => {
        if (!confirm("¿Borrar registro?")) return;
        await supabase.from("flujo_contenidos").delete().eq("id", id);
        setContenidos(contenidos.filter(c => c.id !== id));
    };

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24 text-center">Cargando Mapa de Control...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans pb-40">
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Control de Contenidos Instagram
                </h1>

                {/* --- TABLA RESUMEN (TU MAPA GENERAL) --- */}
                <div className="mb-12 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30">
                    <div className="p-4 bg-zinc-900 border-b border-zinc-800">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Cuadro de Mando Mensual</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-zinc-950/50 text-zinc-500">
                                    <th className="p-4 font-black">PROYECTO</th>
                                    <th className="p-4 font-black">ESTADO</th>
                                    <th className="p-4 font-black text-center">PING-PONG</th>
                                    <th className="p-4 font-black">ÚLTIMO FEEDBACK CLIENTE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contenidos.map(c => (
                                    <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold">{c.proyecto} <span className="text-[9px] text-zinc-600 ml-1">{c.mes}</span></td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full font-black text-[9px] uppercase ${c.etapa === 'aprobado' ? "bg-green-500/20 text-green-500" :
                                                    c.etapa === 'cliente' ? "bg-blue-500/20 text-blue-500" :
                                                        c.etapa === 'diseno' ? "bg-amber-500/20 text-amber-500" : "bg-zinc-800 text-zinc-500"
                                                }`}>
                                                {c.etapa}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-mono font-bold ${c.comentarios_cliente ? "text-amber-500" : "text-zinc-700"}`}>
                                                {c.comentarios_cliente ? "ITERACIÓN V2+" : "V1"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-zinc-400 italic truncate max-w-[200px]">
                                            {c.comentarios_cliente || "Sin comentarios aún"}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREADOR DE FICHA */}
                <div className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 mb-12 flex flex-col md:flex-row gap-4 items-end shadow-2xl">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase">Proyecto</label>
                        <select className="w-full p-3 rounded-xl bg-zinc-800 border-none text-sm outline-none" value={nuevoProyecto} onChange={e => setNuevoProyecto(e.target.value)}>
                            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase">Mes</label>
                        <select className="w-full p-3 rounded-xl bg-zinc-800 border-none text-sm outline-none" value={nuevoMes} onChange={e => setNuevoMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={crearFicha} className="w-full md:w-auto bg-white text-black font-black px-10 py-3 rounded-xl hover:scale-105 transition-all text-xs uppercase tracking-widest">
                        Añadir Proyecto
                    </button>
                </div>

                {/* DETALLE DE FICHAS */}
                <div className="space-y-10">
                    {contenidos.map(item => (
                        <div key={item.id} className={`rounded-[2.5rem] border-2 transition-all p-6 md:p-10 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5" :
                                item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-[0_0_30px_rgba(59,130,246,0.1)]" :
                                    item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5 shadow-[0_0_30px_rgba(245,158,11,0.1)]" : "border-zinc-800 bg-zinc-900/50"
                            }`}>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10">
                                <div>
                                    <h2 className="text-3xl font-black tracking-tighter">{item.proyecto}</h2>
                                    <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black px-3 py-1 rounded-md uppercase tracking-widest mt-2 inline-block">{item.mes}</span>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <select
                                        value={item.etapa}
                                        onChange={(e) => actualizarCampo(item.id, 'etapa', e.target.value as any)}
                                        className={`flex-1 md:flex-none text-xs font-black px-6 py-3 rounded-2xl border-none outline-none cursor-pointer shadow-lg ${item.etapa === 'aprobado' ? "bg-green-500 text-black" :
                                                item.etapa === 'cliente' ? "bg-blue-600 text-white" :
                                                    item.etapa === 'diseno' ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-200"
                                            }`}
                                    >
                                        <option value="textos">✍️ FASE 1: TEXTOS</option>
                                        <option value="diseno">🎨 FASE 2: DISEÑO</option>
                                        <option value="cliente">🤝 FASE 3: CLIENTE</option>
                                        <option value="aprobado">✅ APROBADO FINAL</option>
                                        <option value="publicado">🚀 PUBLICADO</option>
                                    </select>
                                    <button onClick={() => eliminarFicha(item.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className="bg-zinc-950/50 p-1 rounded-2xl border border-zinc-800">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-1 block tracking-widest">Link Documento de Textos</label>
                                        <input type="text" placeholder="Pega el link aquí..." className="w-full p-4 rounded-xl bg-transparent text-xs text-blue-400 font-medium underline outline-none" value={item.link_textos || ""} onChange={e => actualizarCampo(item.id, 'link_textos', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-1 block tracking-widest">Feedback Xime (Instrucciones)</label>
                                        <textarea placeholder="Explica aquí qué necesitas..." className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-sm h-32 outline-none focus:border-purple-500 transition-all" value={item.comentarios_xime || ""} onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase ml-2 mb-1 block tracking-widest">Link de Diseño Final</label>
                                        <div className="flex gap-3">
                                            <input type="text" placeholder="Link de la diseñadora..." className="flex-1 p-4 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-green-400 font-bold outline-none" value={item.link_diseno || ""} onChange={e => actualizarCampo(item.id, 'link_diseno', e.target.value)} />
                                            {item.link_diseno && <a href={item.link_diseno} target="_blank" className="bg-zinc-800 p-4 rounded-xl border border-zinc-700 hover:bg-zinc-700 transition-colors flex items-center">↗</a>}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600/5 p-6 rounded-[2rem] border border-blue-500/20 shadow-inner">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3 block">Iteraciones Cliente (Ping-Pong)</label>
                                        <textarea placeholder="Pega los comentarios del cliente..." className="w-full p-4 rounded-2xl bg-transparent border border-blue-500/20 text-sm h-32 text-blue-100 outline-none focus:border-blue-500 transition-all" value={item.comentarios_cliente || ""} onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)} />
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