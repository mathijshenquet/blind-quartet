import {PlayerPattern, Player} from "./player";
import {Move} from "../moves";
import {Category} from "./category";
import {Result} from "./result";
import {Card} from "./card";

export enum TurnProgression {
    Circle,
    Asked
}

export interface GameOptions{
    turn_progression: TurnProgression,
    player_count: number,
}

export class Game{
    turn_progression: TurnProgression;
    length: number;

    players: Array<Player>;
    categories: Array<Category>;

    moves: Array<Move>;
    turn: Player;
    turns: Array<Player>;

    get last_move(): Move | undefined {
        let l = this.moves.length;
        if(l > 0){
            return this.moves[l-1];
        }
        return;
    }

    constructor(options: GameOptions){
        this.turn_progression = options.turn_progression;
        this.length = options.player_count;

        this.players = [];
        this.categories = [];
        for(let player_id = 0; player_id < this.length; player_id++){
            this.players.push(new Player(player_id, this));
        }

        for(let category_id = 0; category_id < this.length; category_id++){
            this.categories.push(new Category(category_id, this));
        }

        this.moves = [];
        this.turn = this.get_player(0);
        this.turns = [];
    }

    get_player(id: number): Player{
        return this.players[id];
    }

    // if a player is set, this is the player who was asked a card before
    next_player(player?: Player) {
        if(this.turn_progression == TurnProgression.Circle || player == undefined) {
            let next_id = (this.turn.id + 1) % this.players.length;
            player = this.get_player(next_id);
        }

        this.turn = player;
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
    }

    undo_until(move: Move){
        do{
            this.pop_state();
        }while(this.moves.pop() != move);
    }

    empty_pattern(): PlayerPattern {
        return ~((1 << this.players.length) - 1);
    }

    consistent(): Result{
        for(let i = 0; ; i++){
            if(this.turn.hand_cards > 0) {
                break;
            }

            this.next_player();
            if(i > this.length){
                //throw new Error();
                return {possible: true};
            }
        }

        return this.solve_step();
    }

    solve_step(): Result {

        if(this.players.some((player) => {
            if(player.free_cards == 0)
                player.try_exclude_other();

            return player.free_cards < 0;
        })){
            return {possible: false, reason: "Some player has negative cards"};
        }

        let most_constrained: Card | null = null;
        this.categories.forEach((category) => {
            if(category.is_exclusive()){
                return;
            }

            category.cards.forEach((card) => {
                if(card.owner != null && card.degree == 1) return;

                if(most_constrained == null || most_constrained.degree > card.degree){
                    most_constrained = card;
                }
            })
        });

        // is solvable!
        if(most_constrained == null)
            return {possible: true};

        let card = most_constrained as Card;
        let degree = card.degree;

        if(degree == 0) {
            return {possible: false, reason: "The card "+card.print()+" cannot be owned anymore"};
        }

        let consistent: Result = {possible: true};
        card.domain().some((player) => {
            if(degree > 1) {
                this.push_state();
            }

            card.assign(player);
            let result = this.solve_step();

            if(degree > 1) {
                this.pop_state();
            }

            consistent = result;
            return result.possible;
        });
        return consistent;
    }
}