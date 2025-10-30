import { verify, hash } from "argon2";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "./errors.js";
export async function hashPassword(password) {
    const hashedPassword = await hash(password);
    return hashedPassword;
}
export async function checkPasswordHash(password, hash) {
    return await verify(hash, password);
}
export function makeJWT(userID, expiresIn, secret) {
    const load = {
        iss: "chirpy",
        sub: userID,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expiresIn,
    };
    const token = jwt.sign(load, secret);
    return token;
}
export function validateJWT(tokenString, secret) {
    try {
        const token = jwt.verify(tokenString, secret);
        return token.sub;
    }
    catch (error) {
        throw error;
    }
}
export function getBearerToken(req) {
    if (!req.headers.authorization) {
        throw new UnauthorizedError("No authorization");
    }
    const token = req.headers.authorization;
    if (!token) {
        throw new UnauthorizedError("No authorization token found");
    }
    return token.split(" ")[1];
}
