import { prisma } from "@/database/prisma";
import { AppError } from "@/utils/AppError";
import { Request, Response } from "express";
import z from "zod";



class TasksStatusController {
    async update(request: Request, response: Response) {
        const paramsSchema = z.object({
            taskId: z.uuid()
        })
        const bodySchema = z.object({
            status: z.enum(["pending", "in_progress", "completed"])
        })

        const { taskId } = paramsSchema.parse(request.params);
        const { status } = bodySchema.parse(request.body);

        const task = await prisma.task.findFirst({
            where: {
                id: taskId,
                OR: [

                    {
                        team: {
                            members: {
                                some: {
                                    userId: request.user?.id,
                                    user: { role: 'admin' }
                                }
                            }
                        }
                    },
    
                    {
                        assignedToId: request.user?.id
                    }
                ]

            }
        })

        if (!task) {
            throw new AppError("Task not found or user not in team", 404)
        }

        if (task.status === 'completed') {
            throw new AppError("This Task has already been completed");
        }

        if (task.status === 'pending' && status === 'completed') {
            throw new AppError("Change status to 'in Progress' before updating to 'completed'");
        }

        if (task.status === 'in_progress' && status === 'pending') {
            throw new AppError("Once the status has been changed to 'In Progress', it cannot be reverted back to 'Pending'");
        }

        if (task.status === 'in_progress' && status === 'in_progress') {
            throw new AppError("The task is already 'in progress'. The only remaining status option is 'completed'.");
        }

        if (status === 'pending') {
            throw new AppError("Change status to 'in Progress'");
        }


        await prisma.task.update({
            data: {
                status,
                tasksHistory: {
                    create: {
                        oldStatus: task.status,
                        newStatus: status,
                        changedBy: { connect: { id: request.user!.id } }
                    }


                }
            },
            where: {
                id: taskId
            },
        })


        return response.json({
            message: "Status updated successfully"
        })
    }
}

export { TasksStatusController }