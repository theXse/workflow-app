"use client";

import React from "react";

const PLAN_MAESTRO = [
  {"id": 1, "color": "🔴", "etapa": "Carpeta de Convivencia (Pruebas)", "fecha": "2026-04-10", "notas": "Recopilar cuentas de servicios (luz/net) y declaración notarial. (Sustituto de arriendo)."},
  {"id": 2, "color": "🔴", "etapa": "Celebración AUC", "fecha": "2026-04-20", "notas": "Acuerdo de Unión Civil en Registro Civil. Verificación: Apostilla Digital Minrel inmediata."},
  {"id": 3, "color": "🔴", "etapa": "Control Solvencia (€13.000)", "fecha": "2026-05-30", "notas": "Fondos estables en cartolas de los últimos 3 meses."},
  {"id": 4, "color": "🟡", "etapa": "Antecedentes Penales", "fecha": "2026-06-15", "notas": "Certificado fines especiales + Apostilla (Vigencia 90 días)."},
  {"id": 5, "color": "🟡", "etapa": "Certificado Médico RSI 2005", "fecha": "2026-07-01", "notas": "Debe incluir frase textual de salud pública internacional + Apostilla."},
  {"id": 6, "color": "🔵", "etapa": "Seguro Médico Español", "fecha": "2026-07-15", "notas": "Póliza sin copago (Sanitas/Adeslas) operativa desde el día 1."},
  {"id": 7, "color": "🔵", "etapa": "Expediente EX-00 Diana", "fecha": "2026-07-25", "notas": "Formulario de acompañante + Copia completa de todas las hojas del pasaporte."},
  {"id": 8, "color": "🔵", "etapa": "Cita Consular Santiago", "fecha": "2026-08-01", "notas": "Entrega de carpetas espejo para visa."},
  {"id": 9, "color": "🔴", "etapa": "Empadronamiento BCN", "fecha": "2026-09-15", "notas": "Alta en ayuntamiento (Vital para legalidad en España)."},
  {"id": 10, "color": "🔴", "etapa": "Huellas TIE Diana", "fecha": "2026-10-10", "notas": "Cita en Policía para tarjeta de identidad física."}
];

export default function Viaje() {
  return (
    <div className="min-h-screen bg-black p-4 md:p-10 font-sans text-white">
      <div className="max-w-4xl mx-auto pb-20">
        <h1 className="text-3xl md:text-5xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-600">
          ✈️ Viaje: Plan Maestro Visa 2026
        </h1>
        
        <div className="space-y-4">
          {[...PLAN_MAESTRO]
            .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
            .map(task => {
              let cardStyle = "border-zinc-700 bg-zinc-800/50";
              if (task.color === "🔴") cardStyle = "border-red-500/50 bg-red-950/20";
              else if (task.color === "🟡") cardStyle = "border-amber-500/50 bg-amber-950/20";
              else if (task.color === "🔵") cardStyle = "border-blue-500/50 bg-blue-950/20";
              else if (task.color === "🟢") cardStyle = "border-emerald-500/50 bg-emerald-950/20";

              return (
                <div key={task.id} className={`p-5 rounded-2xl border-l-4 shadow-sm flex flex-col md:flex-row gap-5 transition-all ${cardStyle} hover:bg-white/5`}>
                  <div className="flex-1">
                    <div className="flex flex-wrap justify-between items-start mb-3 gap-4">
                      <h3 className="font-bold text-lg text-white">{task.etapa}</h3>
                      <span className={`text-[10px] sm:text-xs font-black px-3 py-1.5 rounded-full shrink-0 border uppercase tracking-wider flex items-center gap-1.5 ${
                          task.color === "🔴" ? "bg-red-500/20 text-red-400 border-red-500/30" :
                          task.color === "🟡" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                          task.color === "🔵" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                          "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        }`}>
                        <span>{task.color}</span>
                        {task.color === "🔴" ? "CRÍTICO" : task.color === "🟡" ? "ALTA" : task.color === "🔵" ? "MEDIA" : "BAJA"}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300">{task.notas}</p>
                  </div>
                  <div className="md:w-48 shrink-0 flex flex-col justify-center items-center py-4 px-2 bg-black/40 rounded-xl border border-white/5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Fecha Límite
                    </span>
                    <span className="text-lg font-black text-white">
                      {new Date(task.fecha + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
