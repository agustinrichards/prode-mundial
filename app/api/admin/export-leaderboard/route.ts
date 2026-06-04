import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await query(`
    SELECT u.display_name, u.email, lc.total_points, lc.matches_predicted, lc.correct_results
    FROM leaderboard_cache lc JOIN users u ON u.id = lc.user_id
    ORDER BY lc.total_points DESC
  `);

  const csv = [
    ["Nombre","Email","Puntos","Predicciones","Aciertos"],
    ...rows.map(r => [r.display_name, r.email, r.total_points, r.matches_predicted, r.correct_results])
  ].map(r => r.join(",")).join("\n");

  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=leaderboard.csv" }
  });
}
