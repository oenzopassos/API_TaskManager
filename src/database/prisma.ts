import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient({
    log: process.env.Node_ENV === "production" ? [] : ["query"],
});

