require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

(async () => {
  const chatId = process.argv[2];
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  if (chatId) {
    const res = await client.query('select id, role, parts, "createdAt" from "Message_v2" where "chatId" = $1 order by "createdAt" asc', [chatId]);
    console.log(JSON.stringify(res.rows, null, 2));
  } else {
    const res = await client.query('select id, "chatId", role, "createdAt" from "Message_v2" order by "createdAt" desc limit 20');
    console.log(JSON.stringify(res.rows, null, 2));
  }
  await client.end();
})();
