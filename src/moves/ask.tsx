import {Player} from "../model/player";
import {Card} from "../model/card";
import {Result} from "../model/result";
import {Move} from "./move";
import * as React from "react";

export class MoveAsk extends Move{
    target: Player;
    card: Card;

    constructor(player: Player, target: Player, card: Card){
        super(player.game, player);

        this.target = target;
        this.card = card;
    }

    static try_card(player: Player, card: Card): Result{
        let category = card.category;

        if(card.owner == player){
            return {possible: false, reason: "You already own this card"}
        }

        if(category.completed){
            return {possible: false, reason: "Is already in a quartet"};
        }

        if(player.playing_in(category)) {
            return {possible: true};
        }

        if(player.free_cards == 0){
            return {possible: false, reason: "You have no more free cards"}
        }

        if(!category.can_have_player(player)){
            return {possible: false, reason: "There are no more free cards in this category"}
        }

        return {possible: true};
    }

    render(): any {
        return <span>
            does {this.target.show()} have {this.card.show()} in category {this.card.category.show()}?
        </span>;
    }

    try(): Result{
        let consistent = MoveAsk.try_card(this.player, this.card);
        if(!consistent.possible) return consistent;

        return super.try();
    }

    run(): void {
        this.card.category.reserve(this.player);
        this.card.exclude(this.player);
    }
}