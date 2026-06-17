const fs = require('fs');
const content = fs.readFileSync('app/api/leaderboard/snapshot/route.ts', 'utf8');
const newContent = content.replace(/m\.match_date::date/g, "(m.match_date AT TIME ZONE 'America/New_York')::date");
fs.writeFileSync('app/api/leaderboard/snapshot/route.ts', newContent);
console.log('Reemplazos:', (newContent.match(/AT TIME ZONE/g) || []).length);