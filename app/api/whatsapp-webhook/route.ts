import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Este Endpoint en producción sería un webhook conectado a Twilio
export async function POST(request: Request) {
  try {
    // FormData parse si viniera como urlencoded de Twilio oficial, pero usaremos JSON para test
    const data = await request.json();
    const fromPhone = data.From; // ej "+56911111111"
    const bodyText = data.Body?.trim().toLowerCase() || ""; // ej "aprobar 1a2b3c"

    console.log(`[WHATSAPP WEBHOOK] Mensaje de ${fromPhone}: "${bodyText}"`);

    // 1. Identificar al usuario que envía
    const { data: usuario } = await supabase
      .from("miembros_equipo")
      .select("*")
      .eq("telefono", fromPhone)
      .single();

    if (!usuario) {
      console.log("-> Remitente desconocido.");
      return NextResponse.json({ success: false, message: "Remitente Desconocido" });
    }

    if (usuario.rol !== 'admin') {
       console.log("-> Remitente no es admin, ignorando comando.");
       return NextResponse.json({ success: false, message: "No autorizado" });
    }

    // 2. Parsear el comando. El UI sugirió "Aprobar XXXX" o "Rechazar XXXX"
    const isAprobar = bodyText.includes('aprobar');
    const isRechazar = bodyText.includes('rechazar');
    
    if (!isAprobar && !isRechazar) {
      return NextResponse.json({ success: true, message: "Comando no reconocido" });
    }

    // Extraer un pedazo del ID si viene (ej. "aprobar abc12")
    const parts = bodyText.split(' ');
    const idHint = parts.length > 1 ? parts[1] : null;

    // Buscamos tareas en estado "revision_interna_admin"
    let query = supabase.from("tareas").select("*").eq("estado", "revision_interna_admin");
    if (idHint) {
       // Buscar por prefijo ID de UUID
       query = query.like('id', `${idHint}%`);
    } else {
       // Si no pone ID, sacamos la más reciente
       query = query.order('created_at', { ascending: false }).limit(1);
    }

    const { data: tareas } = await query;

    if (!tareas || tareas.length === 0) {
      console.log("-> No se encontraron tareas pendientes de revisión que coincidan.");
      return NextResponse.json({ success: true, message: "Sin tareas pendientes" });
    }

    const tarea = tareas[0];
    const newState = isAprobar ? 'enviado_a_cliente' : 'correccion_diseñadora';

    // 3. Ejecutar el update
    const { error, data: updatedTarea } = await supabase
      .from("tareas")
      .update({ estado: newState })
      .eq("id", tarea.id)
      .select()
      .single();

    if (!error) {
      console.log(`-> Tarea ${tarea.id} actualizada a: ${newState} viá WhatsApp!`);
      // Simular respuesta SMS de vuelta al Admin
      console.log(`[TWILIO RESPUESTA -> ${fromPhone}]: Acción ejecutada correctamente en la tarea "${updatedTarea.titulo}"`);
    }

    return NextResponse.json({ success: true, message: "Webhook procesado exitosamente" });

  } catch (error) {
    console.error("Error en webhook de WhatsApp:", error);
    return NextResponse.json({ error: "No se pudo procesar el webhook" }, { status: 500 });
  }
}
