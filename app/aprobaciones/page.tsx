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
        const { data } = await supabase.from("flujo_contenidos").insert({
            proyecto: nuevoProyecto,
            mes: nuevoMes,
            etapa: 'textos'
        }).select().single();
        if (data) setContenidos([data as Contenido, ...contenidos]);
    };

    const actualizarCampo = async (id: string, campo: string, valor: string) => {
        setContenidos(contenidos.map(c => c.id === id ? { ...c, [campo]: valor } : c));
        await supabase.from("flujo_contenidos").update({ [campo]: valor }).eq("id", id);
    };

    const eliminarFicha = async (id: string) => {
        if (!confirm("¿Segura que quieres borrar este mes?")) return;
        await supabase.from("flujo_contenidos").delete().eq("id", id);
        setContenidos(contenidos.filter(c => c.id !== id));
    };

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24">Cargando logística de Instagram...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                    Aprobaciones Instagram
                </h1>

                {/* CREADOR DE FICHA */}
                <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 mb-10 flex flex-col md:flex-row gap-4 items-end shadow-xl">
                    <div className="w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase tracking-tighter">Proyecto</label>
                        <select className="w-full p-3 rounded-xl bg-zinc-800 border-none text-sm outline-none" value={nuevoProyecto} onChange={e => setNuevoProyecto(e.target.value)}>
                            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase tracking-tighter">Mes</label>
                        <select className="w-full p-3 rounded-xl bg-zinc-800 border-none text-sm outline-none" value={nuevoMes} onChange={e => setNuevoMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={crearFicha} className="w-full md:w-auto bg-white text-black font-black px-8 py-3 rounded-xl hover:bg-zinc-200 transition-all uppercase text-xs">
                        Crear Mes
                    </button>
                </div>

                {/* LISTADO */}
                <div className="space-y-8">
                    {contenidos.map(item => (
                        <div key={item.id} className={`rounded-3xl border-2 transition-all p-5 md:p-8 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5" :
                            item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]" :
                                item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5" : "border-zinc-800 bg-zinc-900"
                            }`}>
                            <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
                                <div>
                                    <h2 className="text-2xl font-black leading-none">{item.proyecto}</h2>
                                    <p className="text-purple-400 font-bold text-xs uppercase tracking-widest mt-2">{item.mes}</p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <select
                                        value={item.etapa}
                                        onChange={(e) => actualizarCampo(item.id, 'etapa', e.target.value)}
                                        className={`flex-1 md:flex-none text-[10px] font-black px-4 py-2 rounded-full border-none outline-none cursor-pointer shadow-md ${item.etapa === 'aprobado' ? "bg-green-500 text-black" :
                                            item.etapa === 'cliente' ? "bg-blue-500 text-white" :
                                                item.etapa === 'diseno' ? "bg-amber-500 text-black" : "bg-zinc-700 text-zinc-300"
                                            }`}
                                    >
                                        <option value="textos">✍️ FASE 1: TEXTOS</option>
                                        <option value="diseno">🎨 FASE 2: DISEÑO</option>
                                        <option value="cliente">🤝 FASE 3: CLIENTE</option>
                                        <option value="aprobado">✅ APROBADO FINAL</option>
                                        <option value="publicado">🚀 PUBLICADO</option>
                                    </select>
                                    <button onClick={() => eliminarFicha(item.id)} className="text-zinc-700 hover:text-red-500 p-1"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* LADO IZQUIERDO: TEXTOS Y NOTAS */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Link Documento de Textos</label>
                                        <input
                                            type="text"
                                            placeholder="Pega link de Drive/Canva..."
                                            className="w-full mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-blue-400 underline outline-none focus:border-purple-500"
                                            value={item.link_textos || ""}
                                            onChange={e => actualizarCampo(item.id, 'link_textos', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Feedback para Diseño (Xime)</label>
                                        <textarea
                                            placeholder="Instrucciones para la diseñadora..."
                                            className="w-full mt-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm h-28 outline-none focus:border-purple-500"
                                            value={item.comentarios_xime || ""}
                                            onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* LADO DERECHO: MATERIAL Y CLIENTE */}
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Link de Diseño (ZIP / Carpeta)</label>
                                        <div className="flex gap-2 mt-2">
                                            <input
                                                type="text"
                                                placeholder="Link de la diseñadora..."
                                                className="flex-1 p-3 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-green-400 font-bold outline-none"
                                                value={item.link_diseno || ""}
                                                onChange={e => actualizarCampo(item.id, 'link_diseno', e.target.value)}
                                            />
                                            {item.link_diseno && (
                                                <a href={item.link_diseno} target="_blank" className="bg-zinc-800 p-3 rounded-xl hover:bg-zinc-700 border border-zinc-700">↗</a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-blue-600/5 p-5 rounded-2xl border border-blue-500/20 shadow-inner">
                                        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Feedback del Cliente (WhatsApp)</label>
                                        <textarea
                                            placeholder="Copia aquí lo que pidió el cliente para no olvidarlo..."
                                            className="w-full mt-2 p-3 rounded-xl bg-transparent border border-blue-500/20 text-sm h-28 text-blue-100 outline-none focus:border-blue-500"
                                            value={item.comentarios_cliente || ""}
                                            onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {contenidos.length === 0 && (
                    <div className="text-center py-32 text-zinc-700 font-bold italic">
                        No hay proyectos cargados. Comienza uno arriba 👆
                    </div>
                )}
            </div>
        </div>
    );
}