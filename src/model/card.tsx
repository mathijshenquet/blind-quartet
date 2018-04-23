import {Result, Game} from "./game";
import * as React from "react";
import {Category} from "./category";
import {Player, PlayerPattern} from "./player";
import {Stateful} from "./stateful";

interface CardState {
    owner: Player | null;
    _excluded: PlayerPattern;
}

export class Card extends Stateful<CardState>{
    id: number;
    name: string;
    category: Category;
    game: Game;

    constructor(category: Category, id: number){
        super({_excluded: category.game.empty_pattern(), owner: null});

        this.category = category;
        this.game = category.game;
        this.id = id;
    }

    /*
    calculate_owner() {
        console.log("calculate.owner");

        for(let i = 0; i < this.game.players.length; i++){
            if((~this._excluded) == (1 << i)){
                let player = this.game.get_player(i);

                if(this.owner != player) {
                    // obtain a card by exclusion
                    player.claim_ownership(this);
                }
                return;
            }
        }
    }
    */



    /***
     * exclude a player from this card, return true if not yet included
     */
    exclude(player: Player): boolean{
        if(!this.is_excluded(player)){ // isnt set
            this.state._excluded |= 1 << player.id;
            console.log("exclude", this, player);
            return true;
        }
        return false;
    }

    is_excluded(player: Player): boolean{
        return player.is_in(this.state._excluded);
    }

    get_excluded(): Array<Player> {
        return this.game.players.filter((player) => this.is_excluded(player));
    }

    get owner(): Player | null{
        return this.state.owner
    }
    set owner(value: Player | null){
        this.state.owner = value;

        if(value == null) throw new Error();
        this.state._excluded = ~value.bit_pattern();
    }

    transfer(player: Player){
        if(this.owner == null) throw Error();

        this.owner.hand_cards -= 1;
        this.owner = player;
        this.owner.hand_cards += 1;
    }

    can_be_claimed_by(player: Player): boolean {
        return this.state.owner == null && !this.is_excluded(player);
    }

    consistent(): Result {
        if(this.state._excluded == -1){
            console.log("inconsistent", "Card get_excluded by every player");
            return {possible: false, reason: "Card get_excluded by every player"};
        }else{
            return {possible: true};
        }
    }

    show(){
        return this.name || <span className="placeholder">Card #{this.id+1}</span>;
    }
}