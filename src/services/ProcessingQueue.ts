export class ProcessingQueue {
    private _queue: Array<() => void> = [];
    private _active = 0;
    private _concurrency: number;
    private _runNextScheduled = false;

    constructor(concurrency = 1) {
        this._concurrency = Math.max(1, Math.floor(concurrency));
    }

    public setConcurrency(limit: number) {
        this._concurrency = Math.max(1, Math.floor(limit));
        this._scheduleRunNext();
    }

    public enqueue<T>(task: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const job = () => {
                this._active++;
                console.log(`[Queue] Starting task (active: ${this._active}/${this._concurrency}, queued: ${this._queue.length})`);
                task()
                    .then((res) => {
                        console.log(`[Queue] Task completed (active: ${this._active - 1}/${this._concurrency}, queued: ${this._queue.length})`);
                        resolve(res);
                    })
                    .catch((err) => {
                        console.error(`[Queue] Task failed:`, err);
                        reject(err);
                    })
                    .finally(() => {
                        this._active--;
                        this._scheduleRunNext();
                    });
            };

            this._queue.push(job);
            this._scheduleRunNext();
        });
    }

    private _scheduleRunNext() {
        if (this._runNextScheduled) {
            return;
        }
        this._runNextScheduled = true;
        setTimeout(() => {
            this._runNextScheduled = false;
            this._runNext();
        }, 0);
    }

    private _runNext() {
        while (this._active < this._concurrency && this._queue.length > 0) {
            const job = this._queue.shift()!;
            job();
        }
    }
}

