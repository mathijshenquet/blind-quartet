import {Player} from "./player";
import {Card} from "./card";
import {Game} from "./game";
import {Entity} from "./entity";
import {Result} from "./result";
import {MoveQuartet} from "../moves";
import GameView from "../Game";
import * as React from "react";

interface CategoryState {
    reserved: number;
    completed: boolean;
}

let colors = ["red", "blue", "green", "goldenrod", "purple"];

export class Category extends Entity<CategoryState> implements Entity<CategoryState> {
    game: Game;
    cards: Array<Card>;

    constructor(id: number, game: Game){
        super(id, {reserved: 0, completed: false});

        this.cards = [];
        this.game = game;
        for(let i = 0; i < 4; i++){
            this.cards.push(new Card(this, i));
        }
    }


    get_kind(): string{
        return "Category";
    }

    get_style(): any {
        return {color: colors[this.id]};
    }

    get completed(): boolean{
        return this.state.completed;
    }

    set completed(value: boolean){
        this.state.completed = value;
    }

    is_reserved(player: Player): boolean {
        return player.is_in(this.state.reserved);
    }

    is_exclusive(player?: Player): boolean {
        return this.state.reserved == 0
            || (player != undefined && this.state.reserved == player.bit_pattern());
    }

    multiplicity(player?: Player): number {
        if(player) {
            let count = this.is_reserved(player) ? 1 : 0;
            return count + this.cards.filter((card) => card.owner == player).length;
        }else{
            let count = this.game.players.filter((player) => this.is_reserved(player)).length;
            return count + this.cards.filter((card) => card.owner != null).length;
        }
    }

    reserve(player: Player){
        if(!this.is_reserved(player)){
            this.state.reserved |= player.bit_pattern();
            player.free_cards -= 1;
        }
    }

    release(player: Player){
        this.state.reserved &= ~player.bit_pattern();
        player.try_exclude_other();
    }

    consistent(): Result {
        let consistent: Result = {possible: true};

        let unowned = 0;
        this.cards.every((card) => {
            consistent = card.consistent();
            if(card.owner == null)
                unowned += 1;

            return consistent.possible;
        });

        if(!consistent.possible) {
            return consistent;
        }

        this.game.players.every((player) => {
            if(!this.is_reserved(player)){
                return true;
            }

            unowned -= 1;
            if(unowned < 0) {
                consistent = {possible: false, reason: "Not enough cards in category"};
                return false;
            }

            if(!this.cards.some((card) => card.can_be_claimed_by(player))){
                consistent = {possible: false, reason: "Player cannot be part of category anymore"};
                return false;
            }

            return true;
        });

        return consistent;
    }

    // given that the player is not jet playing in this category, is there a
    // way for him to play in this category?
    can_have_player(player: Player): boolean {
        return this.multiplicity() < 4 && this.cards.some((card) => card.can_be_claimed_by(player));
    }

    render(app: GameView){
        let color = colors[this.id];
        let state = app.state;

        let select_button: any = "";
        if(state.type == "move" && state.target == null && state.category == null && state.card == null) {

            let quartet = new MoveQuartet(state.player, this);
            let consistent = quartet.try();

            select_button =
                <button className="select btn btn-sm btn-default" disabled={!consistent.possible}
                        title={!consistent.possible ? consistent.reason : undefined}
                        onClick={() => app.setState({category: this})}>Quartet</button>;
        }


        let player_counts = this.game.players
            .map((player) => player.render_multiplicity(this))
            .filter((m) => m != null);

        let multiplicities = player_counts.length > 0 ? <span className="info"> + {player_counts}</span> : undefined;

        return <div style={{borderColor: color}} className="category">
            <h3 style={{color}}>{this.show(app)} {multiplicities} {select_button}</h3>
            <ul>
                {this.cards.map((card) => <li>{card.render(app)}</li>)}
            </ul>
        </div>;
    }
}