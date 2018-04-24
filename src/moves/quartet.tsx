import {Category} from "../model/category";
import {Player} from "../model/player";
import {Result} from "../model/result";
import * as React from "react";
import {Move} from "./move";

export class MoveQuartet extends Move {
    category: Category;

    constructor(player: Player, category: Category){
        super(player.game, player);
        this.category = category;
    }

    try(): Result {
        if(this.category.completed){
            return {possible: false, reason: "Is already a quartet"};
        }

        /*
        if(player.hand_cards < 4){
            return {possible: false, reason: "You don't have enough cards"};
        }

        if(!category.is_exclusive(player)){
            return {possible: false, reason: "Someone else has cards in this category"};
        }
        */

        return super.try();
    }

    run(){
        let {player, category} = this;
        category.cards.forEach((card) => card.assign(player));
        category.completed = true;
        player.hand_cards -= 4;
        player.quartets += 1;
    }

    render(){
        return <span>Has {this.category.show()} quartet!</span>;
    }
}