"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PersonalTask = { id: string; city: string; project: string; description: string; priority: 'URGENTE' | 'NO_URGENTE'; status: 'pending' | 'completed'; created_at: string; };
type Campana = { id: string; nombre: string; };
type MailingMensual = { id: string; id_campana: string; mes_objetivo: string; objetivo_correo: string; estado_envio: 'pendiente' | 'enviado' | 'en_revision'; };
type RutaTask = { id: string; description: string; priority: 'URGENTE' | 'NO_URGENTE'; status: 'pending' | 'completed'; };

const AGENCY_STRUCTURE = [
  { city: "Osorno", projects: ["Portal Baquedano", "Jardines de Bellavista 3"] },
  { city: "Santiago", projects: ["Jardín del Norte"] },
  { city: "Valdivia", projects: ["Circunvalación Sur Etapa 1", "Circunvalación Sur Etapa 2", "Circunvalación Sur Etapa 3", "Vive Janequeo", "Los Jesuitas"] },
  { city: "Concepción", projects: ["Green Concepción", "Vive Ainavillo"] }
];

export default function MisTareas() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [mailings, setMailings] = useState<MailingMensual[]>([]);
  const [rutaTasks, setRutaTasks] = useState<RutaTask[]>([]);
  const [loading, setLoading] = useState(true);

  const [formDesc, setFormDesc] = useState<Record<string, string>>({});
  const [formPrio, setFormPrio] = useState<Record<string, string>>({});
  const [mailingProject, setMailingProject] = useState('');
  const [mailingMes, setMailingMes] = useState('');
  const [mailingObjetivo, setMailingObjetivo] = useState('');
  const [rutaDesc, setRutaDesc] = useState("");
  const [rutaPrio, setRutaPrio] = useState<'URGENTE' | 'NO_URGENTE'>('NO_URGENTE');
  const [isListening, setIsListening] = useState(false);

  const getEstadoFecha = (fechaStr: string) => {
    try {
      const [dia, mes] = fechaStr.split('/').map(Number);
      if (!dia || !mes) return 'normal';
      const hoy = new Date();
      const hoyDia = hoy.getDate();
      const hoyMes = hoy.getMonth() + 1;
      if (dia === hoyDia && mes === hoyMes) return 'hoy';
      const fechaMeta = new Date(hoy.getFullYear(), mes - 1, dia);
      const diferencia = (fechaMeta.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24);
      if (diferencia > 0 && diferencia <= 7) return 'semana';
      return 'normal';
    } catch { return 'normal'; }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [t, c, m, r] = await Promise.all([
        supabase.from("personal_tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("campanas").select("id,nombre"),
        supabase.from("mailings_mensuales").select("*").order("created_at", { ascending: false }),
        supabase.from("la_ruta_tasks").select("*").order("created_at", { ascending: true })
      ]);
      if (t.data) setTasks(t.data);
      if (c.data) setCampanas(c.data);
      if (m.data) setMailings(m.data);
      if (r.data) setRutaTasks(r.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // FUNCIÓN DETECTIVE: Nos dirá exactamente qué falla
  const updateMailingStatus = async (id: string, nuevoEstado: MailingMensual['estado_envio']) => {
    // 1. Cambio visual rápido
    setMailings(prev => prev.map(m => m.id === id ? { ...m, estado_envio: nuevoEstado } : m));

    // 2. Intento de guardado con reporte detallado
    const { data, error } = await supabase
      .from("mailings_mensuales")
      .update({ estado_envio: nuevoEstado })
      .eq("id", id)
      .select();

    if (error) {
      console.error("ERROR SUPABASE:", error);
      alert(`DETALLE DEL ERROR:\n\nMensaje: ${error.message}\nCódigo: ${error.code}\nHint: ${error.hint || 'Sin pistas'}`);
    } else if (data && data.length === 0) {
      alert("Error: Supabase no encontró la fila con ese ID. Intenta crear un mailing nuevo y cambiarle el estado a ese.");
    }
  };

  const handleCreateMailing = async () => {
    const projName = mailingProject || campanas[0]?.nombre;
    const selectedCampana = campanas.find(c => c.nombre === projName);
    if (!selectedCampana || !mailingMes || !mailingObjetivo.trim()) return;
    const { data } = await supabase.from("mailings_mensuales").insert({
      id_campana: selectedCampana.id,
      mes_objetivo: mailingMes,
      objetivo_correo: mailingObjetivo,
      estado_envio: 'pendiente'
    }).select().single();
    if (data) { setMailings([data, ...mailings]); setMailingMes(''); setMailingObjetivo(''); }
  };

  const handleCreateTask = async (city: string, project: string) => {
    const desc = formDesc[project];
    if (!desc?.trim()) return;
    const { data } = await supabase.from("personal_tasks").insert({ city, project, description: desc, priority: formPrio[project] || 'NO_URGENTE', status: 'pending' }).select().single();
    if (data) { setTasks([...tasks, data]); setFormDesc(prev => ({ ...prev, [project]: "" })); }
  };

  const handleCompleteTask = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setTasks(tasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    await supabase.from("personal_tasks").update({ status: nextStatus }).eq("id", id);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from("personal_tasks").delete().eq("id", id);
  };

  const handleDeleteMailing = async (id: string) => {
    await supabase.from("mailings_mensuales").delete().eq("id", id);
    setMailings(mailings.filter(m => m.id !== id));
  };

  const handleCreateRuta = async () => {
    if (!rutaDesc.trim()) return;
    const { data } = await supabase.from("la_ruta_tasks").insert({ description: rutaDesc, priority: rutaPrio, status: 'pending' }).select().single();
    if (data) { setRutaTasks([...rutaTasks, data]); setRutaDesc(""); }
  };

  const handleCompleteRuta = async (id: string, currentStatus: string) => {
    const next = currentStatus === 'completed' ? 'pending' : 'completed';
    setRutaTasks(rutaTasks.map(t => t.id === id ? { ...t, status: next } : t));
    await supabase.from("la_ruta_tasks").update({ status: next }).eq("id", id);
  };

  const handleDeleteRuta = async (id: string) => {
    setRutaTasks(rutaTasks.filter(t => t.id !== id));
    await supabase.from("la_ruta_tasks").delete().eq("id", id);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Navegador no soportado");
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setRutaDesc(e.results[0][0].transcript);
    recognition.start();
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black p-4 md:p-10 font-sans text-white">
      <div className="max-w-7xl mx-auto pb-20">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">Mis Tareas Personales</h1>

        {/* SECCIÓN MAILINGS */}
        <div className="mb-10 bg-zinc-900 rounded-2xl p-4 md:p-6 border border-zinc-800">
          <h2 className="text-xl font-bold mb-4">📧 Mailings Mensuales</h2>
          <div className="flex flex-col gap-3 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <select className="p-3 rounded-lg bg-zinc-800 text-white text-sm border border-zinc-700" value={mailingProject} onChange={e => setMailingProject(e.target.value)}>
                <option value="">Proyecto</option>
                {campanas.map(c => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
              </select>
              <input type="text" placeholder="DD/MM" className="p-3 rounded-lg bg-zinc-800 text-white text-sm border border-zinc-700" value={mailingMes} onChange={e => setMailingMes(e.target.value)} />
            </div>
            <input type="text" placeholder="Objetivo..." className="p-3 rounded-lg bg-zinc-800 text-white text-sm border border-zinc-700" value={mailingObjetivo} onChange={e => setMailingObjetivo(e.target.value)} />
            <button onClick={handleCreateMailing} className="bg-white text-black font-bold p-3 rounded-lg hover:bg-zinc-200 transition-all">Guardar</button>
          </div>
          <div className="space-y-3">
            {mailings.map(m => {
              const estFecha = getEstadoFecha(m.mes_objetivo);
              let estiloCard = "border-zinc-800 bg-zinc-950";
              let badge = null;

              if (m.estado_envio === 'en_revision') estiloCard = "border-amber-500 bg-amber-950/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]";
              else if (m.estado_envio === 'enviado') estiloCard = "border-zinc-800 bg-zinc-900 opacity-50";
              else if (estFecha === 'hoy') {
                estiloCard = "border-red-600 bg-red-900/20 animate-pulse";
                badge = <span className="ml-2 text-[10px] bg-red-600 px-2 py-0.5 rounded-full font-bold">¡HOY!</span>;
              }

              return (
                <div key={m.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between gap-4 transition-all ${estiloCard}`}>
                  <div className="flex-1">
                    <p className={`font-bold ${m.estado_envio === 'enviado' ? "text-zinc-500" : "text-blue-400"}`}>
                      {campanas.find(c => c.id === m.id_campana)?.nombre} · {m.mes_objetivo} {badge}
                    </p>
                    <p className="text-xs text-zinc-400 mt-1">{m.objetivo_correo}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <select
                      value={m.estado_envio}
                      onChange={(e) => updateMailingStatus(m.id, e.target.value as any)}
                      className={`flex-1 sm:flex-none text-[10px] font-black px-4 py-2 rounded-full border-none cursor-pointer transition-all ${m.estado_envio === 'en_revision' ? 'bg-amber-500 text-black' :
                        m.estado_envio === 'enviado' ? 'bg-zinc-800 text-zinc-500' :
                          'bg-zinc-700 text-white'
                        }`}
                    >
                      <option value="pendiente">PENDIENTE</option>
                      <option value="en_revision">EN REVISIÓN</option>
                      <option value="enviado">ENVIADO</option>
                    </select>
                    <button onClick={() => handleDeleteMailing(m.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CIUDADES */}
        <div className="space-y-12">
          {AGENCY_STRUCTURE.map(cityGroup => (
            <div key={cityGroup.city} className="space-y-6">
              <h2 className="text-2xl font-bold border-b border-zinc-800 pb-2 text-blue-500">📍 {cityGroup.city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityGroup.projects.map(projectName => {
                  const projectTasks = tasks.filter(t => t.project === projectName);
                  return (
                    <div key={projectName} className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-[350px]">
                      <div className="p-4 bg-zinc-950/50"><h3 className="font-bold text-sm">{projectName}</h3></div>
                      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-zinc-950/20">
                        {projectTasks.map(task => (
                          <div key={task.id} className={`p-3 rounded-xl border flex justify-between items-start gap-2 ${task.status === 'completed' ? "bg-zinc-900 opacity-40 shadow-none border-zinc-800" : task.priority === 'URGENTE' ? "bg-red-950/40 border-red-500 border-2" : "bg-zinc-800 border-zinc-700"}`}>
                            <div className="flex gap-3 min-w-0 flex-1">
                              <button onClick={() => handleCompleteTask(task.id, task.status)} className={`mt-0.5 w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition-all ${task.status === 'completed' ? "bg-green-600 border-green-600" : "border-zinc-500 hover:border-white"}`}>
                                {task.status === 'completed' && <span className="text-white text-[10px]">✓</span>}
                              </button>
                              <p className={`text-sm break-words ${task.status === 'completed' ? "line-through text-zinc-500" : "text-white"}`}>{task.description}</p>
                            </div>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-zinc-800 bg-zinc-900 space-y-2">
                        <input type="text" placeholder="Tarea..." className="w-full text-xs p-2 rounded-lg bg-zinc-800 text-white outline-none focus:border-blue-500 transition-all border border-zinc-700" value={formDesc[projectName] || ""} onChange={e => setFormDesc({ ...formDesc, [projectName]: e.target.value })} />
                        <div className="flex gap-2">
                          <select className="flex-1 text-[10px] p-2 rounded-lg bg-zinc-800 border-none outline-none text-zinc-400" value={formPrio[projectName] || "NO_URGENTE"} onChange={e => setFormPrio({ ...formPrio, [projectName]: e.target.value })}>
                            <option value="NO_URGENTE">Común</option><option value="URGENTE">URGENTE</option>
                          </select>
                          <button onClick={() => handleCreateTask(cityGroup.city, projectName)} className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all">Ok</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* LA RUTA */}
        <div className="mt-16 p-5 md:p-8 rounded-3xl border-2 border-purple-500 bg-zinc-900/50 shadow-lg">
          <h2 className="text-2xl font-extrabold text-purple-400 mb-6 uppercase tracking-tighter text-center sm:text-left">🚀 LA RUTA</h2>
          <div className="flex flex-col gap-3 mb-8">
            <div className="relative">
              <input type="text" placeholder={isListening ? "Escuchando..." : "Dicta o escribe..."} className={`p-4 pr-14 rounded-xl border w-full bg-zinc-800 text-white outline-none transition-all ${isListening ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]" : "border-zinc-700 focus:border-purple-500"}`} value={rutaDesc} onChange={e => setRutaDesc(e.target.value)} />
              <button onClick={startListening} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? "bg-red-600 text-white animate-pulse" : "bg-zinc-700 text-zinc-400 hover:text-white"}`}>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" /><path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" /></svg>
              </button>
            </div>
            <div className="flex gap-3">
              <select className="flex-1 p-3 rounded-xl bg-zinc-800 border-none outline-none text-zinc-400" value={rutaPrio} onChange={e => setRutaPrio(e.target.value as any)}>
                <option value="NO_URGENTE">Estándar</option><option value="URGENTE">URGENTE</option>
              </select>
              <button onClick={handleCreateRuta} className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-md uppercase text-xs tracking-widest">Agregar</button>
            </div>
          </div>
          <div className="space-y-3">
            {rutaTasks.map(t => (
              <div key={t.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${t.status === 'completed' ? "bg-zinc-950 opacity-40 border-zinc-800" : t.priority === 'URGENTE' ? "bg-red-950/30 border-red-500 shadow-sm" : "bg-zinc-900 border-zinc-800"}`}>
                <div className="flex gap-4 items-center flex-1">
                  <button onClick={() => handleCompleteRuta(t.id, t.status)} className={`w-7 h-7 rounded-full border flex items-center justify-center transition-all ${t.status === 'completed' ? "bg-green-600 border-green-600" : "border-zinc-500 hover:border-white"}`}>
                    {t.status === 'completed' && <span className="text-white text-xs">✓</span>}
                  </button>
                  <p className={`text-base break-words ${t.status === 'completed' ? "line-through text-zinc-500" : "text-white"}`}>{t.description}</p>
                </div>
                <button onClick={() => handleDeleteRuta(t.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}