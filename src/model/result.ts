
export interface Possible {
    possible: true
}

export interface Impossible {
    possible: false,
    reason: string
}

export type Result = Possible | Impossible;

export function throw_reason(result: Result) {
    if(!result.possible)
        throw new Error(result.reason);
}
