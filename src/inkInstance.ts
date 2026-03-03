let clearFn: (() => void) | null = null;

export function setInkClear(fn: () => void) {
    clearFn = fn;
}

export function clearInkOutput() {
    clearFn?.();
}
