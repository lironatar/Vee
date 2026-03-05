const Database = require('better-sqlite3');
const db = new Database('./database.sqlite');
const items = db.prepare(`SELECT id, content, target_date, checklist_id FROM checklist_items WHERE content IN ('A', 'AT', 'T')`).all();
console.log(JSON.stringify(items, null, 2));
db.close();
