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
export async function resetUsers() {
    await db.delete(users);
}
