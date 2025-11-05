import { db } from "../index.js";
import { refreshTokens } from "../schemas/schema.js";
import { eq } from "drizzle-orm";
export async function createRefreshToken(token) {
    const [result] = await db.insert(refreshTokens).values(token).returning();
    return result;
}
export async function getRefreshToken(token) {
    const [result] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return result;
}
export async function revokeRefreshToken(token) {
    const [result] = await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, token));
}
