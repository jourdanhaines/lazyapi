export interface FuzzyMatch {
    name: string;
    score: number;
    matchedIndices: number[];
}

export function fuzzyMatch(query: string, candidate: string): FuzzyMatch | null {
    const queryLower = query.toLowerCase();
    const candidateLower = candidate.toLowerCase();

    const matchedIndices: number[] = [];
    let queryIndex = 0;

    for (let index = 0; index < candidateLower.length && queryIndex < queryLower.length; index++) {
        if (candidateLower[index] === queryLower[queryIndex]) {
            matchedIndices.push(index);
            queryIndex++;
        }
    }

    if (queryIndex < queryLower.length) return null;

    let score = 0;

    if (candidateLower.startsWith(queryLower)) score += 100;

    for (let index = 1; index < matchedIndices.length; index++) {
        if (matchedIndices[index] === matchedIndices[index - 1] + 1) score += 10;
    }

    for (const idx of matchedIndices) {
        if (idx === 0 || candidate[idx - 1] === '_') score += 5;
    }

    score -= candidate.length;

    return { name: candidate, score, matchedIndices };
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
