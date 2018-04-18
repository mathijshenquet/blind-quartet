import {Card, Player} from "./state";
import {Game} from "./game";
import * as React from "react";

let colors = ["red", "blue", "green", "goldenrod", "purple"];

export class Category{
    id: number;
    name: string;
    game: Game;
    cards: Array<Card>;

    /**
     * List of players that play this category
     */
    _multiplicity: number;
    multiplicity(player: Player): number {
        return (this._multiplicity >> (4 * player.id)) & 0b1111;
    }

    increase(player: Player){
        this._multiplicity += (1 << (4 * player.id));
    }

    decrease(player: Player){
        this._multiplicity += (1 << (4 * player.id));
    }

    completed: boolean; // TODO

    states: Array<number>;

    push_state(){
        this.states.push(this._multiplicity);
        this.cards.forEach((card) => card.push_state())
    }

    pop_state(){
        let prev = this.states.pop();
        if(prev != undefined)
            this._multiplicity = prev;
        this.cards.forEach((card) => card.pop_state())
    }

    consistent(): boolean{
        if(this.cards.some((card) => !card.consistent())){
            return false;
        }

        let total_multiplicity = 0;
        return this.game.players.every((player) => {
            let m = this.multiplicity(player);
            total_multiplicity += m;
            if(total_multiplicity > 4) return false;

            this.cards.forEach((card) => {
                if(card.can_be_owned_by(player)){
                    m -= 1;
                }
            });

            return m <= 0;
        })
    }

    constructor(id: number, game: Game){
        this.id = id;
        this.cards = [];
        this.completed = false;
        this.game = game;
        for(let i = 0; i < 4; i++){
            this.cards.push(new Card(this, i));
        }
        this._multiplicity = 0;

        this.states = [];
    }

    exclude_all(player: Player){
        return this.cards.some((card) =>
            card.exclude(player)
        )
    }

    must_play_in(player: Player): boolean{
        return this.multiplicity(player) > 0
    }

    can_have_player(player: Player): boolean {
        return this.cards.some((card) => card.can_be_owned_by(player));
    }

    update() {
        return this.game.players.every((player) => {
            let m = this.multiplicity(player);
            if(m == 0) return false;

            let cards = this.cards.filter((card) => card.can_be_owned_by(player));
            if(m != cards.length){
                return false;
            }

            return cards.some((card) => player.own(card));
        })
    }

    render() {
        let color = colors[this.id];

        return <div style={{borderColor: color}} className="category">
            <h3 style={{color}}>{this.show()}</h3>
            <ul>
                {this.cards.map((card) => <li>{card.render()}</li>)}
            </ul>
        </div>;
    }

    show() {
        return this.name || <span className="placeholder">Category #{1+this.id}</span>;
    }
}