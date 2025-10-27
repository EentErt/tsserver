import { verify, hash } from "argon2";
export async function hashPassword(password) {
    const hashedPassword = await hash(password);
    return hashedPassword;
}
export async function checkPasswordHash(password, hash) {
    return await verify(hash, password);
}
