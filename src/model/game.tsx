import * as React from "react";
import {Card, PlayerPattern, Player} from "./state";
import {Move} from "./moves";
import {Category} from "./category";

interface Possible {
    possible: true
}

interface Impossible {
    possible: false,
    reason: string
}

type Result = Possible | Impossible;

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

    check_consistent(): boolean{
        this.update();
        return this.categories.every((cat) => cat.consistent())
            && this.players.every((player) => player.consistent());
    }

    next_action(): {type: "move" | "response", player: Player} {
        let last_move = this.last_move;
        if(last_move && last_move.type == "ask"){
            return {type: "response", player: last_move.player};
        }
        return {type: "move", player: this.turn};
    }

    /// move ask
    try_ask_cat(player: Player, category: Category): Result {
        if(player != this.next_action().player || this.next_action().type != "move"){
            return {possible: false, reason: "Not your turn"};
        }

        if(category.completed){
            return {possible: false, reason: "You own the quartet already"};
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
        let category = card.category;
        let player = this.turn;
        throw_reason(this.try_ask_cat(player, card.category));

        this.log_move({type: "ask", player, target, card});

        // claim a place in the category if we are not playing in it
        if(!player.playing_in(category)) {
            player.claim(category);
        }

        card.exclude(player);
    }

    // response move
    try_respond(target: Player, did_have: boolean): Result {
        let last_move = this.last_move;
        if(!last_move){
            return {possible: false, reason: "Nothing to respond to"};
        }

        if(last_move.type != "ask"){
            return {possible: false, reason: "Last move isn't an ask"};
        }

        if(last_move.target != target){
            return {possible: false, reason: "You should not respond"};
        }

        // reason counterfactually
        this.push_state();
        let card = last_move.card;
        if(did_have) {
            target.own(card);
        }else{
            card.exclude(target);
        }
        let consistency = this.check_consistent();
        this.pop_state();

        if(consistency){
            return {possible: true};
        }else{
            return {possible: false, reason: "Inconsistent"}
        }
    }

    try_exclude(player: Player, card: Card): Result {
        // reason counterfactually
        this.push_state();
        card.exclude(player);
        let consistency = this.check_consistent();
        this.pop_state();

        if(consistency){
            return {possible: true};
        }else{
            return {possible: false, reason: "Inconsistent"}
        }
    }

    move_respond(did_have: boolean){
        if(this.last_move == null || this.last_move.type != "ask"){
            throw new Error();
        }

        let target = this.last_move.target;
        throw_reason(this.try_respond(target, did_have));

        //let player = this.last_move.player;
        let card = this.last_move.card;

        this.log_move({type: "response", player: target, did_have});
        if(did_have) {
            target.own(card);
        }else{
            card.exclude(target);
            this.next_player();
        }
    }

    empty_pattern(): PlayerPattern {
        return ~((1 << this.players.length) - 1);
    }

    render_players(){
        return <div id="players">
            <h3>Players</h3>
            <ul>{this.players.map((player) => <li>{player.render()}</li>)}</ul>
        </div>;
    }

    render_categories() {
        return <div id="categories">{this.categories.map((player) => player.render())}</div>;
    }

    render_log() {
        return <div id="log">Log</div>;
    }

}