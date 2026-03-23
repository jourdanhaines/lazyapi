export interface FuzzyMatch {
    name: string;
    score: number;
    matchedIndices: number[];
}

function greedyMatch(queryLower: string, candidateLower: string, startFrom: number): number[] | null {
    const indices: number[] = [];
    let queryIndex = 0;

    for (let index = startFrom; index < candidateLower.length && queryIndex < queryLower.length; index++) {
        if (candidateLower[index] === queryLower[queryIndex]) {
            indices.push(index);
            queryIndex++;
        }
    }

    return queryIndex === queryLower.length ? indices : null;
}

function scoreIndices(indices: number[], candidate: string): number {
    let score = 0;

    for (let index = 1; index < indices.length; index++) {
        if (indices[index] === indices[index - 1] + 1) score += 10;
    }

    for (const idx of indices) {
        if (idx === 0 || candidate[idx - 1] === '_') score += 5;
    }

    return score;
}

export function fuzzyMatch(query: string, candidate: string): FuzzyMatch | null {
    const queryLower = query.toLowerCase();
    const candidateLower = candidate.toLowerCase();

    let bestIndices: number[] | null = null;
    let bestScore = -Infinity;

    for (let start = 0; start <= candidateLower.length - queryLower.length; start++) {
        if (candidateLower[start] !== queryLower[0]) continue;

        const indices = greedyMatch(queryLower, candidateLower, start);
        if (!indices) continue;

        const score = scoreIndices(indices, candidate);
        if (score > bestScore) {
            bestScore = score;
            bestIndices = indices;
        }
    }

    if (!bestIndices) return null;

    let score = bestScore;

    if (candidateLower.startsWith(queryLower)) score += 100;

    score -= candidate.length;

    return { name: candidate, score, matchedIndices: bestIndices };
}

export function fuzzyFilter(query: string, candidates: string[]): FuzzyMatch[] {
    if (!query) {
        return candidates.map(name => ({ name, score: 0, matchedIndices: [] }));
    }

    const matches = candidates
        .map(candidate => fuzzyMatch(query, candidate))
        .filter((match): match is FuzzyMatch => match !== null);

    matches.sort((a, b) => b.score - a.score);

    return matches;
}
