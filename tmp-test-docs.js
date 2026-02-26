const { config } = require("dotenv");
const postgres = require("postgres");

config({ path: ".env.local" });

async function main() {
	const sql = postgres(process.env.POSTGRES_URL, { ssl: "require" });
	try {
		const msgs = await sql`
            SELECT id, role, parts, "createdAt", "chatId"
            FROM "Message_v2"
            WHERE role = 'assistant' AND parts::text LIKE '%createDocument%'
            ORDER BY "createdAt" DESC
            LIMIT 5;
        `;

		console.log("=== RECENT AI MESSAGES WITH DOCUMENTS ===");
		msgs.forEach((m) => {
			console.log(`\nMessage ID: ${m.id} | Chat: ${m.chatId}`);
			m.parts.forEach((p, idx) => {
				if (p.type === "tool-createDocument") {
					console.log(`  Part ${idx} [${p.type}] State:`, p.state);
					console.log(`  Args Title:`, p.input?.title);
					console.log(`  Args Content Length:`, p.input?.content?.length);
					console.log(`  Output:`, p.output);
				} else if (p.type === "tool-updateDocument") {
					console.log(`  Part ${idx} [${p.type}] State:`, p.state);
					console.log(`  Args Description:`, p.input?.description);
					console.log(`  Args Content Length:`, p.input?.content?.length);
					console.log(`  Output:`, p.output);
				}
			});
		});
	} catch (e) {
		console.error(e);
	} finally {
		await sql.end();
	}
}
main();
