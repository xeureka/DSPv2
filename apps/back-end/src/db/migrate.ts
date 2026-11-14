import { migrate } from "drizzle-orm/node-postgres/migrator";

import { db, pool } from "@/db";

try {
	await migrate(db, { migrationsFolder: "./drizzle" });
	console.log("Database migrations applied.");
} finally {
	await pool.end();
}
