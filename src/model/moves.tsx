
/// Moves
import {Card} from "./card";
import {Player} from "./player";
import {Category} from "./category";

export interface MoveAsk{
    type: "ask",
    player: Player,
    target: Player,
    card: Card
}

export interface MoveResponse {
    type: "response",
    player: Player,
    did_have: boolean,
}

export interface MoveQuartet{
    type: "quartet",
    player: Player,
    category: Category
}

export interface MoveEnd {
    type: "end",
}

export type Move = MoveAsk | MoveQuartet | MoveEnd | MoveResponse;