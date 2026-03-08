import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const { event, actionData, triggeredBy } = await request.json();

    // Helper: Enviar SMS via Twilio (Simulado)
    const sendTwilioMessage = (toPhone: string | undefined, message: string, rolName?: string) => {
      if (!toPhone) return;
      const rolStr = rolName ? `[Rol/Teléfono: ${rolName}/${toPhone}]` : `[Teléfono: ${toPhone}]`;
      console.log(`SIMULACIÓN WHATSAPP -> ${rolStr}: ${message}`);
      // await client.messages.create({ body: message, from: 'whatsapp:+1...', to: `whatsapp:${toPhone}` });
    };

    // Helper: Obtener todos los teléfonos de un rol específico
    const getPhonesByRole = async (rol: string) => {
      const { data } = await supabase.from('miembros_equipo').select('telefono').eq('rol', rol);
      return data?.map(m => m.telefono).filter(Boolean) || [];
    };

    // Helper: Obtener teléfono de un miembro específico
    const getPhoneById = async (id: string) => {
      if (!id) return null;
      const { data } = await supabase.from('miembros_equipo').select('telefono').eq('id', id).single();
      return data?.telefono;
    };

    console.log(`\n=== INICIANDO NOTIFICACIÓN POR Evento: ${event} ===`);

    switch (event) {
      case 'START_DESIGN': {
        // Tarea asignada al diseñador
        const phone = actionData.disenador?.telefono;
        sendTwilioMessage(phone, `🤖 Hola! Se te ha asignado un nuevo diseño: "${actionData.tarea.titulo}". Por favor revisa la plataforma.`, 'diseñador');
        break;
      }

      case 'CONTENIDO_UPDATE': {
        const estado = actionData.contenido.estado;
        if (estado === 'revision_jefe_proyecto') {
          const jpPhones = await getPhonesByRole('jefe_proyecto');
          jpPhones.forEach(phone => sendTwilioMessage(phone, `📄 Tienes un nuevo contenido esperando tu revisión para la campaña.`, 'jefe_proyecto'));
        } else if (estado === 'correccion_admin') {
          const adminPhones = await getPhonesByRole('admin');
          adminPhones.forEach(phone => sendTwilioMessage(phone, `⚠️ El Jefe de Proyecto solicitó una corrección en un contenido.`, 'admin'));
        }
        break;
      }

      case 'REVISION_INTERNA': {
        // Diseñador solicita revisión a Admins
        const adminPhones = await getPhonesByRole('admin');
        const tarea = actionData.tarea;
        const msg = `🔍 Revisión de Diseño Requerida.\nTarea: ${tarea.titulo}\nDrive: ${tarea.link_drive}\nResponde "Aprobar ${tarea.id.substring(0,6)}" o "Rechazar ${tarea.id.substring(0,6)}" para actuar rápido.`;
        adminPhones.forEach(phone => sendTwilioMessage(phone, msg, 'admin'));
        break;
      }

      case 'CORRECCION_DISENADORA': {
        // Admin rechazó, avisa a Diseñadora y Admins
        const adminPhones = await getPhonesByRole('admin');
        const disenoPhone = await getPhoneById(actionData.tarea.id_responsable);
        
        sendTwilioMessage(disenoPhone, `❌ Tu diseño para "${actionData.tarea.titulo}" requiere modificaciones. Revisa los comentarios en el Drive: ${actionData.tarea.link_drive}`, 'diseñador');
        adminPhones.forEach(phone => sendTwilioMessage(phone, `INFO: Se solicitó modificación al diseñador para la tarea "${actionData.tarea.titulo}"`, 'admin'));
        break;
      }

      case 'ENVIADO_CLIENTE': {
        // Aprobado internamente, avisar a Jefes de Proyecto
        const jpPhones = await getPhonesByRole('jefe_proyecto');
        jpPhones.forEach(phone => sendTwilioMessage(phone, `✅ El diseño "${actionData.tarea.titulo}" ha sido aprobado internamente. Está listo para ser enviado al cliente.`, 'jefe_proyecto'));
        break;
      }

      case 'DISENIO_APROBADO': {
        // Aprobado por cliente, avisar al Manager Meta
        const metaPhones = await getPhonesByRole('manager_meta');
        metaPhones.forEach(phone => sendTwilioMessage(phone, `🚀 El diseño final de "${actionData.tarea.titulo}" fue aprobado por el cliente. Ya puedes iniciar las publicaciones.`, 'manager_meta'));
        break;
      }

      case 'PLATAFORMA_TOGGLE': {
        // Cuando manager_meta marca una plataforma
        const adminPhones = await getPhonesByRole('admin');
        adminPhones.forEach(phone => sendTwilioMessage(phone, `📱 Actualización de Pauta: Se ha actualizado el estado de publicación en plataformas para la tarea ${actionData.tarea.titulo}.`, 'admin'));
        break;
      }

      case 'PUBLICADO_FINAL': {
        const adminPhones = await getPhonesByRole('admin');
        adminPhones.forEach(phone => sendTwilioMessage(phone, `🎉 ¡Éxito! La tarea de publicación de "${actionData.tarea.titulo}" ha finalizado en todas las plataformas.`, 'admin'));
        break;
      }

      case 'SOPORTE_CREATED': {
        // Soporte pendiente
        const adminPhones = await getPhonesByRole('admin');
        adminPhones.forEach(phone => sendTwilioMessage(phone, `⚠️ Nuevo Requerimiento de Soporte Web de ${triggeredBy?.nombre}: "${actionData.soporte.descripcion_solicitud}".`, 'admin'));
        break;
      }

      case 'SOPORTE_REALIZADO': {
        // Soporte Finalizado
        const solicitantePhone = await getPhoneById(actionData.soporte.id_solicitante);
        sendTwilioMessage(solicitantePhone, `✅ Tu requerimiento de Soporte Web "${actionData.soporte.descripcion_solicitud}" ha sido marcado como COMPLETADO por un admin.`, 'solicitante');
        break;
      }

      default:
        console.log("Evento desconocido:", event);
    }

    return NextResponse.json({ success: true, message: "Notificaciones enviadas." });
    
  } catch (error) {
    console.error("Error procesando notificación:", error);
    return NextResponse.json({ error: "No se pudo procesar la notificación" }, { status: 500 });
  }
}
