import {PlayerPattern, Player} from "./player";
import {Move} from "../moves";
import {Category} from "./category";
import {Result} from "./result";
import {Card} from "./card";
import {MoveAsk} from "../moves/ask";

export class Game{
    players: Array<Player>;
    categories: Array<Category>;

    moves: Array<Move>;
    last_move?: Move;
    turn: Player;
    turns: Array<Player>;
    length: number;

    constructor(player_count: number){
        this.players = [];
        this.categories = [];
        this.length = player_count;
        for(let player_id = 0; player_id < player_count; player_id++){
            this.players.push(new Player(player_id, this));
        }

        for(let category_id = 0; category_id < player_count; category_id++){
            this.categories.push(new Category(category_id, this));
        }

        this.moves = [];
        this.turn = this.get_player(0);
        this.turns = [];
    }

    get_player(id: number): Player{
        return this.players[id];
    }

    next_player(){
        const next_id = (this.turn.id + 1) % this.players.length;
        this.turn = this.get_player(next_id);
    }

    /// manage state
    push_state(){
        this.players.forEach((player) => player.push_state());
        this.categories.forEach((category) => {
            category.push_state();
            category.cards.forEach((card) => card.push_state());
        });
        this.turns.push(this.turn);
    }

    pop_state(){
        this.players.forEach((player) => player.pop_state());
        this.categories.forEach((category) => {
            category.pop_state();
            category.cards.forEach((card) => card.pop_state());
        });
        let prev = this.turns.pop();
        if(prev != null){
            this.turn = prev;
        }
    }

    log_move(move: Move){
        this.push_state();
        this.moves.push(move);
        this.last_move = move;
    }

    next_action(): {type: "move" | "response", player: Player} {
        this.consistent();

        let last_move = this.last_move;
        if(last_move && last_move instanceof MoveAsk){
            return {type: "response", player: last_move.target};
        }
        return {type: "move", player: this.turn};
    }

    empty_pattern(): PlayerPattern {
        return ~((1 << this.players.length) - 1);
    }

    solve_step(): boolean {
        if(this.players.some((player) => {
            if(player.free_cards == 0)
                player.try_exclude_other();

            return player.free_cards < 0;
        })){
            return false;
        }

        let most_constrained: Card | null = null;
        this.categories.forEach((category) => {
            category.cards.forEach((card) => {
                if(card.owner != null && card.degree == 1) return;

                if(most_constrained == null || most_constrained.degree > card.degree){
                    most_constrained = card;
                }
            })
        });

        // is solvable!
        if(most_constrained == null) return true;

        let card: Card = most_constrained;
        let degree = card.degree;

        if(degree == 0) {
            return false;
        }

        return card.domain().some((player) => {
            if(degree > 1) {
                this.push_state();
            }

            card.assign(player);
            let result = this.solve_step();

            if(degree > 1) {
                this.pop_state();
            }

            return result;
        });
    }

    // this method runs an backtracking solver for this constraint satisfaction problem (CSP)
    consistent(): Result {
        if(this.solve_step()){
            return {possible: true};
        }else{
            return {possible: false, reason: "inconsistent"}
        }
    }
}