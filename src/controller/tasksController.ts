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
            assignedTo: z.uuid().optional(),
        })


        const { taskId } = paramsSchema.parse(request.params);
        const { assignedTo } = bodySchema.parse(request.body)

        const assignedUserId = assignedTo ?? request.user?.id;

        if (!assignedUserId) {
            throw new AppError("No user provided for assignment");
        }

        const task = await prisma.task.findUnique({
            where: {
                id: taskId
            },
            include: {
                team: {
                    select: {
                        members: true
                    }
                }
            }
        })

        if (!task) {
            throw new AppError("Task not found", 404);
        }

        const isUserInTeam = task.team.members.some(
            (member) => member.userId === assignedUserId
        )

        if (!isUserInTeam) {
            throw new AppError("This user does not belong to this team", 404);
        }

        if (task.status !== 'pending') {
            throw new AppError("This task must be pending");
        }

        if (assignedUserId === request.user?.id) {
            throw new AppError("This task already belongs to you");
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

    async show(request: Request, response: Response) {

        const userId = request.user?.id

        if (!userId) {
            throw new AppError("User not authenticated", 401);
        }
        const showTasks = await prisma.task.findMany({
            where: {
                assignedTo: {
                    id: userId,
                }
            },
            include: {
                team: {
                    select: {
                        name: true,
                        description: true
                    }
                }
            }
        })

        const showTasksWithoutUserId = showTasks.map(({userId, ...rest}) => rest)

        return response.json({
            showTasksWithoutUserId
        })
    }
}

export { TasksController }