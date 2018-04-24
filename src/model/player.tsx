import {Game} from "./game";
import {Category} from "./category";
import {PlayerPattern} from "./player";
import {Stateful} from "./stateful";
import {Result} from "./result";
import * as React from "react";
import App from "../App";

export type PlayerPattern = number;

interface PlayerState {
    free_cards: number;
    hand_cards: number;
    quartets: number;
}

export class Player extends Stateful<PlayerState> {
    id: number;
    name: string;
    game: Game;
    modifying: boolean;

    constructor(id: number, game: Game){
        super({free_cards: 4, hand_cards: 4, quartets: 0});

        this.id = id;
        this.game = game;
        this.modifying = false;
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
        this.try_exclude_other();
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

    consistent(): Result {
        if(this.free_cards >= 0){
            return {possible: true};
        }else{
            return {possible: false, reason: "Can't have negative free cards"};
        }
    }

    playing_in(cat: Category): boolean {
        if(cat.completed){
            return false;
        }

        if(cat.multiplicity(this) > 0){
            return true;
        }

        return false;
    }

    show(app: App | null): any {
        if(this.modifying && app != null){
            return <input type="text" value={this.name} onChange={(event) => {
                this.name = event.target.value;
                app.forceUpdate();
            }} onBlur={() => {
                this.modifying = false;
                app.forceUpdate();
            }} />
        }

        let inner = this.name || <span className="placeholder">Player #{this.id + 1}</span>;
        if(app == null){
            return inner;
        }

        return <span onClick={() => {
            this.modifying = true;
            app.forceUpdate();
        }}>{inner}</span>;
    }

    render_multiplicity(category: Category) {
        let count = category.multiplicity(this);
        if(count == 0) return null;
        if(count == 1) return <span className="count">{this.show(null)}</span>;
        return <span className="count">{count}x{this.show(null)}</span>;
    }
}
