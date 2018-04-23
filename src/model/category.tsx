import {Player} from "./player";
import {Card} from "./card";
import {Result, Game} from "./game";
import * as React from "react";
import {Stateful} from "./stateful";

interface CategoryState {
    reserved: number;
    completed: boolean;
}

export class Category extends Stateful<CategoryState> {
    id: number;
    name: string;
    game: Game;
    cards: Array<Card>;

    constructor(id: number, game: Game){
        super({reserved: 0, completed: false});

        this.id = id;
        this.cards = [];
        this.game = game;
        for(let i = 0; i < 4; i++){
            this.cards.push(new Card(this, i));
        }
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

    is_exclusive(player: Player): boolean {
        return this.state.reserved == 0
            || this.state.reserved == player.bit_pattern();
    }

    multiplicity(player: Player): number {
        let count = this.is_reserved(player) ? 1 : 0;
        return count + this.cards.filter((card) => card.owner == player).length;
    }

    reserve(player: Player){
        if(!this.is_reserved(player)){
            this.state.reserved |= player.bit_pattern();
            player.free_cards -= 1;
        }
    }

    release(player: Player){
        this.state.reserved &= ~player.bit_pattern();
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
            console.log("category#consistent", "inconsistent", consistent);
            return consistent;
        }

        this.game.players.every((player) => {
            if(!this.is_reserved(player)){
                return true;
            }

            unowned -= 1;
            if(unowned < 0) {
                consistent = {possible: false, reason: "Not enought cards in category"};
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

    exclude_all(player: Player){
        return this.cards.some((card) =>
            card.exclude(player)
        )
    }

    can_have_player(player: Player): boolean {
        return this.cards.some((card) => card.can_be_claimed_by(player));
    }

    update() {
        return this.game.players.every((player) => {
            if(!this.is_reserved(player))
                return false;

            let card = this.cards.find((card) => card.can_be_claimed_by(player));
            if(card == null)
                return false;

            return player.claim_ownership(card);
        });
    }


    show() {
        return this.name || <span className="placeholder">Category #{1+this.id}</span>;
    }
}