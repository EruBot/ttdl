import { MAX_CONCURRENCY } from "../config/env.js";

class AsyncQueue {
  constructor(concurrency) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this.running < this.concurrency && this.queue.length > 0) {
      const item = this.queue.shift();
      this.running++;

      Promise.resolve()
        .then(() => item.task())
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.running--;
          this._drain();
        });
    }
  }
}

export const queue = new AsyncQueue(MAX_CONCURRENCY);