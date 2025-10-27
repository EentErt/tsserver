import { db } from "../index.js";
import { chirps } from "../schemas/schema.js";
import { eq } from "drizzle-orm";
export async function createChirp(chirp) {
    const [result] = await db.insert(chirps).values(chirp).returning();
    return result;
}
export async function getChirpById(id) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
    return result;
}
export async function getChirps() {
    const result = await db.select().from(chirps);
    return result;
}
