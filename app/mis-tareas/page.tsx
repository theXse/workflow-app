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

  // Formularios Proyectos
  const [formDesc, setFormDesc] = useState<Record<string, string>>({});
  const [formPrio, setFormPrio] = useState<Record<string, string>>({});

  // Nuevos Focos Dinámicos Modulares
  const [focuses, setFocuses] = useState<ProjectFocus[]>([]);
  const [formFocus, setFormFocus] = useState<Record<string, string>>({});

  // Sección La Ruta
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
      if (cData) {
        setCampanas(cData as Campana[]);
      }
      if (mData) setMailings(mData as MailingMensual[]);

      setLoading(false);
      setCurrentTime(Date.now());
    };

    fetchData();
  }, []);

  // --- ACCIONES TAREAS ---
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
      setFormPrio(prev => ({ ...prev, [project]: "NO_URGENTE" }));
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
    if (!confirm("¿Estás seguro de eliminar PERMANENTEMENTE todas las tareas completadas?")) return;
    setTasks(tasks.filter(t => t.status !== 'completed'));
    await supabase.from("personal_tasks").delete().eq('status', 'completed');
  };

  // --- ACCIONES TABLA CONTROL Y FOCO ---
  const toggleProjectStatus = async (ps: ProjectStatus) => {
    const newStatus = ps.status === 'OK' ? 'ATENCION' : 'OK';
    setProjectStatuses(projectStatuses.map(p => p.id === ps.id ? { ...p, status: newStatus } : p));
    await supabase.from("project_status").update({ status: newStatus }).eq("id", ps.id);
  };

  const saveFoco = async (project_name: string) => {
    const newText = formFocus[project_name];
    if (!newText?.trim()) return;

    const { data } = await supabase.from("project_focus").insert({
      project_name,
      description: newText
    }).select().single();

    if (data) {
      setFocuses([...focuses, data as ProjectFocus]);
      setFormFocus(prev => ({ ...prev, [project_name]: "" }));
    }
  };

  const deleteFoco = async (focoId: string) => {
    setFocuses(focuses.filter(f => f.id !== focoId));
    await supabase.from("project_focus").delete().eq("id", focoId);
  };

  // --- SECCIÓN LA RUTA (ACCIONES) ---
  const handleCreateRutaTask = async () => {
    if (!rutaFormDesc.trim()) return;
    const { data } = await supabase.from("la_ruta_tasks").insert({
      description: rutaFormDesc, priority: rutaFormPrio, status: 'pending'
    }).select().single();
    if (data) {
      setRutaTasks([...rutaTasks, data as RutaTask]);
      setRutaFormDesc("");
      setRutaFormPrio("NO_URGENTE");
    }
  };

  const handleCompleteRutaTask = async (id: string) => {
    setRutaTasks(rutaTasks.map(t => t.id === id ? { ...t, status: 'completed' } : t));
    await supabase.from("la_ruta_tasks").update({ status: 'completed' }).eq("id", id);
  };

  const handleDeleteRutaTask = async (id: string) => {
    setRutaTasks(rutaTasks.filter(t => t.id !== id));
    await supabase.from("la_ruta_tasks").delete().eq("id", id);
  };

  // --- MAILINGS MENSUALES (ACCIONES) ---
  const handleCreateMailing = async () => {
    const selectedProject = mailingProject || campanas[0]?.nombre;
    if (!selectedProject || !mailingMes || !mailingObjetivo.trim()) return;

    const selectedCampana = campanas.find(c => c.nombre === selectedProject);
    if (!selectedCampana) return;

    const { data } = await supabase
      .from("mailings_mensuales")
      .insert({
        id_campana: selectedCampana.id,
        mes_objetivo: mailingMes,
        objetivo_correo: mailingObjetivo,
        estado_envio: 'pendiente'
      })
      .select()
      .single();

    if (data) {
      setMailings([data as MailingMensual, ...mailings]);
      setMailingMes('');
      setMailingObjetivo('');
    }
  };

  const toggleMailingStatus = async (mailing: MailingMensual) => {
    const nextStatus = mailing.estado_envio === 'pendiente' ? 'enviado' : 'pendiente';
    const { data } = await supabase
      .from("mailings_mensuales")
      .update({ estado_envio: nextStatus })
      .eq("id", mailing.id)
      .select()
      .single();

    if (data) {
      setMailings(mailings.map(m => (m.id === mailing.id ? data as MailingMensual : m)));
    }
  };

  // NUEVA FUNCIÓN: BORRAR MAILING PERMANENTE
  const handleDeleteMailing = async (id: string) => {
    const { error } = await supabase.from("mailings_mensuales").delete().eq("id", id);
    if (!error) {
      setMailings(mailings.filter(m => m.id !== id));
    } else {
      console.error("Error al borrar mailing:", error.message);
    }
  };

  const isDelayed = (task: PersonalTask | RutaTask, cTime: number) => {
    if (task.priority !== 'NO_URGENTE' || task.status !== 'pending') return false;
    const taskDate = new Date(task.created_at).getTime();
    return (cTime - taskDate) / (1000 * 60 * 60) > 48;
  };

  if (loading) return <div className="p-10 font-sans text-xl">Cargando tablero extendido...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 md:p-10 font-sans text-zinc-900 dark:text-zinc-100">
      <div className="max-w-7xl mx-auto">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <h1 className="text-4xl font-extrabold tracking-tight">Mis Tareas Personales</h1>
          <button onClick={handleLimpiarMes} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
            🗑 Limpiar Mes (Borrar Completadas)
          </button>
        </div>
        <p className="text-zinc-500 mb-8 text-lg">Organiza y prioriza tu flujo de trabajo de la agencia.</p>

        {/* Panel de Control */}
        <div className="mb-14 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">Panel de Control: Estado de Proyectos</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {projectStatuses.map(ps => (
              <div key={ps.id} className="flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/50">
                <span className="font-semibold text-sm leading-tight mb-3 truncate" title={ps.project_name}>{ps.project_name}</span>
                <button onClick={() => toggleProjectStatus(ps)} className={`py-1.5 px-3 rounded-md text-xs font-bold uppercase transition-colors text-center ${ps.status === 'OK' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {ps.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Mailings Mensuales corregidos con botón Borrar */}
        <div className="mb-14 bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-4">📧 Mailings Mensuales</h2>
          <div className="grid md:grid-cols-[220px_180px_1fr_auto] gap-3 mb-5">
            <select className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" value={mailingProject || campanas[0]?.nombre || ''} onChange={e => setMailingProject(e.target.value)}>
              <option value="">Selecciona proyecto</option>
              {campanas.map(c => (<option key={c.id} value={c.nombre}>{c.nombre}</option>))}
            </select>
            <input type="month" className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" value={mailingMes} onChange={e => setMailingMes(e.target.value)} />
            <input type="text" placeholder="Objetivo del correo mensual..." className="p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950" value={mailingObjetivo} onChange={e => setMailingObjetivo(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateMailing(); }} />
            <button onClick={handleCreateMailing} className="bg-black dark:bg-white text-white dark:text-black font-semibold text-sm px-4 py-2 rounded-lg">Guardar</button>
          </div>

          <div className="space-y-3">
            {mailings.map(m => {
              const projectName = campanas.find(c => c.id === m.id_campana)?.nombre || 'Proyecto sin nombre';
              return (
                <div key={m.id} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-semibold">{projectName} · {m.mes_objetivo}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">{m.objetivo_correo}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleMailingStatus(m)} className={`text-xs font-bold px-3 py-2 rounded-lg ${m.estado_envio === 'enviado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                      {m.estado_envio === 'enviado' ? 'ENVIADO ✅' : 'PENDIENTE ⏳'}
                    </button>
                    <button onClick={() => handleDeleteMailing(m.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title="Borrar mailing">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sección de Ciudades y Tareas (se mantiene igual que tu código original) */}
        <div className="space-y-16">
          {AGENCY_STRUCTURE.map(cityGroup => {
            const cityTasks = tasks.filter(t => t.city === cityGroup.city && t.status === 'pending');
            return (
              <div key={cityGroup.city} className="space-y-6">
                <div className="flex items-center gap-4 border-b-2 border-zinc-200 dark:border-zinc-800 pb-2">
                  <h2 className="text-3xl font-bold tracking-tight text-blue-700 dark:text-blue-400">📍 {cityGroup.city}</h2>
                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-bold">{cityTasks.length} Pendientes</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {cityGroup.projects.map(projectName => {
                    const allProjectTasks = tasks.filter(t => t.project === projectName);
                    const pendingTasks = allProjectTasks.filter(t => t.status === 'pending');
                    const completedTasks = allProjectTasks.filter(t => t.status === 'completed');
                    return (
                      <div key={projectName} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col h-[650px]">
                        <div className="bg-zinc-100/50 dark:bg-zinc-950/50 px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
                          <h3 className="font-bold text-lg leading-tight truncate pr-2">{projectName}</h3>
                          <span className="text-xs font-semibold bg-zinc-200 dark:bg-zinc-800 text-zinc-600 px-2 py-1 rounded">{pendingTasks.length}</span>
                        </div>
                        <div className="p-4 border-b border-zinc-200 bg-amber-50/40 dark:bg-amber-900/10 shrink-0">
                          <p className="text-xs font-bold text-amber-800 dark:text-amber-400 mb-2">🎯 FOCOS ESTRATÉGICOS</p>
                          <div className="space-y-2 mb-3">
                            {focuses.filter(f => f.project_name === projectName).map(foco => (
                              <div key={foco.id} className="flex gap-2 items-start text-xs text-amber-900 bg-amber-100/50 p-2 rounded relative group">
                                <span className="pt-0.5 shrink-0 opacity-70">•</span>
                                <span className="flex-1 whitespace-pre-wrap">{foco.description}</span>
                                <button onClick={() => deleteFoco(foco.id)} className="text-amber-600/50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <input type="text" className="flex-1 text-xs p-1.5 rounded border border-amber-200 bg-white/60 focus:outline-none" placeholder="Añadir nuevo foco..." value={formFocus[projectName] || ""} onChange={e => setFormFocus({ ...formFocus, [projectName]: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') saveFoco(projectName); }} />
                            <button onClick={() => saveFoco(projectName)} className="shrink-0 text-[10px] font-bold text-amber-700 bg-amber-200 hover:bg-amber-300 px-2 py-1 rounded">+ Añadir</button>
                          </div>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-zinc-50/30">
                          {pendingTasks.map(task => (
                            <div key={task.id} className={`relative group p-3 rounded-xl shadow-sm border transition-all ${isDelayed(task, currentTime) ? "bg-red-50 border-red-400" : "bg-white border-zinc-200"}`}>
                              <div className="flex gap-2">
                                <button onClick={() => handleCompleteTask(task.id)} className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 border-zinc-300 hover:bg-green-500 hover:border-green-500 flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white opacity-0 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium leading-snug break-words">{task.description}</p>
                                </div>
                                <button onClick={() => handleDeleteTask(task.id)} className="text-zinc-300 hover:text-red-500 transition-colors shrink-0 pt-0.5">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 border-t border-zinc-200 bg-white shrink-0 space-y-3">
                          <input type="text" placeholder="Añadir tarea..." className="w-full text-sm p-2 rounded-lg border border-zinc-300 bg-zinc-50 focus:ring-2 focus:ring-blue-500/50" value={formDesc[projectName] || ""} onChange={e => setFormDesc({ ...formDesc, [projectName]: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') handleCreateTask(cityGroup.city, projectName); }} />
                          <div className="flex gap-2">
                            <select className="flex-1 text-xs p-2 rounded-lg border border-zinc-300 bg-zinc-50" value={formPrio[projectName] || "NO_URGENTE"} onChange={e => setFormPrio({ ...formPrio, [projectName]: e.target.value })}>
                              <option value="NO_URGENTE">No Urgente</option>
                              <option value="URGENTE">URGENTE 🔥</option>
                            </select>
                            <button onClick={() => handleCreateTask(cityGroup.city, projectName)} className="bg-black text-white font-semibold text-xs px-4 py-2 rounded-lg">Agregar</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sección La Ruta */}
        <div className="mt-24 mb-16 border-t-4 border-purple-500 pt-10">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-4xl font-extrabold tracking-tight text-purple-700">🚀 LA RUTA</h2>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-purple-200 p-8 space-y-4">
            {rutaTasks.filter(t => t.status === 'pending').map(task => (
              <div key={task.id} className="relative group p-4 rounded-xl border border-zinc-200 flex gap-3">
                <button onClick={() => handleCompleteRutaTask(task.id)} className="mt-0.5 shrink-0 w-6 h-6 rounded-full border-2 border-zinc-300 hover:bg-green-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white opacity-0 hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </button>
                <div className="flex-1"><p className="text-lg font-medium">{task.description}</p></div>
                <button onClick={() => handleDeleteRutaTask(task.id)} className="text-zinc-300 hover:text-red-500 transition-colors pt-1">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
            <div className="mt-8 pt-6 border-t border-purple-100 flex gap-3">
              <input type="text" placeholder="Añadir paso a la ruta..." className="flex-1 text-base p-3 rounded-xl border border-purple-200 bg-white focus:ring-2 focus:ring-purple-500/50" value={rutaFormDesc} onChange={e => setRutaFormDesc(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleCreateRutaTask(); }} />
              <button onClick={handleCreateRutaTask} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-3 rounded-xl">Agregar a Ruta</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}