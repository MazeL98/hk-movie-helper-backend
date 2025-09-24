import jwt from "jsonwebtoken";

import { verifyAccessToken } from "../libs/jwt";

export default async function authMiddleware(ctx: any, next: any) {
    const authHeader = ctx.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        ctx.throw(401, "Not authenticated");
    }

    try {
        const payload = verifyAccessToken(token);
        ctx.state.user = payload; // 保存解码后的用户信息
        return next();
    } catch (err) {
        ctx.throw(401, "Invalid token");
    }
}
