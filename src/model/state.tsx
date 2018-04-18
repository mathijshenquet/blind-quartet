import {Game} from "./game";
import * as React from "react";
import {Category} from "./category";

export type PlayerPattern = number;

export class Player{
    id: number;
    name: string;
    game: Game;

    bit_pattern(): number {
        return 1 << this.id;
    }

    is_in(pattern: PlayerPattern): boolean {
        return (pattern & this.bit_pattern()) != 0;
    }

    free_cards: number;

    states: Array<number>;

    constructor(id: number, game: Game){
        this.id = id;
        this.free_cards = 4;
        this.game = game;

        this.states = [];
    }

    consistent(): boolean {
        return this.free_cards >= 0;
    }

    push_state(){
        this.states.push(this.free_cards);
    }

    pop_state(){
        let prev = this.states.pop();
        if(prev != undefined)
            this.free_cards = prev;
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

    claim(category: Category){
        category._multiplicity |= 1 << (this.id * 4);
        this.free_cards -= 1;
    }

    update(): boolean {
        let updated = false;
        if(this.free_cards == 0){
            this.game.categories.forEach((category) => {
                if(category.multiplicity(this) == 0){
                    if(category.exclude_all(this)) {
                        updated = true;
                    }
                }
            });
        }
        return updated;
    }

    own(card: Card): boolean{
        if(card.category.multiplicity(this) == 0){
            this.claim(card.category);
        }

        return card.set_owner(this);
    }

    render() {
        return <div>{this.show()} (free cards: {this.free_cards})</div>;
    }

    show(): string {
        return this.name || "Player #"+(1+this.id);
    }
}

export class Card{
    id: number;
    name: string;
    category: Category;
    game: Game;

    owner?: Player;
    _excluded: PlayerPattern;

    constructor(category: Category, id: number){
        this.category = category;
        this.game = category.game;
        this.id = id;
        this._excluded = this.game.empty_pattern();

        this.states = [];
    }

    states: Array<PlayerPattern>;

    pop_state(){
        let prev = this.states.pop();
        if(prev != undefined)
            this._excluded = prev;
        this.calculate_owner();
    }

    calculate_owner() {
        for(let i = 0; i < this.game.players.length; i++){
            if((~this._excluded) == (1 << i)){
                this.owner = this.game.get_player(i);
                return;
            }
        }
        this.owner = undefined;
    }

    push_state(){
        this.states.push(this._excluded);
    }

    /***
     * exclude a player from this card, return true if not yet included
     */
    exclude(player: Player): boolean{
        if((this._excluded & (1 << player.id)) == 0){ // isnt set
            this._excluded |= 1 << player.id;
            console.log("exclude", this, player);
            return true;
        }
        return false;
    }

    excluded(): Array<Player> {
        let out = [];
        for(let i = 0; i < this.game.players.length; i++){
            if((this._excluded & (1 << i)) != 0){
                out.push(this.category.game.get_player(i));
            }
        }
        return out;
    }

    can_be_owned_by(player: Player): boolean {
        return !player.is_in(this._excluded);
    }

    consistent(): boolean {
        return this._excluded != -1;
    }

    set_owner(player: Player): boolean {
        if(this._excluded != ~player.bit_pattern()) {
            this._excluded = ~player.bit_pattern();
            this.owner = player;
            return true;
        }else{
            return false;
        }
    }

    show(){
        return this.name || <span className="placeholder">Card #{this.id+1}</span>;
    }

    render() {
        const excluded = this.excluded().length > 0 ? "- "+this.excluded().map((player) => player.show()).join(", ") : "";

        return <span>
            {this.show()}
            {excluded}</span>
    }
}