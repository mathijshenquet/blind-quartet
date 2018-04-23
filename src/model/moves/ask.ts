import {Player} from "../player";
import {Card} from "../card";
import {Category} from "../category";
import {Game} from "../game";
import {Result, throw_reason} from "../result";

export interface MoveAsk{
    type: "ask",
    player: Player,
    target: Player,
    card: Card
}

/// move ask
export function try_ask(game: Game, category: Category): Result {
    let player = game.turn;

    if(category.completed){
        return {possible: false, reason: "Is already a quartet"};
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

    return {possible: true}
}

export function move_ask(game: Game, target: Player, card: Card){
    throw_reason(try_ask(game, card.category));

    let category = card.category;
    let player = game.turn;
    game.log_move({type: "ask", player, target, card});

    category.reserve(player);
    card.exclude(player);
}