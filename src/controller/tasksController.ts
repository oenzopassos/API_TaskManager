import z from "zod";
import { Request, Response } from "express"
import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";


class TasksController {
    async create(request: Request, response: Response) {
        const paramsSchema = z.object({
            id: z.uuid()
        })
        const bodySchema = z.object({
            title: z.string().min(3),
            description: z.string().optional(),
            priority: z.enum(['high', 'medium', 'low']),
        })

        const { id } = paramsSchema.parse(request.params)
        const { title, description, priority } = bodySchema.parse(request.body);

        const team = await prisma.team.findUnique({
            where: {
                id
            }
        })

        if (!team) {
            throw new AppError("Team not found", 404)
        }

        const taskCreated = await prisma.task.create({
            data: {
                title,
                description,
                priority,
                assignedTo: {
                    connect: { id: request.user?.id }
                },
                team: {
                    connect: { id }
                }
            }
        })

        return response.status(201).json({
            message: "Task created with success",
            taskCreated
        })
    }

    async updateAssign(request: Request, response: Response) {
        const paramsSchema = z.object({
            taskId: z.uuid()
        })

        const bodySchema = z.object({
            assignedToId: z.uuid().optional(),
        })


        const { taskId } = paramsSchema.parse(request.params);
        const { assignedToId } = bodySchema.parse(request.body)

        const assignedUserId = assignedToId ?? request.user?.id;

        if (!assignedUserId) {
            throw new AppError("No user provided for assignment");
        }

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                team: {
                    members: {
                        some: {
                            userId: assignedUserId
                        }
                    }
                }
            }
        })

        if (!task) {
            throw new AppError("Task not found  or user not in team", 404);
        }


        if (task.status !== 'pending') {
            throw new AppError("This task must be pending");
        }

        if (assignedUserId === task.assignedToId) {
            throw new AppError("This task is already assigned to this user")
        }

        await prisma.task.update({
            where: {
                id: taskId
            },
            data: {
                assignedTo: { connect: { id: assignedUserId } }
            }

        })

        return response.json({
            message: "Task assigned to a new user"
        })
    }

    async update(request: Request, response: Response) {
        const paramsSchema = z.object({
            taskId: z.uuid()
        })

        const bodySchema = z.object({
            title: z.string().min(2).optional(),
            description: z.string().optional(),
            priority: z.enum(['high', 'medium', 'low']).optional()
        })

        const { taskId } = paramsSchema.parse(request.params)
        const { title, description, priority } = bodySchema.parse(request.body)
        const userId = request.user?.id;

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                assignedToId: userId
            },


        })


        if (!task) {
            throw new AppError("This task does not belong to you or user not in team")
        }

        if (task.status === 'completed') {
            throw new AppError("This task can only be updated if its status is not set to 'completed'")
        }

        const taskUpdated = await prisma.task.update({
            where: {
                id: taskId
            },
            data: {
                title,
                description,
                priority
            }
        })

        return response.json({
            message: "Task updated successfully",
            taskUpdated
        })
    }

    async showTeamTasks(request: Request, response: Response) {
        const paramsSchema = z.object({
            teamId: z.uuid()
        })

        const { teamId } = paramsSchema.parse(request.params)
        const userId = request.user?.id;


        const isMember = await prisma.teamMember.findFirst({
            where: {
                teamId,
                userId
            }
        });

        if (!isMember) {
            throw new AppError("You are not a member of this team", 403);
        }


        const tasks = await prisma.task.findMany({
            where: { teamId },
            include: {
                assignedTo: { select: { id: true, name: true } },
                team: { select: { name: true, description: true } }
            }
        });

        return response.json({ tasks });
    }


    async showMyTasks(request: Request, response: Response) {
        const userId = request.user?.id;

        if(!userId) {
            throw new AppError("User not authenticated")
        }

        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: userId, 
                
            },
            include: {
                assignedTo: {
                    select: {
                        name: true
                    }
                },
                team: {
                    select: {
                        name: true,
                        description: true
                    }
                }
            }
        })

        return response.json({
            tasks
        })
    }
}

export { TasksController }