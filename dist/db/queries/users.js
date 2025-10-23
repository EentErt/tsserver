import { db } from "../index.js";
import { users } from "../schemas/schema.js";
export async function createUser(user) {
    const [result] = await db
        .insert(users)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
export async function resetUsers() {
    await db.delete(users);
}
