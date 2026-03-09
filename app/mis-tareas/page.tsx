"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type PersonalTask = {
  id: string;
  city: string;
  project: string;
  description: string;
  priority: 'URGENTE' | 'NO_URGENTE';
  status: 'pending' | 'completed';
  created_at: string;
};

type Campana = { id: string; nombre: string; };

type MailingMensual = {
  id: string;
  id_campana: string;
  mes_objetivo: string;
  objetivo_correo: string;
  estado_envio: 'pendiente' | 'enviado';
};

type RutaTask = {
  id: string;
  description: string;
  priority: 'URGENTE' | 'NO_URGENTE';
  status: 'pending' | 'completed';
};

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

  // Formularios
  const [formDesc, setFormDesc] = useState<Record<string, string>>({});
  const [formPrio, setFormPrio] = useState<Record<string, string>>({});
  const [mailingProject, setMailingProject] = useState('');
  const [mailingMes, setMailingMes] = useState('');
  const [mailingObjetivo, setMailingObjetivo] = useState('');
  const [rutaDesc, setRutaDesc] = useState("");
  const [rutaPrio, setRutaPrio] = useState<'URGENTE' | 'NO_URGENTE'>('NO_URGENTE');

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

  // FUNCIONES DE TAREAS (CIUDADES)
  const handleCreateTask = async (city: string, project: string) => {
    const desc = formDesc[project];
    const prio = formPrio[project] || 'NO_URGENTE';
    if (!desc?.trim()) return;
    const { data } = await supabase.from("personal_tasks").insert({ city, project, description: desc, priority: prio, status: 'pending' }).select().single();
    if (data) {
      setTasks([...tasks, data]);
      setFormDesc(prev => ({ ...prev, [project]: "" }));
    }
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

  // FUNCIONES DE MAILINGS (FECHA DD/MM LIBRE)
  const handleCreateMailing = async () => {
    const selectedProject = mailingProject || campanas[0]?.nombre;
    const selectedCampana = campanas.find(c => c.nombre === selectedProject);
    if (!selectedCampana || !mailingMes || !mailingObjetivo.trim()) return;
    const { data } = await supabase.from("mailings_mensuales").insert({ id_campana: selectedCampana.id, mes_objetivo: mailingMes, objetivo_correo: mailingObjetivo, estado_envio: 'pendiente' }).select().single();
    if (data) {
      setMailings([data, ...mailings]);
      setMailingMes('');
      setMailingObjetivo('');
    }
  };

  const toggleMailingStatus = async (mailing: MailingMensual) => {
    const nextStatus = mailing.estado_envio === 'pendiente' ? 'enviado' : 'pendiente';
    const { data } = await supabase.from("mailings_mensuales").update({ estado_envio: nextStatus }).eq("id", mailing.id).select().single();
    if (data) setMailings(mailings.map(m => (m.id === mailing.id ? data : m)));
  };

  const handleDeleteMailing = async (id: string) => {
    const { error } = await supabase.from("mailings_mensuales").delete().eq("id", id);
    if (!error) setMailings(mailings.filter(m => m.id !== id));
  };

  // FUNCIONES LA RUTA
  const handleCreateRuta = async () => {
    if (!rutaDesc.trim()) return;
    const { data } = await supabase.from("la_ruta_tasks").insert({ description: rutaDesc, priority: rutaPrio, status: 'pending' }).select().single();
    if (data) {
      setRutaTasks([...rutaTasks, data]);
      setRutaDesc("");
    }
  };

  const handleCompleteRuta = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    setRutaTasks(rutaTasks.map(t => t.id === id ? { ...t, status: nextStatus } : t));
    await supabase.from("la_ruta_tasks").update({ status: nextStatus }).eq("id", id);
  };

  const handleDeleteRuta = async (id: string) => {
    setRutaTasks(rutaTasks.filter(t => t.id !== id));
    await supabase.from("la_ruta_tasks").delete().eq("id", id);
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Cargando...</div>;

  return (
    <div className="min-h-screen bg-black p-6 md:p-10 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-8">Mis Tareas Personales</h1>

        {/* SECCIÓN MAILINGS */}
        <div className="mb-14 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">📧 Mailings Mensuales</h2>
          <div className="grid md:grid-cols-[220px_120px_1fr_auto] gap-3 mb-5">
            <select className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingProject || campanas[0]?.nombre || ''} onChange={e => setMailingProject(e.target.value)}>
              <option value="">Proyecto</option>
              {campanas.map(c => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
            </select>
            <input type="text" placeholder="DD/MM" className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingMes} onChange={e => setMailingMes(e.target.value)} />
            <input type="text" placeholder="Objetivo..." className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingObjetivo} onChange={e => setMailingObjetivo(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateMailing()} />
            <button onClick={handleCreateMailing} className="bg-white text-black font-bold px-4 py-2 rounded-lg">Guardar</button>
          </div>
          <div className="space-y-3">
            {mailings.map(m => (
              <div key={m.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-semibold text-blue-400">{campanas.find(c => c.id === m.id_campana)?.nombre} · {m.mes_objetivo}</p>
                  <p className="text-sm text-zinc-400">{m.objetivo_correo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMailingStatus(m)} className={`text-xs font-bold px-3 py-2 rounded-lg ${m.estado_envio === 'enviado' ? 'bg-green-900 text-green-400' : 'bg-amber-900 text-amber-400'}`}>
                    {m.estado_envio === 'enviado' ? 'ENVIADO ✅' : 'PENDIENTE ⏳'}
                  </button>
                  <button onClick={() => handleDeleteMailing(m.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN CIUDADES */}
        <div className="space-y-16">
          {AGENCY_STRUCTURE.map(cityGroup => (
            <div key={cityGroup.city} className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-zinc-800 pb-2 text-blue-500">📍 {cityGroup.city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityGroup.projects.map(projectName => {
                  const projectTasks = tasks.filter(t => t.project === projectName);
                  return (
                    <div key={projectName} className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-[600px]">
                      <div className="p-4 bg-zinc-950/50 flex justify-between items-center"><h3 className="font-bold">{projectName}</h3></div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-zinc-950/20">
                        {projectTasks.map(task => (
                          <div key={task.id} className={`p-3 rounded-xl border flex justify-between items-start gap-2 transition-all ${task.status === 'completed' ? "bg-zinc-900 opacity-40" : task.priority === 'URGENTE' ? "bg-red-950/40 border-red-500 border-2" : "bg-zinc-800 border-zinc-700"}`}>
                            <div className="flex gap-2 min-w-0 flex-1">
                              <button onClick={() => handleCompleteTask(task.id, task.status)} className={`mt-1 w-5 h-5 rounded-full border shrink-0 flex items-center justify-center ${task.status === 'completed' ? "bg-green-600 border-green-600" : "border-zinc-500"}`}>
                                {task.status === 'completed' && <span className="text-[10px]">✓</span>}
                              </button>
                              <p className={`text-sm break-words ${task.status === 'completed' ? "line-through text-zinc-500" : "text-white"}`}>{task.description}</p>
                            </div>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-600 hover:text-red-500 pt-0.5"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-zinc-800 bg-zinc-900 space-y-3">
                        <input type="text" placeholder="Tarea..." className="w-full text-sm p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={formDesc[projectName] || ""} onChange={e => setFormDesc({ ...formDesc, [projectName]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleCreateTask(cityGroup.city, projectName)} />
                        <div className="flex gap-2">
                          <select className="flex-1 text-xs p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={formPrio[projectName] || "NO_URGENTE"} onChange={e => setFormPrio({ ...formPrio, [projectName]: e.target.value })}>
                            <option value="NO_URGENTE">Estándar</option><option value="URGENTE">URGENTE 🔥</option>
                          </select>
                          <button onClick={() => handleCreateTask(cityGroup.city, projectName)} className="bg-white text-black font-bold text-xs px-4 py-2 rounded-lg">Agregar</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN LA RUTA */}
        <div className="mt-20 mb-20 p-8 rounded-3xl border-2 border-purple-500 bg-zinc-900/50">
          <h2 className="text-3xl font-extrabold text-purple-400 mb-6">🚀 LA RUTA</h2>
          <div className="flex gap-3 mb-8">
            <input type="text" placeholder="Añadir a La Ruta..." className="flex-1 p-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white" value={rutaDesc} onChange={e => setRutaDesc(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateRuta()} />
            <select className="p-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white" value={rutaPrio} onChange={e => setRutaPrio(e.target.value as any)}>
              <option value="NO_URGENTE">Estándar</option><option value="URGENTE">URGENTE 🔥</option>
            </select>
            <button onClick={handleCreateRuta} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl">Agregar</button>
          </div>
          <div className="space-y-3">
            {rutaTasks.map(t => (
              <div key={t.id} className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${t.status === 'completed' ? "bg-zinc-950 opacity-40" : t.priority === 'URGENTE' ? "bg-red-950/30 border-red-500" : "bg-zinc-900 border-zinc-800"}`}>
                <div className="flex gap-4 items-center flex-1">
                  <button onClick={() => handleCompleteRuta(t.id, t.status)} className={`w-6 h-6 rounded-full border flex items-center justify-center ${t.status === 'completed' ? "bg-green-600 border-green-600" : "border-zinc-500"}`}>
                    {t.status === 'completed' && <span>✓</span>}
                  </button>
                  <p className={`text-lg ${t.status === 'completed' ? "line-through text-zinc-500" : "text-white"}`}>{t.description}</p>
                </div>
                <button onClick={() => handleDeleteRuta(t.id)} className="text-zinc-600 hover:text-red-500"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}