const fs = require('fs');
const target = 'app/api/admin/results/route.ts';
let c = fs.readFileSync(target, 'utf8');

const lagoCode = `
      // Recalcular LAGO bonus para usuarios cuyo lago_day = hoy (EDT)
      const lagoUsers = await client.query(
        "SELECT user_id FROM special_bets WHERE lago_day = $1",
        [day]
      );
      if (lagoUsers.rows.length > 0) {
        const maxDay = await client.query(
          \`SELECT MAX(pts) AS max_pts FROM (
            SELECT SUM(p.points) AS pts
            FROM predictions p
            JOIN matches m ON m.id = p.match_id
            WHERE (m.match_date AT TIME ZONE 'America/New_York')::date = $1
            AND p.points IS NOT NULL
            GROUP BY p.user_id
          ) daily\`,
          [day]
        );
        const maxPts = Number(maxDay.rows[0]?.max_pts ?? 0);
        await client.query(
          "UPDATE special_bets SET lago_bonus=$1 WHERE lago_day=$2",
          [maxPts, day]
        );
        for (const { user_id } of lagoUsers.rows) {
          const t = await client.query(
            "SELECT COALESCE(SUM(points),0) AS match_total FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
            [user_id]
          );
          const sp = await client.query(
            "SELECT COALESCE(champion_points,0)+COALESCE(scorer_points,0)+COALESCE(lago_bonus,0)+COALESCE(water_points,0) AS special_total FROM special_bets WHERE user_id=$1",
            [user_id]
          );
          const total = Number(t.rows[0].match_total) + (sp.rows[0] ? Number(sp.rows[0].special_total) : 0);
          await client.query(
            "INSERT INTO leaderboard_cache (user_id,total_points,updated_at) VALUES($1,$2,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,updated_at=NOW()",
            [user_id, total]
          );
        }
      }
`;

// Insertar antes del bloque de daily scores
c = c.replace(
  `const snap = await client.query(`,
  lagoCode + `      const snap = await client.query(`
);

fs.writeFileSync(target, c);
console.log('OK');
console.log('LAGO blocks:', (c.match(/Recalcular LAGO/g) || []).length);