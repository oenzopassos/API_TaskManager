import { app } from "@/app"
import { prisma } from "@/database/prisma";
import request from "supertest"


describe("SessionsController", () => {
    let userId: string;

    afterAll(async () => {
        await prisma.user.delete({ where: { id: userId } })
    })

    it("should authenticate and get access token", async () => {

        const user = await request(app).post("/users").send({
            name: "Teste User",
            email: "testeuser@example.com",
            password: "123456"
        })
        userId = user.body.id;

        const session = await request(app).post("/sessions").send({
            email: "testeuser@example.com",
            password: "123456"
        })

        expect(session.status).toBe(200);
        expect(session.body.token).toEqual(expect.any(String));

    })
})