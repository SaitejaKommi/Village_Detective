"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMQueue = void 0;
class LLMQueue {
    cooldownMs;
    jobs = [];
    running = false;
    constructor(cooldownMs = 0) {
        this.cooldownMs = cooldownMs;
    }
    enqueue(run, priority = 0) {
        return new Promise((resolve, reject) => {
            const job = { priority, run, resolve, reject };
            this.jobs.push(job);
            this.jobs.sort((a, b) => b.priority - a.priority);
            void this.drain();
        });
    }
    async drain() {
        if (this.running)
            return;
        this.running = true;
        try {
            while (this.jobs.length > 0) {
                const job = this.jobs.shift();
                if (!job)
                    continue;
                try {
                    job.resolve(await job.run());
                }
                catch (error) {
                    job.reject(error);
                }
                if (this.cooldownMs > 0)
                    await new Promise((resolve) => setTimeout(resolve, this.cooldownMs));
            }
        }
        finally {
            this.running = false;
        }
    }
}
exports.LLMQueue = LLMQueue;
//# sourceMappingURL=queue.js.map