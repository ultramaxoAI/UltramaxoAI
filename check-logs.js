const { config } = require("dotenv");
config({ path: ".env.local" });
const postgres = require("postgres");

async function checkMessages() {
	const sql = postgres(process.env.POSTGRES_URL);

	try {
		const rows = await sql`
      SELECT id, role, parts, "chatId" 
      FROM "Message_v2" 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `;

		let output = "=== RECENT MESSAGES ===\n";
		for (const row of rows) {
			output += `[${row.role}] message id: ${row.id}\n`;

			let parts;
			try {
				parts =
					typeof row.parts === "string" ? JSON.parse(row.parts) : row.parts;
			} catch (e) {
				parts = row.parts;
			}

			if (Array.isArray(parts)) {
				for (const p of parts) {
					const pStr = JSON.stringify(p);
					output += `  PART: ${pStr.substring(0, 500)}${pStr.length > 500 ? "..." : ""}\n`;
					if (p.type === "tool-call") {
						output += `  TOOL CALL -> ${p.toolName}\n`;
						const argsStr = JSON.stringify(p.args);
						output += `  ARGS: ${argsStr.substring(0, 1000)}${argsStr.length > 1000 ? "..." : ""}\n`;
						output += `  ARGS content string length: ${p.args.content?.length || 0}\n`;
					}
				}
			}
		}

		require("fs").writeFileSync("logs.json", output);
		console.log("Wrote to logs.json");
	} catch (err) {
		console.error(err);
	} finally {
		await sql.end();
	}
}

checkMessages();
