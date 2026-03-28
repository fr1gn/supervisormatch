import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { DatabaseSchema } from './types';

export class DataStore {
  private readonly dbFilePath = join(process.cwd(), 'data', 'db.json');
  private writeQueue: Promise<unknown> = Promise.resolve();

  async ensureDbFile(): Promise<void> {
    const folder = dirname(this.dbFilePath);
    await mkdir(folder, { recursive: true });

    try {
      await readFile(this.dbFilePath, 'utf8');
    } catch {
      const fallback: DatabaseSchema = {
        users: [],
        supervisors: [],
        requests: [],
      };
      await this.write(fallback);
    }
  }

  async read(): Promise<DatabaseSchema> {
    await this.ensureDbFile();
    const raw = await readFile(this.dbFilePath, 'utf8');
    return JSON.parse(raw) as DatabaseSchema;
  }

  async write(db: DatabaseSchema): Promise<void> {
    await writeFile(this.dbFilePath, JSON.stringify(db, null, 2), 'utf8');
  }

  async mutate<T>(mutator: (db: DatabaseSchema) => T | Promise<T>): Promise<T> {
    const operation = this.writeQueue.then(async () => {
      const db = await this.read();
      const mutableDb = structuredClone(db) as DatabaseSchema;
      const result = await mutator(mutableDb);
      await this.write(mutableDb);
      return result;
    });

    this.writeQueue = operation.then(
      () => undefined,
      () => undefined,
    );

    return operation;
  }
}
