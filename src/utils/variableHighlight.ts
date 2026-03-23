import chalk from "chalk";

export interface VariableToken {
    text: string;
    type: 'text' | 'variable';
    variableName?: string;
    isValid?: boolean;
}

export interface VariableCursorInfo {
    partialName: string;
    startOffset: number;
    endOffset: number;
}

const VAR_PATTERN = /\{\{([^}]*)\}\}/g;

export function tokenizeVariables(text: string): VariableToken[] {
    const tokens: VariableToken[] = [];
    let lastIndex = 0;

    VAR_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = VAR_PATTERN.exec(text)) !== null) {
        if (match.index > lastIndex) {
            tokens.push({ text: text.slice(lastIndex, match.index), type: 'text' });
        }
        tokens.push({
            text: match[0],
            type: 'variable',
            variableName: match[1].trim(),
        });
        lastIndex = VAR_PATTERN.lastIndex;
    }

    if (lastIndex < text.length) {
        tokens.push({ text: text.slice(lastIndex), type: 'text' });
    }

    return tokens;
}

export function classifyVariables(
    tokens: VariableToken[],
    context: Record<string, string>
): VariableToken[] {
    return tokens.map(token => {
        if (token.type !== 'variable') return token;
        return { ...token, isValid: token.variableName! in context };
    });
}

export function renderVariableTokensWithCursor(
    tokens: VariableToken[],
    cursorOffset: number | null,
    validColor: string,
    invalidColor: string
): string {
    let result = '';
    let charIndex = 0;

    for (const token of tokens) {
        for (const char of token.text) {
            const isCursor = cursorOffset !== null && charIndex === cursorOffset;

            if (token.type === 'variable') {
                const colorFn = token.isValid
                    ? chalk.hex(validColor).bold
                    : chalk.hex(invalidColor).bold;
                result += isCursor ? chalk.inverse(colorFn(char)) : colorFn(char);
            } else {
                result += isCursor ? chalk.inverse(char) : char;
            }

            charIndex++;
        }
    }

    if (cursorOffset !== null && cursorOffset >= charIndex) {
        result += chalk.inverse(' ');
    }

    return result;
}

export function renderVariableTokens(
    tokens: VariableToken[],
    validColor: string,
    invalidColor: string
): string {
    return renderVariableTokensWithCursor(tokens, null, validColor, invalidColor);
}

export function detectVariableAtCursor(
    text: string,
    cursorOffset: number
): VariableCursorInfo | null {
    const before = text.slice(0, cursorOffset);

    const openIndex = before.lastIndexOf('{{');
    if (openIndex === -1) return null;

    const betweenOpen = before.slice(openIndex + 2);
    if (betweenOpen.includes('}}')) return null;

    const partialName = betweenOpen;
    const after = text.slice(cursorOffset);
    const closeIndex = after.indexOf('}}');
    const endOffset = closeIndex >= 0 ? cursorOffset + closeIndex + 2 : cursorOffset;

    return {
        partialName,
        startOffset: openIndex,
        endOffset,
    };
}
