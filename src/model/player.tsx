import {Game} from "./game";
import {Category} from "./category";
// import {PlayerPattern} from "./player";
import {Entity} from "./entity";
import * as React from "react";
import GameView from "../Game";

export type PlayerPattern = number;

interface PlayerState {
    free_cards: number;
    hand_cards: number;
    quartets: number;
}

export class Player extends Entity<PlayerState> implements Entity<PlayerState> {
    game: Game;

    constructor(id: number, game: Game){
        super(id, {free_cards: 4, hand_cards: 4, quartets: 0});
        this.game = game;
    }

    get_kind(): string{
        return "Player";
    }

    get_style(): any{
        return {};
    }

    bit_pattern(): number {
        return 1 << this.id;
    }

    is_in(pattern: PlayerPattern): boolean {
        return (pattern & this.bit_pattern()) != 0;
    }

    get quartets(): number {
        return this.state.quartets;
    }

    set quartets(value: number) {
        this.state.quartets = value;
    }

    get hand_cards(): number {
        return this.state.hand_cards;
    }

    set hand_cards(value: number) {
        this.state.hand_cards = value;
    }

    get free_cards(): number {
        return this.state.free_cards;
    }

    set free_cards(value: number) {
        this.state.free_cards = value;
    }

    // exclude ourselves from all cards we dont own or who'se category we play in
    try_exclude_other(){
        if(this.free_cards != 0)
            return;

        this.game.categories.forEach((category) => {
            if(category.is_reserved(this))
                return;

            category.cards.forEach((card) => {
                if(card.owner != this) card.exclude(this);
            });
        });
    }

    playing_in(cat: Category): boolean {
        return !cat.completed && cat.multiplicity(this) > 0;
    }

    render(app: GameView){
        let player = this;
        let state = app.state;

        const select_button = state.type == "move" && state.target == null && state.category == null && player != state.player
            ? <button className="select btn btn-xs btn-default" onClick={() => app.setState({target: player})}>Select</button>
            : "";

        return <li key={this.id}>
            <span className={player==state.player ? "turn" : ""}>{player.show(app)}</span>&nbsp;
            <span className="info">(free: {player.free_cards}, hand: {player.hand_cards}, quartets: {player.quartets})</span>&nbsp;
            {select_button}
        </li>;
    }

    render_multiplicity(category: Category) {
        let count = category.multiplicity(this);
        if(count == 0) return null;
        if(count == 1) return <span className="count" key={this.id}>{this.show()}</span>;
        return <span className="count" key={this.id}>{count}x{this.show()}</span>;
    }
}
