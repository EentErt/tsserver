import { db } from "../index.js";
import { NewChirp, chirps } from "../schemas/schema.js";
import { eq } from "drizzle-orm";

export async function createChirp(chirp: NewChirp) {
    const [result] = await db.insert(chirps).values(chirp).returning();
    return result;
}

export async function getChirpById(id: string) {
    const [result] = await db.select().from(chirps).where(eq(chirps.id, id));
    return result;
}

export async function getChirps() {
    const result = await db.select().from(chirps);
    return result;
}