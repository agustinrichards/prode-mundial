import { requireAuth } from "@/lib/auth/session";
import { query, queryOne } from "@/lib/db";
import { SpecialBetsClient } from "@/components/dashboard/special-bets-client";
import { LagoSelector } from "@/components/dashboard/lago-selector";
import { WaterBetClient } from "@/components/dashboard/water-bet-client";
import { redirect } from "next/navigation";

const TEAMS = ["Argentina","Brasil","Francia","España","Alemania","Portugal","Países Bajos","Inglaterra","Bélgica","Uruguay","México","Canadá","Estados Unidos","Marruecos","Senegal","Japón","Corea del Sur","Croacia","Colombia","Ecuador","Suiza","Austria","Türkiye","Noruega","Suecia","Australia","Costa de Marfil","Sudáfrica","Ghana","Qatar","Bosnia y Herzegovina","Haití","Escocia","Paraguay","Curazao","Túnez","Egipto","Irán","Cabo Verde","Arabia Saudita","Iraq","Argelia","Jordania","RD Congo","Uzbekistán","Panamá","Nueva Zelanda"].sort();

function toDateString(val: any): string {
  if (!val) return "";
  if (typeof val === "string") return val.substring(0, 10);
  if (val instanceof Date) return val.toISOString().substring(0, 10);
  return String(val).substring(0, 10);
}

export default async function EspecialesPage() {
  const session = await requireAuth();
  const user = session.user as any;
  if (user.isAdmin) redirect("/admin/matches");
  const userId = user.id;

  const specialBets = await queryOne("SELECT * FROM special_bets WHERE user_id=$1", [userId]);

  // Cierre basado en betting_periods de fecha_1
  const period = await queryOne("SELECT is_open FROM betting_periods WHERE date_label='fecha_1'");
  const closed = period ? !period.is_open : true;

  // Todos los días del mundial con partidos (no solo grupos)
  const allMatchDays = await query("SELECT DISTINCT (match_date AT TIME ZONE 'America/Argentina/Buenos_Aires')::date AS d FROM matches ORDER BY d ASC");
  const groupMatchDays = allMatchDays
    .map((m: any) => toDateString(m.d))
    .filter((d: string) => Boolean(d) && d.length === 10 && !isNaN(new Date(d + "T12:00:00").getTime()));

  const waterUpdates = await query("SELECT * FROM water_updates ORDER BY week_number ASC");
  const allWaterBets = await query(`
    SELECT sb.water_installations, u.display_name
    FROM special_bets sb JOIN users u ON u.id=sb.user_id
    WHERE sb.water_installations IS NOT NULL
    ORDER BY u.display_name ASC
  `);

  const lagoDay = specialBets?.lago_day ? toDateString(specialBets.lago_day) : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-display">APUESTAS ESPECIALES</h1>
        <p className="text-muted-foreground mt-1">Se cierran junto con la Fecha 1 de grupos</p>
      </div>
      <SpecialBetsClient userId={userId} initialBets={specialBets} teams={TEAMS} closed={closed} closeDate={null} />
      <LagoSelector userId={userId} currentLagoDay={lagoDay} groupMatchDays={groupMatchDays} isLocked={closed} />
      <WaterBetClient userId={userId} currentBet={specialBets?.water_installations ?? null} closed={closed} updates={waterUpdates} allBets={allWaterBets} />
    </div>
  );
}