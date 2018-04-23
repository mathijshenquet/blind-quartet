import {PlayerPattern, Player} from "./player";
import {Card} from "./card";
import {Move} from "./moves";
import {Category} from "./category";

export interface Possible {
    possible: true
}

export interface Impossible {
    possible: false,
    reason: string
}

export type Result = Possible | Impossible;

function throw_reason(result: Result) {
    if(!result.possible)
        throw new Error(result.reason);
}

export class Game{
    players: Array<Player>;
    categories: Array<Category>;

    moves: Array<Move>;
    last_move?: Move;
    turn: Player;

    constructor(player_count: number){
        this.players = [];
        this.categories = [];
        for(let player_id = 0; player_id < player_count; player_id++){
            this.players.push(new Player(player_id, this));
        }

        for(let category_id = 0; category_id < player_count; category_id++){
            this.categories.push(new Category(category_id, this));
        }

        this.moves = [];
        this.turn = this.get_player(0);
    }

    get_player(id: number): Player{
        return this.players[id];
    }

    next_player(){
        const next_id = (this.turn.id + 1) % this.players.length;
        this.turn = this.get_player(next_id);
    }

    get_category(id: number) {
        return this.categories[id];
    }

    /// manage state
    push_state(){
        this.players.forEach((player) => player.push_state());
        this.categories.forEach((category) => category.push_state());
    }

    pop_state(){
        this.players.forEach((player) => player.pop_state());
        this.categories.forEach((category) => category.pop_state());
    }

    log_move(move: Move){
        this.push_state();
        this.moves.push(move);
        this.last_move = move;
    }

    update(){
        let updated = true;
        while(updated){
            updated = this.categories.some((cat) => cat.update()) ||
                      this.players.some((player) => player.update());
        }
    }

    check_consistent(): Result {
        let consistency: Result = {possible: true};
        this.categories.every((cat) => {
            consistency = cat.consistent();
            return consistency.possible;
        });
        if(!consistency.possible)
            return consistency;

        this.players.every((player) => {
            consistency = player.consistent();
            return consistency.possible;
        });

        return consistency;
    }

    next_action(): {type: "move" | "response", player: Player} {
        //this.update();
        let last_move = this.last_move;
        if(last_move && last_move.type == "ask"){
            return {type: "response", player: last_move.player};
        }
        return {type: "move", player: this.turn};
    }

    /// move ask
    try_ask_cat(category: Category): Result {
        let player = this.turn;

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

    move_ask(target: Player, card: Card){
        throw_reason(this.try_ask_cat(card.category));

        let category = card.category;
        let player = this.turn;
        this.log_move({type: "ask", player, target, card});

        category.reserve(player);
        card.exclude(player);
    }

    try_quartet(category: Category): Result {
        let player = this.turn;

        let m = category.multiplicity(player);
        if(m + player.free_cards < 4){
            return {possible: false, reason: "You cannot have enough cards"};
        }

        if(!category.is_exclusive(player)){
            return {possible: false, reason: "Someone else has cards in this category"};
        }

        return {possible: true};
    }

    move_quartet(category: Category){
        throw_reason(this.try_quartet(category));
        let player = this.turn;
        category.cards.forEach((card) => player.claim_ownership(card));
        category.completed = true;
        player.hand_cards -= 4;
        player.quartets += 1;
    }

    // response move
    try_respond(did_have: boolean): Result {
        let last_move = this.last_move;
        if(!last_move){
            return {possible: false, reason: "Nothing to respond to"};
        }

        if(last_move.type != "ask"){
            return {possible: false, reason: "Last move isn't an ask"};
        }

        let target = last_move.target;

        // reason counterfactually
        this.push_state();
        let card = last_move.card;
        if(did_have) {
            target.claim_ownership(card);
        }else{
            card.exclude(target);
        }
        let consistency = this.check_consistent();
        this.pop_state();

        return consistency;
    }

    move_respond(did_have: boolean){
        if(this.last_move == null || this.last_move.type != "ask"){
            throw new Error();
        }

        throw_reason(this.try_respond(did_have));

        let {player, card, target} = this.last_move;
        this.log_move({type: "response", player: target, did_have});
        if(did_have) {
            target.claim_ownership(card);
            card.transfer(player);
        }else{
            card.exclude(target);
            this.next_player();
        }
    }

    empty_pattern(): PlayerPattern {
        return ~((1 << this.players.length) - 1);
    }
}