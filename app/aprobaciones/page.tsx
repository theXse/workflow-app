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
    tarea_lista: boolean;
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

    const eliminarFicha = async (id: string) => {
        if (!confirm("¿Borrar este proyecto?")) return;
        await supabase.from("flujo_contenidos").delete().eq("id", id);
        setContenidos(contenidos.filter(c => c.id !== id));
    };

    const filtrados = contenidos.filter(c => filtro === 'todos' ? true : c.etapa === filtro);

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24 text-center font-black uppercase">Cargando Mapa Maestro...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans pb-40">
            <div className="max-w-6xl mx-auto">

                <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Control de Contenidos Instagram
                </h1>

                {/* --- 1. TABLA RESUMEN (TU MAPA GENERAL) --- */}
                <div className="mb-12 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 shadow-2xl">
                    <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Cuadro de Mando Mensual</h2>
                        <div className="flex gap-2">
                            {['todos', 'diseno', 'cliente', 'aprobado'].map((f) => (
                                <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                                    {f === 'todos' ? 'Ver Todo' : f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-zinc-950/50 text-zinc-500 uppercase font-black">
                                    <th className="p-4">Proyecto</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-center">Ping-Pong</th>
                                    <th className="p-4">Tarea</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contenidos.map(c => (
                                    <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-white/5 transition-colors">
                                        <td className="p-4 font-bold">{c.proyecto} <span className="text-[9px] text-zinc-600">{c.mes}</span></td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${c.etapa === 'aprobado' ? "bg-green-500 text-black" :
                                                    c.etapa === 'cliente' ? "bg-blue-500 text-white" :
                                                        c.etapa === 'diseno' ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-400"
                                                }`}>{c.etapa}</span>
                                        </td>
                                        <td className="p-4 text-center font-black text-amber-500">V{c.versiones || 1}</td>
                                        <td className="p-4">
                                            {c.tarea_lista ? <span className="text-green-500 font-bold">✓ LISTA</span> : <span className="text-zinc-600 italic">Pendiente</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- 2. CREADOR DE PROYECTOS --- */}
                <div className="bg-zinc-900 p-5 rounded-[2rem] border border-zinc-800 mb-12 flex flex-col md:flex-row gap-4 items-end shadow-xl">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase ml-1">Proyecto</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none" value={nuevoProyecto} onChange={e => setNuevoProyecto(e.target.value)}>
                            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase ml-1">Mes</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none" value={nuevoMes} onChange={e => setNuevoMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={crearFicha} className="bg-white text-black font-black px-10 py-4 rounded-2xl hover:scale-105 transition-all text-xs uppercase tracking-widest">
                        Añadir Proyecto
                    </button>
                </div>

                {/* --- 3. DETALLE DE FICHAS --- */}
                <div className="space-y-12">
                    {filtrados.map(item => (
                        <div key={item.id} className={`rounded-[3rem] border-2 transition-all p-6 md:p-12 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5 shadow-lg" :
                                item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-xl" :
                                    item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-900/40"
                            }`}>

                            <div className="absolute -top-4 right-12 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl z-20">
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Versión</span>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', Math.max(1, (item.versiones || 1) - 1))} className="text-zinc-500 hover:text-white px-1">-</button>
                                    <span className="text-sm font-black text-amber-500 min-w-[25px] text-center">V{item.versiones || 1}</span>
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', (item.versiones || 1) + 1)} className="text-zinc-500 hover:text-white px-1">+</button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                                <div>
                                    <h2 className="text-4xl font-black tracking-tighter">{item.proyecto}</h2>
                                    <span className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest mt-2 inline-block">{item.mes}</span>
                                </div>

                                <div className="flex items-center gap-4 w-full md:w-auto">
                                    <select
                                        value={item.etapa}
                                        onChange={(e) => {
                                            actualizarCampo(item.id, 'etapa', e.target.value);
                                            if (e.target.value === 'diseno') actualizarCampo(item.id, 'tarea_lista', false);
                                        }}
                                        className={`flex-1 md:flex-none text-xs font-black px-8 py-4 rounded-[1.5rem] border-none outline-none cursor-pointer shadow-2xl ${item.etapa === 'aprobado' ? "bg-green-500 text-black" :
                                                item.etapa === 'cliente' ? "bg-blue-600 text-white" :
                                                    item.etapa === 'diseno' ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-200"
                                            }`}
                                    >
                                        <option value="textos">✍️ FASE 1: TEXTOS</option>
                                        <option value="diseno">🎨 FASE 2: DISEÑO</option>
                                        <option value="cliente">🤝 FASE 3: CLIENTE</option>
                                        <option value="aprobado">✅ APROBADO FINAL</option>
                                    </select>
                                    <button onClick={() => eliminarFicha(item.id)} className="text-zinc-700 hover:text-red-500 transition-colors">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-8">
                                    <div className={`transition-all p-6 rounded-[2rem] border-2 ${item.tarea_lista ? 'bg-green-900/10 border-green-900/40' : 'bg-zinc-950 border-zinc-800'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Notas para la Diseñadora</label>
                                            <button onClick={() => actualizarCampo(item.id, 'tarea_lista', !item.tarea_lista)} className={`text-[9px] font-black px-3 py-1 rounded-full ${item.tarea_lista ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                                {item.tarea_lista ? '✓ REALIZADO' : 'MARCAR HECHO'}
                                            </button>
                                        </div>
                                        <textarea className={`w-full bg-transparent text-sm h-32 outline-none transition-all ${item.tarea_lista ? 'text-zinc-600 italic line-through' : 'text-white'}`} value={item.comentarios_xime || ""} onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)} />
                                        <input type="text" placeholder="Link de Textos..." className="w-full mt-4 p-4 rounded-xl bg-zinc-900 text-xs text-blue-400 underline outline-none" value={item.link_textos || ""} onChange={e => actualizarCampo(item.id, 'link_textos', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-2 ml-2">Link Arte Final (V{item.versiones})</label>
                                        <div className="flex gap-3">
                                            <input type="text" placeholder="Link de descarga..." className="flex-1 p-5 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-green-400 font-black outline-none" value={item.link_diseno || ""} onChange={e => actualizarCampo(item.id, 'link_diseno', e.target.value)} />
                                            {item.link_diseno && <a href={item.link_diseno} target="_blank" className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700">↗</a>}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600/5 p-6 rounded-[2rem] border border-blue-500/20">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 block">Feedback Cliente</label>
                                        <textarea placeholder="Cambios solicitados..." className="w-full p-4 rounded-2xl bg-transparent border border-blue-500/20 text-sm h-32 text-blue-100 outline-none italic" value={item.comentarios_cliente || ""} onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)} />
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