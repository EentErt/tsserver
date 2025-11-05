import { db } from "../index.js";
import { NewRefreshToken, refreshTokens } from "../schemas/schema.js";
import { eq } from "drizzle-orm";

export async function createRefreshToken(token: NewRefreshToken) {
    const [result] = await db.insert(refreshTokens).values(token).returning();
    return result;
}

export async function getRefreshToken(token: string) {
    const [result] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return result;
}

export async function revokeRefreshToken(token: string) {
    const [result] = await db.update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.token, token));
}