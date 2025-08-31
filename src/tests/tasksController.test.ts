import { app } from "@/app";
import { prisma } from "@/database/prisma";
import request from "supertest";
import bcrypt from "bcrypt"
import { title } from "process";

describe("TasksController", () => {
    let userIdAdmin: string;
    let tokenAdmin: string;
    let userIdMember: string;
    let tokenMember: string;
    let teamId: string;
    let taskId: string;

    beforeAll(async () => {
        const hashedPassword = await bcrypt.hash("123456", 8)
        const userAdmin = await prisma.user.create({
            data: {
                name: "User Admin",
                email: "useradmin@example.com",
                password: hashedPassword,
                role: "admin",
            }
        });

        userIdAdmin = userAdmin.id;

        const loginAdmin = await request(app).post("/sessions").send({
            email: "useradmin@example.com",
            password: "123456",
        })

        tokenAdmin = loginAdmin.body.token

        const userMember = await prisma.user.create({
            data: {
                name: "User Member",
                email: "usermember@example.com",
                password: hashedPassword,
            }
        });

        userIdMember = userMember.id;

        const loginMember = await request(app).post("/sessions").send({
            email: "usermember@example.com",
            password: "123456",
        })

        tokenMember = loginMember.body.token

        const teamResponse = await request(app)
            .post("/teams")
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                name: "Team Test",
                description: "Test"
            })

        teamId = teamResponse.body.id

        await request(app)
            .post(`/teams/${teamId}/members`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                user_id: userIdMember
            })
    })

    afterAll(async () => {
        if (taskId) {
            await prisma.taskHistory.deleteMany({ where: { taskId } });
            await prisma.task.delete({ where: { id: taskId } });
        }

        await prisma.teamMember.deleteMany({ where: { teamId } });
        if (teamId) {
            await prisma.team.delete({ where: { id: teamId } });
        }

        await prisma.teamMember.deleteMany({ where: { userId: userIdAdmin } });
        await prisma.teamMember.deleteMany({ where: { userId: userIdMember } });

        if (userIdAdmin) {
            await prisma.user.delete({ where: { id: userIdAdmin } });
        }
        if (userIdMember) {
            await prisma.user.delete({ where: { id: userIdMember } });
        }
    })

    it("Should create a new task", async () => {
        const task = await request(app)
            .post(`/tasks/${teamId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                title: "Task test",
                description: "test",
                priority: "medium",
                assignedToId: userIdAdmin
            })

        taskId = task.body.taskCreated.id

        expect(task.status).toBe(201)
        expect(task.body.taskCreated).toHaveProperty("id")
    })

    it("Should assign the task to a member", async () => {
        const task = await request(app)
            .patch(`/tasks/${taskId}/assign`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                assignedToId: userIdMember
            })

        expect(task.status).toBe(200)
        expect(task.body.message).toBe("Task assigned to a new user")
    })

    it("Should updated the task", async () => {
        const task = await request(app)
            .put(`/tasks/${taskId}`)
            .set("Authorization", `Bearer ${tokenMember}`)
            .send({
                title: "Task Updated"
            })

        expect(task.status).toBe(200)
        expect(task.body.message).toBe("Task updated successfully")
    })

    it("Should not updated status to 'completed'", async () => {
        const taskStatus = await request(app)
            .patch(`/tasks/${taskId}/status`)
            .set("Authorization", `Bearer ${tokenMember}`)
            .send({
                status: 'completed'
            })

        expect(taskStatus.status).toBe(400)
        expect(taskStatus.body.message).toBe("Change status to 'in Progress' before updating to 'completed'")
    })

    it("Should updated status to 'in_progress'", async () => {
        const taskStatus = await request(app)
            .patch(`/tasks/${taskId}/status`)
            .set("Authorization", `Bearer ${tokenMember}`)
            .send({
                status: "in_progress"
            })

        expect(taskStatus.status).toBe(200)
        expect(taskStatus.body.message).toBe("Status updated successfully")
    })

     it("Should updated status to 'completed'", async () => {
        const taskStatus = await request(app)
            .patch(`/tasks/${taskId}/status`)
            .set("Authorization", `Bearer ${tokenMember}`)
            .send({
                status: "completed"
            })

        expect(taskStatus.status).toBe(200)
        expect(taskStatus.body.message).toBe("Status updated successfully")
    })

    it("Should not update status after it is 'completed'", async () => {
        const taskStatus = await request(app)
            .patch(`/tasks/${taskId}/status`)
            .set("Authorization", `Bearer ${tokenMember}`)
            .send({
                status: "pending"
            })

        expect(taskStatus.status).toBe(400)
        expect(taskStatus.body.message).toBe("This Task has already been completed")
    })
    

})