import chalk from "chalk";

export interface Token {
    text: string;
    color?: "cyan" | "green" | "yellow" | "magenta" | "gray" | "variable";
}

const COLOR_FNS = {
    cyan: chalk.cyan,
    green: chalk.green,
    yellow: chalk.yellow,
    magenta: chalk.magenta,
    gray: chalk.gray,
    variable: chalk.hex('#ff79c6').bold,
} as const;

export function tokenizeJsonLine(line: string): Token[] {
    const tokens: Token[] = [];
    let remaining = line;

    while (remaining.length > 0) {
        let match: RegExpMatchArray | null;

        // Variable reference {{...}}
        match = remaining.match(/^\{\{[^}]+\}\}/);
        if (match) {
            tokens.push({ text: match[0], color: "variable" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // String — check if key (followed by colon) or value
        match = remaining.match(/^"(?:[^"\\]|\\.)*"/);
        if (match) {
            const afterMatch = remaining.slice(match[0].length);
            const isKey = /^\s*:/.test(afterMatch);
            tokens.push({ text: match[0], color: isKey ? "cyan" : "green" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Unterminated string (user is mid-typing)
        match = remaining.match(/^"(?:[^"\\]|\\.)*$/);
        if (match) {
            tokens.push({ text: match[0], color: "green" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Number
        match = remaining.match(/^-?\d+\.?\d*([eE][+-]?\d+)?/);
        if (match) {
            tokens.push({ text: match[0], color: "yellow" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Boolean
        match = remaining.match(/^(true|false)/);
        if (match) {
            tokens.push({ text: match[0], color: "magenta" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Null
        match = remaining.match(/^null/);
        if (match) {
            tokens.push({ text: match[0], color: "gray" });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Whitespace and structural characters — no color
        match = remaining.match(/^[\s,:[\]{}]+/);
        if (match) {
            tokens.push({ text: match[0] });
            remaining = remaining.slice(match[0].length);
            continue;
        }

        // Any other single character
        tokens.push({ text: remaining[0] });
        remaining = remaining.slice(1);
    }

    return tokens;
}

export function highlightTokens(tokens: Token[]): string {
    let result = "";
    for (const token of tokens) {
        const colorFn = token.color ? COLOR_FNS[token.color] : undefined;
        result += colorFn ? colorFn(token.text) : token.text;
    }
    return result;
}

export function highlightTokensWithCursor(
    line: string,
    tokens: Token[],
    cursorCol: number | null,
): string {
    if (line.length === 0) {
        return cursorCol !== null ? chalk.inverse(" ") : " ";
    }

    let result = "";
    let charIndex = 0;

    for (const token of tokens) {
        const colorFn = token.color ? COLOR_FNS[token.color] : undefined;

        for (const char of token.text) {
            const isCursor = cursorCol !== null && charIndex === cursorCol;
            if (isCursor) {
                result += colorFn ? chalk.inverse(colorFn(char)) : chalk.inverse(char);
            } else {
                result += colorFn ? colorFn(char) : char;
            }
            charIndex++;
        }
    }

    if (cursorCol !== null && cursorCol >= charIndex) {
        result += chalk.inverse(" ");
    }

    return result;
}

export function highlightVariables(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match) => COLOR_FNS.variable(match));
}
