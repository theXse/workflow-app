import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

async function fetchTable(table) {
  const { data, error } = await supabase.from(table).select("*").limit(50);
  if (error) return [];
  return data ?? [];
}

export async function POST(req) {
  try {
    const { message, history = [] } = await req.json();

    // Fetch Supabase data in parallel
    const [tareas, personal_tasks, recordatorios_generales, la_ruta_tasks, contenidos] =
      await Promise.all([
        fetchTable("tareas"),
        fetchTable("personal_tasks"),
        fetchTable("recordatorios_generales"),
        fetchTable("la_ruta_tasks"),
        fetchTable("contenidos"),
      ]);

    const context = `
=== DATOS DE WORKFLOW ===

TAREAS (${tareas.length} registros):
${JSON.stringify(tareas, null, 2)}

PERSONAL TASKS (${personal_tasks.length} registros):
${JSON.stringify(personal_tasks, null, 2)}

RECORDATORIOS GENERALES (${recordatorios_generales.length} registros):
${JSON.stringify(recordatorios_generales, null, 2)}

LA RUTA TASKS (${la_ruta_tasks.length} registros):
${JSON.stringify(la_ruta_tasks, null, 2)}

CONTENIDOS (${contenidos.length} registros):
${JSON.stringify(contenidos, null, 2)}
`;

    const systemPrompt =
      "Eres el asistente personal de Xime, quien trabaja en La Ruta, agencia de marketing para Civilia (inmobiliaria chilena). Tienes acceso a sus datos de workflow. Responde siempre en español, de forma concisa y con emojis para facilitar lectura en móvil.";

    const messages = [
      ...history.map((m) => ({ role: m.role, content: m.content })),
      {
        role: "user",
        content: `${message}\n\n${context}`,
      },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0]?.text ?? "No pude generar una respuesta.";
    return Response.json({ reply });
  } catch (err) {
    console.error("Chat API error:", err);
    return Response.json({ reply: "❌ Error interno. Intenta nuevamente." }, { status: 500 });
  }
}
