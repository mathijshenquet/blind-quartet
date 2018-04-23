import {Player} from "../player";
import {Result, throw_reason} from "../result";
import {Game} from "../game";


export interface MoveResponse {
    type: "response",
    player: Player,
    did_have: boolean,
}


// response move
export function try_respond(game: Game, did_have: boolean): Result {
    let last_move = game.last_move;
    if(!last_move){
        return {possible: false, reason: "Nothing to respond to"};
    }

    if(last_move.type != "ask"){
        return {possible: false, reason: "Last move isn't an ask"};
    }

    let target = last_move.target;

    // reason counterfactually
    game.push_state();
    let card = last_move.card;
    if(did_have) {
        target.claim_ownership(card);
    }else{
        card.exclude(target);
    }
    let consistency = game.check_consistent();
    game.pop_state();

    return consistency;
}

export function move_respond(game: Game, did_have: boolean){
    if(game.last_move == null || game.last_move.type != "ask"){
        throw new Error();
    }

    throw_reason(try_respond(game, did_have));

    let {player, card, target} = game.last_move;
    game.log_move({type: "response", player: target, did_have});
    if(did_have) {
        target.claim_ownership(card);
        card.transfer(player);
    }else{
        card.exclude(target);
        game.next_player();
    }
}