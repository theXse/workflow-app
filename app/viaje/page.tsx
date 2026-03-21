"use client";

import React, { useState } from "react";

type TaskStatus = 'pending' | 'apostilla' | 'completed';

type VisaTask = {
  id: number;
  color: string;
  etapa: string;
  fecha: string;
  notas: string;
  status: TaskStatus;
};

const INITIAL_PLAN: VisaTask[] = [
  {"id": 1, "color": "🔴", "etapa": "Carpeta de Convivencia (Pruebas)", "fecha": "2026-04-10", "notas": "Recopilar cuentas de servicios (luz/net) y declaración notarial. (Sustituto de arriendo).", "status": "pending"},
  {"id": 2, "color": "🔴", "etapa": "Celebración AUC", "fecha": "2026-04-20", "notas": "Acuerdo de Unión Civil en Registro Civil. Verificación: Apostilla Digital Minrel inmediata.", "status": "pending"},
  {"id": 3, "color": "🔴", "etapa": "Control Solvencia (€13.000)", "fecha": "2026-05-30", "notas": "Fondos estables en cartolas de los últimos 3 meses.", "status": "pending"},
  {"id": 4, "color": "🟡", "etapa": "Antecedentes Penales", "fecha": "2026-06-15", "notas": "Certificado fines especiales + Apostilla (Vigencia 90 días).", "status": "pending"},
  {"id": 5, "color": "🟡", "etapa": "Certificado Médico RSI 2005", "fecha": "2026-07-01", "notas": "Debe incluir frase textual de salud pública internacional + Apostilla.", "status": "pending"},
  {"id": 6, "color": "🔵", "etapa": "Seguro Médico Español", "fecha": "2026-07-15", "notas": "Póliza sin copago (Sanitas/Adeslas) operativa desde el día 1.", "status": "pending"},
  {"id": 7, "color": "🔵", "etapa": "Expediente EX-00 Diana", "fecha": "2026-07-25", "notas": "Formulario de acompañante + Copia completa de todas las hojas del pasaporte.", "status": "pending"},
  {"id": 8, "color": "🔵", "etapa": "Cita Consular Santiago", "fecha": "2026-08-01", "notas": "Entrega de carpetas espejo para visa.", "status": "pending"},
  {"id": 9, "color": "🔴", "etapa": "Empadronamiento BCN", "fecha": "2026-09-15", "notas": "Alta en ayuntamiento (Vital para legalidad en España).", "status": "pending"},
  {"id": 10, "color": "🔴", "etapa": "Huellas TIE Diana", "fecha": "2026-10-10", "notas": "Cita en Policía para tarjeta de identidad física.", "status": "pending"}
];

export default function Viaje() {
  const [tasks, setTasks] = useState<VisaTask[]>(INITIAL_PLAN);

  const updateStatus = (id: number, newStatus: TaskStatus) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  const handleDelete = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar permanentemente esta tarea?")) {
      setTasks(tasks.filter(t => t.id !== id));
    }
  };

  const getSortedTasks = () => {
    return [...tasks].sort((a, b) => {
      // Regla: Los completados se van automáticamente al final de la lista
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (b.status === 'completed' && a.status !== 'completed') return -1;
      
      // Regla: Orden cronológico inverso (lo que vence antes va arriba)
      return new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
    });
  };

  return (
    <div className="min-h-screen bg-black p-4 md:p-10 font-sans text-white">
      <div className="max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
          ✈️ Viaje: Plan Maestro Visa 2026
        </h1>
        
        <div className="space-y-5">
          {getSortedTasks().map(task => {
            let cardStyle = "";
            let textColor = "text-white";
            let notesColor = "text-zinc-300";
            let badgeStyle = "";
            let badgeText = "";
            
            // Regla: Si está completado, cambia a color Gris y se tacha
            if (task.status === 'completed') {
              cardStyle = "border-zinc-800 bg-zinc-900/60 opacity-60 grayscale";
              textColor = "text-zinc-500 line-through";
              notesColor = "text-zinc-600 line-through";
              badgeStyle = "bg-zinc-800 text-zinc-500 border-zinc-700";
              badgeText = "COMPLETADO";
            } 
            // Regla: Si falta legalización, el botón debe cambiar el color de la tarea a Naranja
            else if (task.status === 'apostilla') {
              cardStyle = "border-orange-500/80 bg-orange-950/40 shadow-[0_0_20px_rgba(249,115,22,0.15)]";
              textColor = "text-orange-100";
              notesColor = "text-orange-200/80";
              badgeStyle = "bg-orange-500/20 text-orange-400 border-orange-500/50";
              badgeText = "EN PROCESO (APOSTILLA)";
            } 
            // Estilos por defecto (basado en prioridad de colores del JSON)
            else {
              if (task.color === "🔴") {
                cardStyle = "border-red-500/60 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.1)]";
                badgeStyle = "bg-red-500/20 text-red-400 border-red-500/40";
                badgeText = "CRÍTICO";
              } else if (task.color === "🟡") {
                cardStyle = "border-amber-500/50 bg-amber-950/20";
                badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/30";
                badgeText = "ALTA";
              } else if (task.color === "🔵") {
                cardStyle = "border-blue-500/50 bg-blue-950/20";
                badgeStyle = "bg-blue-500/20 text-blue-400 border-blue-500/30";
                badgeText = "MEDIA";
              } else if (task.color === "🟢") {
                cardStyle = "border-emerald-500/50 bg-emerald-950/20";
                badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
                badgeText = "BAJA";
              }
            }

            return (
              <div key={task.id} className={`p-5 md:p-6 rounded-2xl border-l-4 shadow-sm flex flex-col gap-4 transition-all duration-300 ${cardStyle}`}>
                
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start mb-3 gap-4">
                      <h3 className={`font-bold text-xl ${textColor}`}>{task.etapa}</h3>
                      <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full shrink-0 border uppercase tracking-wider flex items-center gap-1.5 ${badgeStyle}`}>
                        {task.status !== 'completed' && <span>{task.color}</span>}
                        {badgeText}
                      </span>
                    </div>
                    <p className={`text-sm md:text-base ${notesColor}`}>{task.notas}</p>
                  </div>
                  
                  <div className="md:w-48 shrink-0 flex flex-col justify-center items-center py-4 px-2 bg-black/40 rounded-xl border border-white/5 mx-auto w-full md:mx-0">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Fecha Límite
                    </span>
                    <span className={`text-xl font-black ${task.status === 'completed' ? 'text-zinc-600 line-through' : 'text-white'}`}>
                      {new Date(task.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* BOTONERA DE ACCIÓN RÁPIDA */}
                <div className="flex gap-2 md:gap-3 border-t border-white/5 pt-4 mt-2 flex-wrap">
                  <button 
                    onClick={() => updateStatus(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`flex-1 min-w-[140px] text-xs font-black px-4 py-3 rounded-xl transition-all border uppercase tracking-wider flex items-center justify-center gap-2 ${
                      task.status === 'completed' 
                      ? 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700' 
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    {task.status === 'completed' ? '↺ Deshacer' : '✅ Completado'}
                  </button>
                  
                  {task.status !== 'completed' && (
                    <button 
                      onClick={() => updateStatus(task.id, task.status === 'apostilla' ? 'pending' : 'apostilla')}
                      className={`flex-1 min-w-[200px] text-xs font-black px-4 py-3 rounded-xl transition-all border uppercase tracking-wider flex items-center justify-center gap-2 ${
                        task.status === 'apostilla'
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30'
                        : 'bg-zinc-800/80 text-orange-400/80 border-orange-500/20 hover:bg-orange-500/20'
                      }`}
                    >
                      {task.status === 'apostilla' ? '⚠️ Quitar Marca de Apostilla' : '⚠️ Pendiente Apostilla'}
                    </button>
                  )}
                  
                  <div className="hidden sm:block flex-1"></div>
                  
                  <button 
                    onClick={() => handleDelete(task.id)}
                    className="flex-1 sm:flex-none text-xs font-black px-6 py-3 rounded-xl transition-all border bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/30 uppercase tracking-wider flex items-center justify-center"
                    title="Borrar tarea definitivamente"
                  >
                    ❌ Eliminar
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
