import {PlayerPattern, Player} from "./player";
import {Move} from "./moves";
import {Category} from "./category";
import {Result} from "./result";

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

    empty_pattern(): PlayerPattern {
        return ~((1 << this.players.length) - 1);
    }
}