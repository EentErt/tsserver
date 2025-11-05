import { db } from "../index.js";
import { NewUser, refreshTokens, users } from "../schemas/schema.js";
import { eq } from "drizzle-orm";

export async function createUser(user: NewUser) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}

export async function getUserByEmail(email: string) {
    const [result] = await db.select().from(users).where(eq(users.email, email));
    return result;
}

export async function getUserFromRefreshToken(token: string) {
    const [result] = await db.select().from(users)
        .innerJoin(refreshTokens, eq(refreshTokens.userId, users.id))
        .where(eq(refreshTokens.token, token));
    return result.users;
}

export async function updateUser(id: string, user: NewUser) {
    const [result] = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result;
}

export async function upgradeUser(id: string) {
    await db.update(users).set({ isChirpyRed: true }).where(eq(users.id, id));
}

export async function resetUsers() {
    await db.delete(users);
}