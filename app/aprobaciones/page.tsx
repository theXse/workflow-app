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
};

const PROYECTOS = ["Portal Baquedano", "Jardines de Bellavista 3", "Jardín del Norte", "Circunvalación Sur", "Vive Janequeo", "Los Jesuitas", "Green Concepción", "Vive Ainavillo"];
const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function AprobacionesPage() {
    const [contenidos, setContenidos] = useState<Contenido[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState<string>('todos');

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
        const { data } = await supabase.from("flujo_contenidos").insert({
            proyecto: nuevoProyecto, mes: nuevoMes, etapa: 'textos', versiones: 1
        }).select().single();
        if (data) setContenidos([data as Contenido, ...contenidos]);
    };

    // ESTA ES LA FUNCIÓN QUE ASEGURA LA INDEPENDENCIA
    const actualizarCampo = async (id: string, campo: string, valor: any) => {
        // Actualiza solo el proyecto que coincide con el ID en tu pantalla
        setContenidos(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
        // Actualiza solo esa fila específica en la base de datos
        await supabase.from("flujo_contenidos").update({ [campo]: valor }).eq("id", id);
    };

    const eliminarFicha = async (id: string) => {
        if (!confirm("¿Borrar este proyecto?")) return;
        await supabase.from("flujo_contenidos").delete().eq("id", id);
        setContenidos(contenidos.filter(c => c.id !== id));
    };

    const filtrados = contenidos.filter(c => filtro === 'todos' ? true : c.etapa === filtro);

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24 text-center font-black uppercase">Cargando Mapa General...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans pb-40">
            <div className="max-w-6xl mx-auto">

                {/* CABECERA Y FILTROS */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter mb-2">Aprobaciones IG</h1>
                        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Mapa de producción independiente</p>
                    </div>
                    <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800 shadow-xl">
                        {['todos', 'diseno', 'cliente', 'aprobado'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFiltro(f)}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${filtro === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
                            >
                                {f === 'todos' ? 'Ver Todo' : f === 'diseno' ? 'En Diseño' : f === 'cliente' ? 'Con Cliente' : 'Listos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* CREADOR */}
                <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 mb-12 flex flex-col md:flex-row gap-4 items-end shadow-2xl">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase tracking-widest ml-1">Nuevo Proyecto</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none" value={nuevoProyecto} onChange={e => setNuevoProyecto(e.target.value)}>
                            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase tracking-widest ml-1">Mes de campaña</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none" value={nuevoMes} onChange={e => setNuevoMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={crearFicha} className="w-full md:w-auto bg-purple-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-purple-500 transition-all uppercase text-xs tracking-widest shadow-lg shadow-purple-500/20">
                        Crear Ficha
                    </button>
                </div>

                {/* LISTADO DE FICHAS INDEPENDIENTES */}
                <div className="space-y-12">
                    {filtrados.map(item => (
                        <div key={item.id} className={`rounded-[3rem] border-2 transition-all p-6 md:p-12 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5 shadow-[0_0_40px_rgba(34,197,94,0.1)]" :
                                item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-[0_0_40px_rgba(59,130,246,0.1)]" :
                                    item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5 shadow-[0_0_40px_rgba(245,158,11,0.1)]" : "border-zinc-800 bg-zinc-900/40"
                            }`}>

                            {/* CONTADOR DE PING-PONG (V1, V2...) */}
                            <div className="absolute -top-4 right-12 bg-zinc-800 border border-zinc-700 px-4 py-2 rounded-full flex items-center gap-3 shadow-xl z-20">
                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Iteración</span>
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
                                        onChange={(e) => actualizarCampo(item.id, 'etapa', e.target.value)}
                                        className={`flex-1 md:flex-none text-xs font-black px-8 py-4 rounded-[1.5rem] border-none outline-none cursor-pointer shadow-2xl transition-all ${item.etapa === 'aprobado' ? "bg-green-500 text-black" :
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
                                    <button onClick={() => eliminarFicha(item.id)} className="text-zinc-800 hover:text-red-500 transition-colors p-2">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 mb-2 block">Link Drive (Textos)</label>
                                        <input type="text" placeholder="Pega el link aquí..." className="w-full p-5 rounded-2xl bg-zinc-950 border border-zinc-800 text-xs text-blue-400 font-bold outline-none focus:border-blue-500 transition-all shadow-inner" value={item.link_textos || ""} onChange={e => actualizarCampo(item.id, 'link_textos', e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 mb-2 block">Tus notas (Xime)</label>
                                        <textarea placeholder="Qué debe corregir diseño..." className="w-full p-6 rounded-[2rem] bg-zinc-950 border border-zinc-800 text-sm h-40 outline-none focus:border-amber-500 transition-all shadow-inner" value={item.comentarios_xime || ""} onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-2 mb-2 block">Link Diseño (Arte Final)</label>
                                        <div className="flex gap-4">
                                            <input type="text" placeholder="Link de descarga..." className="flex-1 p-5 rounded-2xl bg-zinc-800 border border-zinc-700 text-xs text-green-400 font-black outline-none" value={item.link_diseno || ""} onChange={e => actualizarCampo(item.id, 'link_diseno', e.target.value)} />
                                            {item.link_diseno && <a href={item.link_diseno} target="_blank" className="bg-zinc-800 p-5 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-all flex items-center">↗</a>}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/20 shadow-inner">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-4 block">Feedback Cliente (WhatsApp)</label>
                                        <textarea placeholder="Copia aquí los cambios del cliente..." className="w-full p-5 rounded-2xl bg-transparent border border-blue-500/20 text-sm h-40 text-blue-100 outline-none focus:border-blue-500 transition-all italic" value={item.comentarios_cliente || ""} onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)} />
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