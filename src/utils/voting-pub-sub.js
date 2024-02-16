"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.votingPubSub = void 0;
class VotingPubSub {
    channels = {};
    subscribe(pollId, subscriber) {
        if (!this.channels[pollId]) {
            this.channels[pollId] = [];
        }
        this.channels[pollId].push(subscriber);
    }
    publish(pollId, message) {
        if (!this.channels[pollId]) {
            return;
        }
        for (const subscriber of this.channels[pollId]) {
            subscriber(message);
        }
    }
}
exports.votingPubSub = new VotingPubSub();
