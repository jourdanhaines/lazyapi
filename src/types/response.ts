export interface ResponseTiming {
    startTime: number;
    endTime: number;
    duration: number;
    dnsLookup?: number;
    tcpConnection?: number;
    firstByte?: number;
}

export interface ResponseEntry {
    id: string;
    requestId: string;
    timestamp: number;
    request: {
        method: string;
        url: string;
        headers: Record<string, string>;
        body?: string;
    };
    response: {
        status: number;
        statusText: string;
        headers: Record<string, string>;
        body: string;
        size: number;
    };
    timing: ResponseTiming;
}

export interface ResponseHistoryFile {
    requestId: string;
    entries: ResponseEntry[];
}
