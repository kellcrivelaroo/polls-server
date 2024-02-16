"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPoll = void 0;
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
async function createPoll(app) {
    app.post('/polls', async (req, res) => {
        const createPollBody = zod_1.z.object({
            title: zod_1.z.string(),
            options: zod_1.z.array(zod_1.z.string())
        });
        const { title, options } = createPollBody.parse(req.body);
        const poll = await prisma_1.prisma.poll.create({
            data: {
                title,
                options: {
                    createMany: {
                        data: options.map((option) => ({
                            title: option,
                        }))
                    }
                }
            }
        });
        return res.status(201).send({ pollId: poll.id });
    });
}
exports.createPoll = createPoll;
