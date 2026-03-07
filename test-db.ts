import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user, account } from "./lib/db/schema";
import dotenv from "dotenv";

dotenv.config();

const client = postgres(process.env.POSTGRES_URL!, { prepare: false, ssl: "require" });
const db = drizzle(client);

async function run() {
  const users = await db.select().from(user);
  const accounts = await db.select().from(account);
  console.log("USERS:", users.map((u) => ({ id: u.id, email: u.email, name: u.name })));
  console.log("ACCOUNTS:", accounts.map((a) => ({ provider: a.provider, providerAccountId: a.providerAccountId, userId: a.userId })));
  process.exit(0);
}

run();
