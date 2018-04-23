import {Result, Game} from "./game";
import {Category} from "./category";
import {PlayerPattern} from "./player";
import {Card} from "./card";
import {Stateful} from "./stateful";

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

    constructor(id: number, game: Game){
        super({free_cards: 4, hand_cards: 4, quartets: 4});

        this.game = game;
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

    claim_ownership(card: Card) {
        if(card.owner != null || card.owner == this) return false;

        console.log("claim_ownership", this, card);

        card.category.reserve(this);
        card.owner = this;
        card.category.release(this); // now that we have a concrete card, we can release our reserved generic card
        return true;
    }

    show(): string {
        return this.name || "Player #"+(1+this.id);
    }
}
