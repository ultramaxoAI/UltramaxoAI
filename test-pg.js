const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const resUser = await client.query('SELECT id, email, name FROM "user"');
  const resAccount = await client.query('SELECT provider, "providerAccountId", "userId" FROM "account"');
  console.log("DB RESULT:");
  console.dir({ 
    users: resUser.rows, 
    accounts: resAccount.rows 
  }, { depth: null });
  await client.end();
}

run().catch(console.error);
