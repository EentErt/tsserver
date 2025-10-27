import { verify, hash } from "argon2";

export async function hashPassword(password: string): Promise<string> {
    const hashedPassword = await hash(password);
    return hashedPassword;
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return await verify(hash, password);
}