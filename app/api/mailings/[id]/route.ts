import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          "Faltan variables de entorno para borrar mailings (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 500 }
    );
  }

  const mailingId = params.id;
  if (!mailingId) {
    return NextResponse.json({ error: "ID de mailing inválido." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await admin.from("mailings_mensuales").delete().eq("id", mailingId);

  if (error) {
    return NextResponse.json(
      { error: error.message || "No se pudo borrar el mailing." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
