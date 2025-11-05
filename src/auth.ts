import { verify, hash } from "argon2";
import jwt, { JwtPayload } from "jsonwebtoken";
import { UnauthorizedError } from "./errors.js";
import { Request } from "express";
import { randomBytes } from "node:crypto";


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
    const token = jwt.sign(load, secret)
    return token;
}

export function validateJWT(tokenString: string, secret: string): string {
    try {
        const token = jwt.verify(tokenString, secret);
        return token.sub as string;
    } catch (error) {
        throw new UnauthorizedError("Invalid access token");  
    }
}

export function getBearerToken(req: Request): string {
    if (!req.headers.authorization) {
        throw new UnauthorizedError("No authorization");
    }

    const token = req.headers.authorization as string;
    if (!token) {
        throw new UnauthorizedError("No authorization token found");
    }

    return token.split(" ")[1];
}

export function makeRefreshToken(): string {
    return randomBytes(32).toString("hex");
}