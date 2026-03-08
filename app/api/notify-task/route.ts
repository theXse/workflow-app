import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { taskName, responsable } = await request.json();

    // --------------------------------------------------------------------------
    // INTEGRACIÓN CON RESEND (CORREOS)
    // --------------------------------------------------------------------------
    // Ejemplo estructurado para cuando se integre `resend`:
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    //
    // await resend.emails.send({
    //   from: 'Acme <onboarding@resend.dev>',
    //   to: [responsableEmail], // El correo debe venir en el request en el futuro
    //   subject: `Tarea completada: ${taskName}`,
    //   html: `<p>Hola ${responsable}, tu tarea <strong>${taskName}</strong> ha sido completada exitosamente.</p>`
    // });
    // --------------------------------------------------------------------------


    // --------------------------------------------------------------------------
    // INTEGRACIÓN CON TWILIO (WHATSAPP)
    // --------------------------------------------------------------------------
    // Ejemplo estructurado para cuando se integre `twilio`:
    // import twilio from 'twilio';
    // const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    //
    // await client.messages.create({
    //   body: `Hola ${responsable}, la tarea "${taskName}" ha sido marcada como completada.`,
    //   from: 'whatsapp:+14155238886', // Número de Sandbox de Twilio
    //   to: `whatsapp:${responsablePhone}` // Número que debe venir en el request
    // });
    // --------------------------------------------------------------------------

    console.log(`[NOTIFICACIÓN] La tarea "${taskName}" asignada a "${responsable}" ha sido marcada como completada.`);

    return NextResponse.json({ success: true, message: "Notificación procesada y logged a consola." });
    
  } catch (error) {
    console.error("Error procesando notificación de tarea:", error);
    return NextResponse.json({ error: "No se pudo procesar la notificación" }, { status: 500 });
  }
}
