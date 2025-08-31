import { app } from "@/app"
import { prisma } from "@/database/prisma";
import request from "supertest";
import bcrypt from "bcrypt"

describe("TeamsController", () => {
    let userIdAdmin: string;
    let tokenAdmin: string;
    let userIdMember: string;
    let tokenMember: string;
    let teamId: string

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

    })

    afterAll(async () => {
        await prisma.teamMember.deleteMany({ where: { teamId } });
        if(teamId) await prisma.team.delete({ where: { id: teamId } })
        await prisma.teamMember.deleteMany({ where: { userId: userIdAdmin } });
        await prisma.teamMember.deleteMany({ where: { userId: userIdMember } });
        await prisma.user.delete({ where: { id: userIdAdmin } })
        await prisma.user.delete({ where: { id: userIdMember } })
    })

    it("Should create a new Team", async () => {
        const team = await request(app)
            .post('/teams')
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                name: "RH",
                description: "Grupo de RH"
            })
        teamId = team.body.id
        expect(team.status).toBe(201);
        expect(team.body).toHaveProperty("id")
    })

    it("Should updated a team", async () => {
        const response = await request(app)
            .put(`/teams/${teamId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                name: "Recursos Humanos"
            })

        expect(response.status).toBe(200)
    })

    it("Should add member in a team", async () => {
        const response = await request(app)
            .post(`/teams/${teamId}/members`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                user_id: userIdMember
            })

        expect(response.status).toBe(201)
        expect(response.body.message).toBe("User added to team successfully")
    })

    it("Should remove one member in a team", async () => {
        const response = await request(app)
            .delete(`/teams/${teamId}`)
            .set("Authorization", `Bearer ${tokenAdmin}`)
            .send({
                user_id: userIdMember
            })

            expect(response.status).toBe(200)
    })
})