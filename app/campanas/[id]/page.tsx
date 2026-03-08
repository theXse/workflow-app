"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabase";

type Miembro = { id: string; nombre: string; email: string; rol: string; telefono: string };
type Campana = { id: string; nombre: string; ubicacion: string; estado: string };
type Contenido = { id: string; textos: string; estado: string; id_campana: string };
type Tarea = {
  id: string; titulo: string; descripcion: string; id_responsable: string;
  link_drive: string; estado: string; plataformas_publicadas: string[];
};
type Soporte = { id: string; descripcion_solicitud: string; estado: string; id_solicitante: string };

const PLATAFORMAS = ['Instagram', 'Facebook', 'Pmax'];

export default function CampanaDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: campanaId } = use(params);

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Miembro | null>(null);
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [campana, setCampana] = useState<Campana | null>(null);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [soportes, setSoportes] = useState<Soporte[]>([]);
  const [activeTab, setActiveTab] = useState('contenidos');

  const [nuevoContenidoTxt, setNuevoContenidoTxt] = useState("");
  const [nuevoSoporteTxt, setNuevoSoporteTxt] = useState("");

  // Move fetchData inside useEffect or wrap in useCallback, but simple inline is fine:
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [cRes, mRes, conRes, tarRes, sopRes] = await Promise.all([
        supabase.from("campanas").select("*").eq("id", campanaId).single(),
        supabase.from("miembros_equipo").select("*").order("nombre"),
        supabase.from("contenidos").select("*").eq("id_campana", campanaId).order("created_at"),
        supabase.from("tareas").select("*").eq("id_campana", campanaId).order("created_at"),
        supabase.from("soporte_web").select("*").eq("id_campana", campanaId).order("created_at")
      ]);

      if (cRes.data) setCampana(cRes.data);
      if (mRes.data) {
        setMiembros(mRes.data);
        if (!currentUser) setCurrentUser(mRes.data[0]); // Default first user
      }
      if (conRes.data) setContenidos(conRes.data);
      if (tarRes.data) setTareas(tarRes.data);
      if (sopRes.data) setSoportes(sopRes.data);
      setLoading(false);
    };

    fetchData();
  }, [campanaId, currentUser]);

  const handleNotify = async (event: string, actionData: unknown) => {
    await fetch("/api/notify-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, actionData, triggeredBy: currentUser })
    });
  };

  // --- CONTENIDOS ---
  const handleCrearContenido = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoContenidoTxt) return;
    const { data } = await supabase.from("contenidos").insert({
      id_campana: campanaId, textos: nuevoContenidoTxt, estado: 'borrador_admin'
    }).select().single();
    if (data) setContenidos([...contenidos, data]);
    setNuevoContenidoTxt("");
  };

  const updateContenidoStatus = async (id: string, estado: string) => {
    const { data } = await supabase.from("contenidos").update({ estado }).eq("id", id).select().single();
    if (data) {
      setContenidos(contenidos.map(c => c.id === id ? data : c));
      
      // Regla de Negocio: Si aprueba diseño, crea Tarea
      if (estado === 'aprobado_para_diseño') {
        const disenador = miembros.find(m => m.rol === 'diseñador');
        if (disenador) {
          const { data: tData } = await supabase.from("tareas").insert({
            id_campana: campanaId,
            titulo: "Diseño para: " + data.textos.substring(0, 20) + "...",
            id_responsable: disenador.id,
            estado: 'diseño_en_proceso'
          }).select().single();
          if (tData) {
            setTareas([...tareas, tData]);
            handleNotify("START_DESIGN", { tarea: tData, disenador });
          }
        }
      } else {
        handleNotify("CONTENIDO_UPDATE", { contenido: data });
      }
    }
  };

  // --- TAREAS (DISEÑO Y PUBLICACIÓN) ---
  const updateTarea = async (id: string, updates: Partial<Tarea>, eventName: string) => {
    const { data } = await supabase.from("tareas").update(updates).eq("id", id).select().single();
    if (data) {
      setTareas(tareas.map(t => t.id === id ? data : t));
      handleNotify(eventName, { tarea: data });
    }
  };

  const togglePlataforma = async (tarea: Tarea, plat: string) => {
    let arr = [...tarea.plataformas_publicadas];
    if (arr.includes(plat)) arr = arr.filter(p => p !== plat);
    else arr.push(plat);
    
    await updateTarea(tarea.id, { plataformas_publicadas: arr }, "PLATAFORMA_TOGGLE");
  };

  // --- SOPORTE WEB ---
  const handleCrearSoporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoSoporteTxt) return;
    const { data } = await supabase.from("soporte_web").insert({
      id_campana: campanaId, descripcion_solicitud: nuevoSoporteTxt, estado: 'pendiente', id_solicitante: currentUser?.id
    }).select().single();
    if (data) {
      setSoportes([...soportes, data]);
      handleNotify("SOPORTE_CREATED", { soporte: data });
    }
    setNuevoSoporteTxt("");
  };

  const updateSoporte = async (id: string, estado: string) => {
    const { data } = await supabase.from("soporte_web").update({ estado }).eq("id", id).select().single();
    if (data) {
      setSoportes(soportes.map(s => s.id === id ? data : s));
      if (estado === 'realizado') handleNotify("SOPORTE_REALIZADO", { soporte: data });
    }
  };

  if (loading || !campana) return <div className="p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Usurpador de Identidad (Para testing) */}
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl flex items-center gap-4 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-800">
          <span className="font-semibold">Testear como:</span>
          <select 
            className="p-2 rounded-lg bg-white dark:bg-zinc-800 border-none font-medium"
            value={currentUser?.id} 
            onChange={e => setCurrentUser(miembros.find(m => m.id === e.target.value) || null)}
          >
            {miembros.map(m => (
              <option key={m.id} value={m.id}>{m.nombre} (Rol: {m.rol})</option>
            ))}
          </select>
          <span className="text-sm opacity-80 ml-auto">La UI cambiará sus botones según este rol.</span>
        </div>

        {/* Info Campaña */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
          <h1 className="text-3xl font-bold">{campana.nombre}</h1>
          <p className="text-zinc-500 mt-1">📍 {campana.ubicacion}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
          {['contenidos', 'diseño', 'soporte'].map(tab => (
            <button key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-medium rounded-t-lg capitalize transition-colors ${activeTab === tab ? 'bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border-b-2 border-black dark:border-white' : 'text-zinc-500 hover:text-black dark:hover:text-white'}`}>
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Tab CONTENT: CONTENIDOS */}
        {activeTab === 'contenidos' && (
          <div className="space-y-4">
            {currentUser?.rol === 'admin' && (
              <form onSubmit={handleCrearContenido} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                <h3 className="font-semibold mb-2">Crear Nuevo Set de Contenido</h3>
                <textarea className="w-full p-2 border rounded-lg bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-2 mb-2" rows={3} value={nuevoContenidoTxt} onChange={e => setNuevoContenidoTxt(e.target.value)} required placeholder="Textos para la pieza gráfica..." />
                <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium">Guardar Borrador</button>
              </form>
            )}

            <div className="grid gap-3">
              {contenidos.map(c => (
                <div key={c.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-3">
                  <p className="text-sm whitespace-pre-wrap">{c.textos}</p>
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3 mt-1">
                    <span className="text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md uppercase tracking-wider">{c.estado.replace(/_/g, ' ')}</span>
                    <div className="flex gap-2">
                      {currentUser?.rol === 'admin' && c.estado === 'borrador_admin' && (
                        <button onClick={() => updateContenidoStatus(c.id, 'revision_jefe_proyecto')} className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-lg">Enviar a Jefe de Proyecto</button>
                      )}
                      {currentUser?.rol === 'jefe_proyecto' && c.estado === 'revision_jefe_proyecto' && (
                        <>
                          <button onClick={() => updateContenidoStatus(c.id, 'correccion_admin')} className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-lg">Solicitar Corrección</button>
                          <button onClick={() => updateContenidoStatus(c.id, 'aprobado_para_diseño')} className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-lg">Aprobar Diseño</button>
                        </>
                      )}
                      {currentUser?.rol === 'admin' && c.estado === 'correccion_admin' && (
                        <button onClick={() => updateContenidoStatus(c.id, 'revision_jefe_proyecto')} className="text-sm bg-yellow-100 text-yellow-800 px-3 py-1 rounded-lg">Reenviar Corregido</button>
                      )}
                      {currentUser?.rol === 'admin' && (c.estado === 'borrador_admin' || c.estado === 'correccion_admin') && (
                        <button onClick={() => updateContenidoStatus(c.id, 'aprobado_para_diseño')} className="text-sm bg-green-100 text-green-800 px-3 py-1 rounded-lg">Forzar Aprobado (Saltar JP)</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {contenidos.length === 0 && <div className="text-zinc-500">No hay contenidos en esta fase.</div>}
            </div>
          </div>
        )}

        {/* Tab CONTENT: DISEÑO Y PUBLICACIÓN */}
        {activeTab === 'diseño' && (
          <div className="space-y-4">
            {tareas.map(t =>(
              <div key={t.id} className="bg-white dark:bg-zinc-900 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{t.titulo}</h3>
                    <span className="inline-block mt-1 text-xs font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 px-2 py-1 rounded-md uppercase tracking-wider">
                      {t.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-zinc-500 flex flex-col items-end">
                    <span>Responsable ID: {t.id_responsable?.substring(0,6)}...</span>
                  </div>
                </div>

                {/* Acciones para el DISEÑADOR */}
                {currentUser?.rol === 'diseñador' && (t.estado === 'diseño_en_proceso' || t.estado === 'correccion_diseñadora' || t.estado === 'feedback_cliente') && (
                  <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 flex gap-2">
                    <input 
                      type="url" 
                      placeholder="Pegar link de Google Drive del diseño..." 
                      className="flex-1 p-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      value={t.link_drive || ""}
                      onChange={e => {
                        const newTareas = [...tareas];
                        newTareas.find(nt => nt.id === t.id)!.link_drive = e.target.value;
                        setTareas(newTareas);
                      }}
                    />
                    <button 
                      onClick={() => updateTarea(t.id, { link_drive: t.link_drive, estado: 'revision_interna_admin' }, 'REVISION_INTERNA')}
                      className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 font-medium rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap"
                    >
                      Enviar a Revisión Interna
                    </button>
                  </div>
                )}

                {/* Visor de Link */}
                {t.link_drive && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-zinc-500">Archivos:</span>
                    <a href={t.link_drive} target="_blank" className="text-blue-600 hover:underline break-all">📁 Ver en Drive</a>
                  </div>
                )}

                {/* BOTONERA POR ROLES */}
                <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  {/* ADMIN */}
                  {currentUser?.rol === 'admin' && t.estado === 'revision_interna_admin' && (
                    <>
                      <button onClick={() => updateTarea(t.id, { estado: 'correccion_diseñadora' }, 'CORRECCION_DISENADORA')} className="bg-red-100 text-red-800 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">👎 Solicitar Modificación (1-click)</button>
                      <button onClick={() => updateTarea(t.id, { estado: 'enviado_a_cliente' }, 'ENVIADO_CLIENTE')} className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">👍 Aprobar y Enviar a Cliente</button>
                    </>
                  )}

                  {/* JEFE DE PROYECTO */}
                  {currentUser?.rol === 'jefe_proyecto' && t.estado === 'enviado_a_cliente' && (
                    <>
                      <button onClick={() => updateTarea(t.id, { estado: 'feedback_cliente' }, 'FEEDBACK_CLIENTE')} className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">💬 Recibí Feedback de Cliente</button>
                      <button onClick={() => updateTarea(t.id, { estado: 'diseño_final_aprobado' }, 'DISENIO_APROBADO')} className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">✅ Diseño Aprobado por Cliente</button>
                    </>
                  )}

                  {/* ADMIN handling FEEDBACK */}
                  {currentUser?.rol === 'admin' && t.estado === 'feedback_cliente' && (
                    <button onClick={() => updateTarea(t.id, { estado: 'correccion_diseñadora' }, 'CORRECCION_DISENADORA')} className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-4 py-2 rounded-lg text-sm font-semibold transition-colors">Enviar a Diseñador con Feedback</button>
                  )}

                  {/* MANAGER META - PUBLICACION */}
                  {(t.estado === 'diseño_final_aprobado' || t.estado === 'publicado') && (
                    <div className="w-full bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <h4 className="font-semibold text-sm mb-3">📍 Plataformas de Publicación</h4>
                      <div className="flex gap-6">
                        {PLATAFORMAS.map(plat => (
                          <label key={plat} className={`flex items-center gap-2 cursor-pointer ${currentUser?.rol !== 'manager_meta' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                              checked={t.plataformas_publicadas?.includes(plat) || false}
                              onChange={() => togglePlataforma(t, plat)}
                              disabled={currentUser?.rol !== 'manager_meta'}
                            />
                            <span className="text-sm font-medium">{plat}</span>
                          </label>
                        ))}
                      </div>
                      {currentUser?.rol === 'manager_meta' && t.estado !== 'publicado' && t.plataformas_publicadas?.length === PLATAFORMAS.length && (
                         <button onClick={() => updateTarea(t.id, { estado: 'publicado' }, 'PUBLICADO_FINAL')} className="mt-4 bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg text-sm font-semibold">Marcar Todo como Publicado Oficialmente</button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}
            {tareas.length === 0 && <div className="text-zinc-500">No hay tareas de diseño.</div>}
          </div>
        )}

        {/* Tab CONTENT: SOPORTE WEB */}
        {activeTab === 'soporte' && (
          <div className="space-y-4">
            {currentUser?.rol === 'jefe_proyecto' && (
              <form onSubmit={handleCrearSoporte} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                 <h3 className="font-semibold mb-2">Solicitar Soporte Web</h3>
                 <textarea className="w-full p-2 border rounded-lg bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-2 mb-2" rows={2} value={nuevoSoporteTxt} onChange={e => setNuevoSoporteTxt(e.target.value)} required placeholder="Ej. Cambiar banner de la landing Page..." />
                 <button type="submit" className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-lg font-medium">Enviar Solicitud a Soporte</button>
              </form>
            )}

            <div className="grid gap-3">
              {soportes.map(s => (
                <div key={s.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${s.estado === 'realizado' ? 'line-through text-zinc-400' : ''}`}>{s.descripcion_solicitud}</p>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 mt-2 px-2 py-1 rounded-md text-zinc-600 uppercase tracking-wide">{s.estado}</span>
                  </div>
                  {currentUser?.rol === 'admin' && s.estado === 'pendiente' && (
                    <button onClick={() => updateSoporte(s.id, 'realizado')} className="shrink-0 bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium hover:bg-green-200">Marcar Realizado</button>
                  )}
                </div>
              ))}
              {soportes.length === 0 && <div className="text-zinc-500">No hay tickets de soporte web activos.</div>}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
