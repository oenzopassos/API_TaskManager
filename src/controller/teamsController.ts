import z from "zod";
import { Request, Response } from "express"
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";


class TeamsController {
    async create(request: Request, response: Response) {
        const bodySchema = z.object({
            name: z.string().min(2),
            description: z.string().optional(),
        })

        const { name, description } = bodySchema.parse(request.body);

        const team = await prisma.team.create({
            data: {
                name,
                description,
                members: {
                    create: {
                        userId: request.user!.id,
                    }
                }
            },
            include: {
                members: true
            }
        })

        return response.status(201).json(team)

    }

    async updateTeam(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.uuid()
        })

        const bodySchema = z.object({
            name: z.string().min(2).optional(),
            description: z.string().optional()
        })
        const { id } = paramsSchema.parse(request.params)
        const { name, description } = bodySchema.parse(request.body)

        const team = await prisma.team.findUnique({
            where: { id }
        })

        if (!team) {
            throw new AppError("Team not found");
        }

        const teamUpdated = await prisma.team.update({
            where: { id: team.id },
            data: {
                name: name ?? team.name,
                description: description ?? team.description
            }
        })

        return response.json({
            teamUpdated
        })
    }

    async addMember(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.uuid()
        })
        const bodySchema = z.object({
            user_id: z.uuid()
        })

        const { id } = paramsSchema.parse(request.params)
        const { user_id } = bodySchema.parse(request.body)

        const team = await prisma.team.findUnique({
            where: { id }
        })

        if (!team) {
            throw new AppError("Team not found", 404)
        }

        const userAlreadyExistsInTeam = await prisma.teamMember.findFirst({
            where: {
                teamId: id,
                userId: user_id,
            }
        })

        if (userAlreadyExistsInTeam) {
            throw new AppError("User already in this team")
        }


        const member = await prisma.teamMember.create({
            data: {
                teamId: id,
                userId: user_id
            },
            include: {
                team: true,
            }
        })


        return response.status(201).json({
            message: "User added to team successfully",
            member
        })
    }

    async myTeams(request: Request, response: Response) {
        const user_id = request.user?.id

        const teams = await prisma.teamMember.findMany({
            where: {
                userId: user_id
            },
            include: {
                team: true
            }
        })

        return response.json({
            teams: teams.map(tm => tm.team)
        })
    }


    async removeMember(request: Request, response: Response) {
        const paramsSchema = z.object({
            teamId: z.uuid()
        })
        const bodySchema = z.object({
            user_id: z.uuid()
        })

        const { teamId } = paramsSchema.parse(request.params)
        const { user_id } = bodySchema.parse(request.body)

        const team = await prisma.team.findUnique({
            where: { id: teamId }
        })

        if (!team) {
            throw new AppError("Team not found", 404)
        }

        const userAlreadyExistsInTeam = await prisma.teamMember.findFirst({
            where: {
                teamId,
                userId: user_id,
            }
        })

        if (!userAlreadyExistsInTeam) {
            throw new AppError("User not found in this team")
        }

        const tasks = await prisma.task.findMany({
            where: {
                teamId,
                assignedToId: userAlreadyExistsInTeam.userId,
            }
        })

        if (tasks.length > 0) {
            await prisma.task.updateMany({
                where: {
                    teamId,
                    assignedToId: userAlreadyExistsInTeam.userId
                },
                data: {
                    assignedToId: request.user?.id
                }
            })
        }


        await prisma.teamMember.delete({
            where: {
                userId_teamId: {
                    userId: user_id,
                    teamId
                }
            }
        })

        return response.json({
            message: "User deleted"
        })
    }
}

export { TeamsController }