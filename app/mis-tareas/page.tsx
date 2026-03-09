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

type ProjectStatus = {
  id: string;
  project_name: string;
  status: 'OK' | 'ATENCION';
  foco_mes: string;
};

type ProjectFocus = {
  id: string;
  project_name: string;
  description: string;
};

type RutaTask = {
  id: string;
  description: string;
  priority: 'URGENTE' | 'NO_URGENTE';
  status: 'pending' | 'completed';
  created_at: string;
};

type Campana = {
  id: string;
  nombre: string;
};

type MailingMensual = {
  id: string;
  id_campana: string;
  mes_objetivo: string;
  objetivo_correo: string;
  estado_envio: 'pendiente' | 'enviado';
};

const AGENCY_STRUCTURE = [
  {
    city: "Osorno",
    projects: ["Portal Baquedano", "Jardines de Bellavista 3"]
  },
  {
    city: "Santiago",
    projects: ["Jardín del Norte"]
  },
  {
    city: "Valdivia",
    projects: ["Circunvalación Sur Etapa 1", "Circunvalación Sur Etapa 2", "Circunvalación Sur Etapa 3", "Vive Janequeo", "Los Jesuitas"]
  },
  {
    city: "Concepción",
    projects: ["Green Concepción", "Vive Ainavillo"]
  }
];

export default function MisTareas() {
  const [tasks, setTasks] = useState<PersonalTask[]>([]);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [formDesc, setFormDesc] = useState<Record<string, string>>({});
  const [formPrio, setFormPrio] = useState<Record<string, string>>({});
  const [focuses, setFocuses] = useState<ProjectFocus[]>([]);
  const [formFocus, setFormFocus] = useState<Record<string, string>>({});
  const [rutaTasks, setRutaTasks] = useState<RutaTask[]>([]);
  const [rutaFormDesc, setRutaFormDesc] = useState("");
  const [rutaFormPrio, setRutaFormPrio] = useState<'URGENTE' | 'NO_URGENTE'>('NO_URGENTE');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [mailings, setMailings] = useState<MailingMensual[]>([]);
  const [mailingProject, setMailingProject] = useState('');
  const [mailingMes, setMailingMes] = useState('');
  const [mailingObjetivo, setMailingObjetivo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [
        { data: tData },
        { data: pData },
        { data: fData },
        { data: rData },
        { data: cData },
        { data: mData }
      ] = await Promise.all([
        supabase.from("personal_tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("project_status").select("*").order("project_name", { ascending: true }),
        supabase.from("project_focus").select("*").order("created_at", { ascending: true }),
        supabase.from("la_ruta_tasks").select("*").order("created_at", { ascending: true }),
        supabase.from("campanas").select("id,nombre").order("nombre", { ascending: true }),
        supabase.from("mailings_mensuales").select("*").order("mes_objetivo", { ascending: false })
      ]);

      if (tData) setTasks(tData as PersonalTask[]);
      if (pData) setProjectStatuses(pData as ProjectStatus[]);
      if (fData) setFocuses(fData as ProjectFocus[]);
      if (rData) setRutaTasks(rData as RutaTask[]);
      if (cData) setCampanas(cData as Campana[]);
      if (mData) setMailings(mData as MailingMensual[]);

      setLoading(false);
      setCurrentTime(Date.now());
    };
    fetchData();
  }, []);

  const handleCreateTask = async (city: string, project: string) => {
    const desc = formDesc[project];
    const prio = formPrio[project] || 'NO_URGENTE';
    if (!desc?.trim()) return;
    const { data } = await supabase.from("personal_tasks").insert({
      city, project, description: desc, priority: prio, status: 'pending'
    }).select().single();
    if (data) {
      setTasks([...tasks, data as PersonalTask]);
      setFormDesc(prev => ({ ...prev, [project]: "" }));
    }
  };

  const handleCompleteTask = async (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    await supabase.from("personal_tasks").update({ status: 'completed' }).eq("id", id);
  };

  const handleDeleteTask = async (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
    await supabase.from("personal_tasks").delete().eq("id", id);
  };

  const handleLimpiarMes = async () => {
    if (!confirm("¿Borrar tareas completadas?")) return;
    setTasks(tasks.filter(t => t.status !== 'completed'));
    await supabase.from("personal_tasks").delete().eq('status', 'completed');
  };

  const toggleProjectStatus = async (ps: ProjectStatus) => {
    const newStatus = ps.status === 'OK' ? 'ATENCION' : 'OK';
    setProjectStatuses(projectStatuses.map(p => p.id === ps.id ? { ...p, status: newStatus } : p));
    await supabase.from("project_status").update({ status: newStatus }).eq("id", ps.id);
  };

  const saveFoco = async (project_name: string) => {
    const newText = formFocus[project_name];
    if (!newText?.trim()) return;
    const { data } = await supabase.from("project_focus").insert({ project_name, description: newText }).select().single();
    if (data) {
      setFocuses([...focuses, data as ProjectFocus]);
      setFormFocus(prev => ({ ...prev, [project_name]: "" }));
    }
  };

  const deleteFoco = async (focoId: string) => {
    setFocuses(focuses.filter(f => f.id !== focoId));
    await supabase.from("project_focus").delete().eq("id", focoId);
  };

  const handleCreateRutaTask = async () => {
    if (!rutaFormDesc.trim()) return;
    const { data } = await supabase.from("la_ruta_tasks").insert({ description: rutaFormDesc, priority: rutaFormPrio, status: 'pending' }).select().single();
    if (data) {
      setRutaTasks([...rutaTasks, data as RutaTask]);
      setRutaFormDesc("");
    }
  };

  const handleCreateMailing = async () => {
    const selectedProject = mailingProject || campanas[0]?.nombre;
    if (!selectedProject || !mailingMes || !mailingObjetivo.trim()) return;
    const selectedCampana = campanas.find(c => c.nombre === selectedProject);
    if (!selectedCampana) return;
    const { data } = await supabase.from("mailings_mensuales").insert({
      id_campana: selectedCampana.id, mes_objetivo: mailingMes, objetivo_correo: mailingObjetivo, estado_envio: 'pendiente'
    }).select().single();
    if (data) {
      setMailings([data as MailingMensual, ...mailings]);
      setMailingMes('');
      setMailingObjetivo('');
    }
  };

  const toggleMailingStatus = async (mailing: MailingMensual) => {
    const nextStatus = mailing.estado_envio === 'pendiente' ? 'enviado' : 'pendiente';
    const { data } = await supabase.from("mailings_mensuales").update({ estado_envio: nextStatus }).eq("id", mailing.id).select().single();
    if (data) setMailings(mailings.map(m => (m.id === mailing.id ? data as MailingMensual : m)));
  };

  const handleDeleteMailing = async (id: string) => {
    const { error } = await supabase.from("mailings_mensuales").delete().eq("id", id);
    if (!error) setMailings(mailings.filter(m => m.id !== id));
  };

  const isDelayed = (task: PersonalTask | RutaTask, cTime: number) => {
    if (task.priority !== 'NO_URGENTE' || task.status !== 'pending') return false;
    return (cTime - new Date(task.created_at).getTime()) / (1000 * 60 * 60) > 48;
  };

  if (loading) return <div className="p-10 text-white bg-black min-h-screen">Cargando tablero...</div>;

  return (
    <div className="min-h-screen bg-black p-6 md:p-10 font-sans text-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold tracking-tight">Mis Tareas Personales</h1>
          <button onClick={handleLimpiarMes} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">🗑 Limpiar Completadas</button>
        </div>

        {/* Mailings Mensuales */}
        <div className="mb-14 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">📧 Mailings Mensuales</h2>
          <div className="grid md:grid-cols-[220px_180px_1fr_auto] gap-3 mb-5">
            <select className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingProject || campanas[0]?.nombre || ''} onChange={e => setMailingProject(e.target.value)}>
              <option value="">Selecciona proyecto</option>
              {campanas.map(c => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
            </select>
            <input type="month" className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingMes} onChange={e => setMailingMes(e.target.value)} />
            <input type="text" placeholder="Objetivo..." className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={mailingObjetivo} onChange={e => setMailingObjetivo(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateMailing()} />
            <button onClick={handleCreateMailing} className="bg-white text-black font-bold px-4 py-2 rounded-lg">Guardar</button>
          </div>
          <div className="space-y-3">
            {mailings.map(m => (
              <div key={m.id} className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 flex justify-between items-center gap-3">
                <div className="flex-1">
                  <p className="font-semibold">{campanas.find(c => c.id === m.id_campana)?.nombre} · {m.mes_objetivo}</p>
                  <p className="text-sm text-zinc-400">{m.objetivo_correo}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleMailingStatus(m)} className={`text-xs font-bold px-3 py-2 rounded-lg ${m.estado_envio === 'enviado' ? 'bg-green-900 text-green-400' : 'bg-amber-900 text-amber-400'}`}>
                    {m.estado_envio === 'enviado' ? 'ENVIADO ✅' : 'PENDIENTE ⏳'}
                  </button>
                  <button onClick={() => handleDeleteMailing(m.id)} className="p-2 text-zinc-500 hover:text-red-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ciudades y Tareas */}
        <div className="space-y-16">
          {AGENCY_STRUCTURE.map(cityGroup => (
            <div key={cityGroup.city} className="space-y-6">
              <h2 className="text-3xl font-bold border-b border-zinc-800 pb-2 text-blue-400">📍 {cityGroup.city}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cityGroup.projects.map(projectName => {
                  const pendingTasks = tasks.filter(t => t.project === projectName && t.status === 'pending');
                  return (
                    <div key={projectName} className="bg-zinc-900 rounded-2xl border border-zinc-800 flex flex-col h-[600px] overflow-hidden">
                      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
                        <h3 className="font-bold truncate">{projectName}</h3>
                        <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{pendingTasks.length}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-zinc-950/30">
                        {pendingTasks.map(task => (
                          <div key={task.id} className={`p-3 rounded-xl border flex justify-between items-start gap-2 ${isDelayed(task, currentTime) ? "bg-red-950/30 border-red-800" : "bg-zinc-900 border-zinc-800"}`}>
                            <div className="flex gap-2 min-w-0">
                              <button onClick={() => handleCompleteTask(task.id)} className="mt-1 w-4 h-4 rounded-full border border-zinc-600 hover:bg-green-600 shrink-0" />
                              <p className="text-sm break-words">{task.description}</p>
                            </div>
                            <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-600 hover:text-red-500 shrink-0"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 border-t border-zinc-800 bg-zinc-900 space-y-3">
                        <input type="text" placeholder="Añadir tarea..." className="w-full text-sm p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-blue-500" value={formDesc[projectName] || ""} onChange={e => setFormDesc({ ...formDesc, [projectName]: e.target.value })} onKeyDown={e => e.key === 'Enter' && handleCreateTask(cityGroup.city, projectName)} />
                        <div className="flex gap-2">
                          <select className="flex-1 text-xs p-2 rounded-lg border border-zinc-700 bg-zinc-800 text-white" value={formPrio[projectName] || "NO_URGENTE"} onChange={e => setFormPrio({ ...formPrio, [projectName]: e.target.value })}>
                            <option value="NO_URGENTE">Estándar</option>
                            <option value="URGENTE">URGENTE 🔥</option>
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
      </div>
    </div>
  );
}