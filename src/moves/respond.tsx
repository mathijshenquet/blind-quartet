import {Player} from "../model/player";
import {Result} from "../model/result";
import {Game} from "../model/game";
import {Move} from "./move";
import * as React from "react";
import {Card} from "../model/card";

export class MoveResponse extends Move {
    did_have: boolean;
    card: Card;
    source: Player;

    constructor(game: Game, player: Player, card: Card, did_have: boolean){
        super(game, player);
        this.did_have = did_have;
        this.card = card;
        this.source = game.turn;
    }

    render(): any {
        return <span>replies: <b>{this.did_have ? "Yes" : "No"}</b></span>;
    }

    run(): void {
        if(this.did_have) {
            this.card.assign(this.player);
            this.card.transfer(this.source);
        }else{
            this.card.exclude(this.player);
            this.game.next_player();
        }
    }

    try(): Result{
        if(this.card.is_excluded(this.player) && this.did_have){
            return {possible: false, reason: "You are excluded from owning this card"};
        }

        return super.try();
    }
}