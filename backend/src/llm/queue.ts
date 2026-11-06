type Job<T> = {
  priority: number
  run: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: unknown) => void
}

export class LLMQueue {
  private readonly jobs: Job<unknown>[] = []
  private running = false

  constructor(private readonly cooldownMs = 0) {}

  enqueue<T>(run: () => Promise<T>, priority = 0): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const job: Job<T> = { priority, run, resolve, reject }
      this.jobs.push(job as Job<unknown>)
      this.jobs.sort((a, b) => b.priority - a.priority)
      void this.drain()
    })
  }

  private async drain(): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      while (this.jobs.length > 0) {
        const job = this.jobs.shift()
        if (!job) continue
        try {
          job.resolve(await job.run())
        } catch (error) {
          job.reject(error)
        }
        if (this.cooldownMs > 0) await new Promise((resolve) => setTimeout(resolve, this.cooldownMs))
      }
    } finally {
      this.running = false
    }
  }
}
