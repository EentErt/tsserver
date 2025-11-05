import { db } from "../index.js";
import { refreshTokens, users } from "../schemas/schema.js";
import { eq } from "drizzle-orm";
export async function createUser(user) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function getUserByEmail(email) {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}
export async function getUserFromRefreshToken(token) {
    const [result] = await db.select().from(users)
        .innerJoin(refreshTokens, eq(refreshTokens.userId, users.id))
        .where(eq(refreshTokens.token, token));
    return result.users;
}
export async function updateUser(id, user) {
    const [result] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result;
}
export async function upgradeUser(id) {
    await db.update(users).set({ isChirpyRed: true }).where(eq(users.id, id));
}
export async function resetUsers() {
    await db.delete(users);
}
