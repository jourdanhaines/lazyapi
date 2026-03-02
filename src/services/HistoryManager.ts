import { storageManager } from "./StorageManager";
import type { ResponseEntry, ResponseHistoryFile } from "../types/response";

export class HistoryManager {
    private limit: number;

    constructor(limit = 10) {
        this.limit = limit;
    }

    setLimit(limit: number): void {
        this.limit = limit;
    }

    async load(requestId: string): Promise<ResponseEntry[]> {
        const file = await storageManager.read<ResponseHistoryFile>(`history/${requestId}.json`);
        return file?.entries ?? [];
    }

    async add(requestId: string, entry: ResponseEntry): Promise<void> {
        const entries = await this.load(requestId);
        entries.unshift(entry);
        const capped = entries.slice(0, this.limit);
        const file: ResponseHistoryFile = { requestId, entries: capped };
        await storageManager.write(`history/${requestId}.json`, file);
    }

    async delete(requestId: string): Promise<void> {
        await storageManager.delete(`history/${requestId}.json`);
    }
}

export const historyManager = new HistoryManager();
