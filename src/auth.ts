import { verify, hash } from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";


export async function hashPassword(password: string): Promise<string> {
    const hashedPassword = await hash(password);
    return hashedPassword;
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean> {
    return await verify(hash, password);
}

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
    const load = {
        iss: "chirpy",
        sub: userID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
    }
    const token = jwt.sign(load, secret, {expiresIn: expiresIn })
    return token;
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const token = jwt.verify(tokenString, secret);
        return token.sub as string;
    } catch (error) {
        throw error;
    }
}