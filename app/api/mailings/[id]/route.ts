import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseUrl || (!serviceRoleKey && !anonKey)) {
    return NextResponse.json(
      {
        error:
          "Faltan variables de entorno para borrar mailings (NEXT_PUBLIC_SUPABASE_URL y al menos una key: SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_ANON_KEY).",
      },
      { status: 500 }
    );
  }

  const mailingId = params.id;
  if (!mailingId) {
    return NextResponse.json({ error: "ID de mailing inválido." }, { status: 400 });
  }

  const supabaseKey = serviceRoleKey || anonKey;
  const db = createClient(supabaseUrl, supabaseKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await db
    .from("mailings_mensuales")
    .update({
      estado_envio: "eliminado",
    })
    .eq("id", mailingId)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message || "No se pudo borrar el mailing." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, id: data.id });
}
