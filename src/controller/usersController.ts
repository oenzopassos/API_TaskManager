import z from "zod";
import {Request, Response} from "express"
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import {hash} from "bcrypt"

class UsersController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().min(3),
            email: z.email(),
            password: z.string().min(6)
        })

        const {name, email, password} = bodySchema.parse(request.body)


        const userAlreadyExists = await prisma.user.findUnique({
            where: {email}
        })

        if(userAlreadyExists) {
            throw new AppError("User already exists")
        }

        const hashedPssword = await hash(password, 8);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPssword
            }
        })

        const {password: _, ...userWithoutPassword} = user

        return response.status(201).json(userWithoutPassword);
    }
}

export {UsersController}