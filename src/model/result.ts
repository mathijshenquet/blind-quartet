
export interface Possible {
    possible: true
}

export interface Impossible {
    possible: false,
    reason: string
}

export type Result = Possible | Impossible;
