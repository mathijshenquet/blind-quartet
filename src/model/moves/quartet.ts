import {Category} from "../category";
import {Player} from "../player";
import {Game} from "../game";
import {Result, throw_reason} from "../result";

export interface MoveQuartet{
    type: "quartet",
    player: Player,
    category: Category
}


export function try_quartet(game: Game, category: Category): Result {
    let player = game.turn;

    let m = category.multiplicity(player);
    if(m + player.free_cards < 4){
        return {possible: false, reason: "You cannot have enough cards"};
    }

    if(!category.is_exclusive(player)){
        return {possible: false, reason: "Someone else has cards in this category"};
    }

    return {possible: true};
}

export function move_quartet(game: Game, category: Category){
    throw_reason(try_quartet(game, category));
    let player = game.turn;
    category.cards.forEach((card) => player.claim_ownership(card));
    category.completed = true;
    player.hand_cards -= 4;
    player.quartets += 1;
}