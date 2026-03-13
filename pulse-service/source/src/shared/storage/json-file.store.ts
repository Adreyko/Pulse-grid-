import { access, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export class JsonFileStore<T> {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly seedFactory: () => T,
  ) {}

  read(): Promise<T> {
    return this.enqueue(async () => this.readUnsafe());
  }

  update(updater: (current: T) => T | Promise<T>): Promise<T> {
    return this.enqueue(async () => {
      const current = await this.readUnsafe();
      const next = await updater(structuredClone(current));
      await this.writeUnsafe(next);
      return next;
    });
  }

  private async ensureFile(): Promise<void> {
    await mkdir(dirname(this.filePath), { recursive: true });

    try {
      await access(this.filePath);
    } catch {
      await this.writeUnsafe(this.seedFactory());
    }
  }

  private async readUnsafe(): Promise<T> {
    await this.ensureFile();
    const raw = await readFile(this.filePath, 'utf8');
    return JSON.parse(raw) as T;
  }

  private async writeUnsafe(value: T): Promise<void> {
    const tempFilePath = `${this.filePath}.tmp`;
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(tempFilePath, JSON.stringify(value, null, 2), 'utf8');
    await rename(tempFilePath, this.filePath);
  }

  private enqueue<TResult>(task: () => Promise<TResult>): Promise<TResult> {
    const next = this.queue.then(task, task);
    this.queue = next.then(
      () => undefined,
      () => undefined,
    );
    return next;
  }
}
