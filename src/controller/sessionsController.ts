import z from "zod";
import {Request, Response} from "express"
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
import { authConfig } from "@/configs/auth";

class SessionsController {
    async create(requesst: Request, response: Response) {
        const bodySchema = z.object({
            email: z.email(),
            password: z.string().min(6)
        })

        const {email, password} = bodySchema.parse(requesst.body)

        const user = await prisma.user.findUnique({
            where: {email}
        })

        if(!user) {
            throw new AppError("Email or password invalid");
        }

        const passwordMatched = await compare(password, user.password)

        if(!passwordMatched) {
            throw new AppError("Email or password invalid");
        }

        const {secret, expiresIn} = authConfig.jwt

        const token = sign({role: user.role ?? "member"}, secret, {
            subject: user.id, 
            expiresIn
        })

        const {password: _, ...userWithoutPassword} = user

       return response.status(200).json({token, user: userWithoutPassword})
    }
}

export {SessionsController}