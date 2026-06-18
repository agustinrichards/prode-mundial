const fs = require('fs');
const target = 'app/api/admin/results/route.ts';
let c = fs.readFileSync(target, 'utf8');

// Buscar el bloque donde se actualiza leaderboard_cache para usuarios del partido
// y agregar la suma de special_points
c = c.replace(
  `const t = await client.query(
        "SELECT COALESCE(SUM(points),0) AS total, COUNT(*) FILTER (WHERE points IS NOT NULL) AS predicted, COUNT(*) FILTER (WHERE points>0) AS correct FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
        [user_id]
      );
      const { total, predicted, correct } = t.rows[0];

      await client.query(
        "INSERT INTO leaderboard_cache (user_id,total_points,matches_predicted,correct_results,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,matches_predicted=$3,correct_results=$4,updated_at=NOW()",
        [user_id, total, predicted, correct]
      );`,
  `const t = await client.query(
        "SELECT COALESCE(SUM(points),0) AS total, COUNT(*) FILTER (WHERE points IS NOT NULL) AS predicted, COUNT(*) FILTER (WHERE points>0) AS correct FROM predictions WHERE user_id=$1 AND points IS NOT NULL",
        [user_id]
      );
      const { total, predicted, correct } = t.rows[0];
      const spRes = await client.query(
        "SELECT COALESCE(champion_points,0)+COALESCE(scorer_points,0)+COALESCE(lago_bonus,0)+COALESCE(water_points,0) AS sp FROM special_bets WHERE user_id=$1",
        [user_id]
      );
      const specialPts = spRes.rows[0] ? Number(spRes.rows[0].sp) : 0;
      const totalWithSpecials = Number(total) + specialPts;

      await client.query(
        "INSERT INTO leaderboard_cache (user_id,total_points,matches_predicted,correct_results,updated_at) VALUES($1,$2,$3,$4,NOW()) ON CONFLICT(user_id) DO UPDATE SET total_points=$2,matches_predicted=$3,correct_results=$4,updated_at=NOW()",
        [user_id, totalWithSpecials, predicted, correct]
      );`
);

fs.writeFileSync(target, c);
console.log('OK');
console.log('specialPts blocks:', (c.match(/specialPts/g) || []).length);