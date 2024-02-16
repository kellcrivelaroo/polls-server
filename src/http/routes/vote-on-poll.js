"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.voteOnPoll = void 0;
const node_crypto_1 = require("node:crypto");
const prisma_1 = require("../../lib/prisma");
const zod_1 = require("zod");
const redis_1 = require("../../lib/redis");
const voting_pub_sub_1 = require("../../utils/voting-pub-sub");
async function voteOnPoll(app) {
    app.post('/polls/:pollId/votes', async (req, res) => {
        const voteOnPollParams = zod_1.z.object({
            pollId: zod_1.z.string().uuid(),
        });
        const voteOnPollBody = zod_1.z.object({
            pollOptionId: zod_1.z.string().uuid(),
        });
        const { pollId } = voteOnPollParams.parse(req.params);
        const { pollOptionId } = voteOnPollBody.parse(req.body);
        let { sessionId } = req.cookies;
        if (sessionId) {
            const userPreviousVoteOnPoll = await prisma_1.prisma.vote.findUnique({
                where: {
                    sessionId_pollId: {
                        sessionId,
                        pollId,
                    }
                }
            });
            if (userPreviousVoteOnPoll && userPreviousVoteOnPoll.pollOptionId !== pollOptionId) {
                await prisma_1.prisma.vote.delete({
                    where: {
                        id: userPreviousVoteOnPoll.id
                    }
                });
                const votes = await redis_1.redis.zincrby(pollId, -1, userPreviousVoteOnPoll.pollOptionId);
                voting_pub_sub_1.votingPubSub.publish(pollId, {
                    pollOptionId: userPreviousVoteOnPoll.pollOptionId,
                    votes: Number(votes),
                });
            }
            else if (userPreviousVoteOnPoll) {
                return res.status(400).send({ message: 'You already voted on this poll.' });
            }
        }
        if (!sessionId) {
            sessionId = (0, node_crypto_1.randomUUID)();
            res.setCookie('sessionId', sessionId, {
                path: '/',
                maxAge: 60 * 60 * 24 * 30,
                signed: true,
                httpOnly: true,
            });
        }
        const vote = await prisma_1.prisma.vote.create({
            data: {
                sessionId,
                pollId,
                pollOptionId,
            }
        });
        const votes = await redis_1.redis.zincrby(pollId, 1, pollOptionId);
        voting_pub_sub_1.votingPubSub.publish(pollId, {
            pollOptionId,
            votes: Number(votes),
        });
        return res.status(201).send({ vote });
    });
}
exports.voteOnPoll = voteOnPoll;
