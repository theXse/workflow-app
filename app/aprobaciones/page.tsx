"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Contenido = {
    id: string; proyecto: string; mes: string;
    etapa: 'textos' | 'diseno' | 'cliente' | 'aprobado' | 'publicado';
    comentarios_xime: string; comentarios_cliente: string;
    link_textos: string; link_diseno: string;
    versiones: number; tarea_lista: boolean;
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
        const { data, error } = await supabase.from("flujo_contenidos").select("*").order("created_at", { ascending: false });
        if (error) alert("Error al leer datos: " + error.message);
        if (data) setContenidos(data as Contenido[]);
        setLoading(false);
    };

    const crearFicha = async () => {
        const { data, error } = await supabase.from("flujo_contenidos").insert({
            proyecto: nuevoProyecto, mes: nuevoMes, etapa: 'textos', versiones: 1, tarea_lista: false
        }).select().single();

        if (error) {
            alert("Error al añadir: " + error.message);
            console.error(error);
        } else {
            setContenidos([data as Contenido, ...contenidos]);
        }
    };

    const actualizarCampo = async (id: string, campo: string, valor: any) => {
        setContenidos(prev => prev.map(c => c.id === id ? { ...c, [campo]: valor } : c));
        const { error } = await supabase.from("flujo_contenidos").update({ [campo]: valor }).eq("id", id);
        if (error) console.error("Error guardando:", error.message);
    };

    const eliminarFicha = async (id: string) => {
        if (!confirm("¿Borrar proyecto?")) return;
        await supabase.from("flujo_contenidos").delete().eq("id", id);
        setContenidos(contenidos.filter(c => c.id !== id));
    };

    const filtrados = contenidos.filter(c => filtro === 'todos' ? true : c.etapa === filtro);

    if (loading) return <div className="p-10 text-white bg-black min-h-screen pt-24 text-center font-black uppercase tracking-widest">Reconectando con la base de datos...</div>;

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-10 font-sans pb-40">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-black mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">Aprobaciones Instagram</h1>

                {/* TABLA RESUMEN */}
                <div className="mb-12 overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/30 shadow-2xl">
                    <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center">
                        <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Resumen General</h2>
                        <div className="flex gap-2">
                            {['todos', 'diseno', 'cliente', 'aprobado'].map((f) => (
                                <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${filtro === f ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px]">
                            <thead>
                                <tr className="bg-zinc-950/50 text-zinc-600 uppercase font-black">
                                    <th className="p-4">Inmobiliaria</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-center">Versión</th>
                                    <th className="p-4">Diseño</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contenidos.map(c => (
                                    <tr key={c.id} className="border-b border-zinc-800/50">
                                        <td className="p-4 font-bold">{c.proyecto} <span className="opacity-40">{c.mes}</span></td>
                                        <td className="p-4 uppercase font-black text-blue-400">{c.etapa}</td>
                                        <td className="p-4 text-center font-black">V{c.versiones}</td>
                                        <td className="p-4">{c.tarea_lista ? "✓" : "..."}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CREADOR */}
                <div className="bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 mb-12 flex flex-col md:flex-row gap-4 items-end shadow-2xl">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase ml-1">Proyecto</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none text-white" value={nuevoProyecto} onChange={e => setNuevoProyecto(e.target.value)}>
                            {PROYECTOS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="text-[10px] text-zinc-500 mb-2 block font-black uppercase ml-1">Mes</label>
                        <select className="w-full p-4 rounded-2xl bg-zinc-800 border-none text-sm font-bold outline-none text-white" value={nuevoMes} onChange={e => setNuevoMes(e.target.value)}>
                            {MESES.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                    <button onClick={crearFicha} className="bg-white text-black font-black px-12 py-4 rounded-2xl hover:bg-zinc-200 transition-all text-xs uppercase tracking-widest">
                        Añadir
                    </button>
                </div>

                {/* LISTADO DE FICHAS */}
                <div className="space-y-12">
                    {filtrados.map(item => (
                        <div key={item.id} className={`rounded-[3.5rem] border-2 transition-all p-8 md:p-12 relative ${item.etapa === 'aprobado' ? "border-green-500 bg-green-500/5 shadow-lg" :
                                item.etapa === 'cliente' ? "border-blue-500 bg-blue-500/5 shadow-2xl" :
                                    item.etapa === 'diseno' ? "border-amber-500 bg-amber-500/5 shadow-xl" : "border-zinc-800 bg-zinc-900/30"
                            }`}>

                            {/* VERSIONES */}
                            <div className="absolute -top-4 right-12 bg-zinc-800 border border-zinc-700 px-5 py-2 rounded-full flex items-center gap-4 shadow-2xl z-20">
                                <span className="text-[10px] font-black text-zinc-500 uppercase">Versión</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', Math.max(1, (item.versiones || 1) - 1))} className="text-zinc-500">-</button>
                                    <span className="text-sm font-black text-amber-500">V{item.versiones}</span>
                                    <button onClick={() => actualizarCampo(item.id, 'versiones', (item.versiones || 1) + 1)} className="text-zinc-500">+</button>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
                                <h2 className="text-4xl font-black tracking-tighter uppercase">{item.proyecto}</h2>
                                <div className="flex items-center gap-4">
                                    <select
                                        value={item.etapa}
                                        onChange={(e) => actualizarCampo(item.id, 'etapa', e.target.value)}
                                        className="text-[10px] font-black px-8 py-4 rounded-[1.5rem] bg-zinc-800 text-white outline-none"
                                    >
                                        <option value="textos">✍️ TEXTOS</option>
                                        <option value="diseno">🎨 DISEÑO</option>
                                        <option value="cliente">🤝 CLIENTE</option>
                                        <option value="aprobado">✅ APROBADO</option>
                                    </select>
                                    <button onClick={() => eliminarFicha(item.id)} className="text-zinc-800 hover:text-red-500">×</button>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-2">Notas de Xime</label>
                                    <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${item.tarea_lista ? 'bg-green-950/20 border-green-900/40' : 'bg-zinc-950 border-zinc-800'}`}>
                                        <button onClick={() => actualizarCampo(item.id, 'tarea_lista', !item.tarea_lista)} className={`text-[9px] font-black px-4 py-2 rounded-full mb-4 ${item.tarea_lista ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {item.tarea_lista ? '✓ LISTO' : 'MARCAR HECHO'}
                                        </button>
                                        <textarea className="w-full bg-transparent text-sm h-32 outline-none text-white" value={item.comentarios_xime || ""} onChange={e => actualizarCampo(item.id, 'comentarios_xime', e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase ml-2">Feedback Cliente</label>
                                    <div className="bg-blue-600/5 p-8 rounded-[2.5rem] border border-blue-500/20">
                                        <textarea className="w-full p-4 rounded-2xl bg-transparent border border-blue-500/10 text-sm h-32 text-blue-100 outline-none italic" value={item.comentarios_cliente || ""} onChange={e => actualizarCampo(item.id, 'comentarios_cliente', e.target.value)} />
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