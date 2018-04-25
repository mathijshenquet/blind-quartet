import {Game} from "./game";
import {Category} from "./category";
import {Player, PlayerPattern} from "./player";
import {Entity} from "./entity";
import {Result} from "./result";
import {MoveAsk} from "../moves";
import GameView from "../Game";
import * as React from "react";

interface CardState {
    owner: Player | null;
    excluded: PlayerPattern;
    degree: number;
}

export class Card extends Entity<CardState> implements Entity<CardState>{
    category: Category;

    constructor(category: Category, id: number){
        super(id, {excluded: category.game.empty_pattern(), owner: null, degree: category.game.length});

        this.category = category;
    }

    get_kind(): string{
        return "Card";
    }

    get_style(): any {
        return this.category.get_style();
    }

    get game(): Game{
        return this.category.game;
    }

    get degree(): number{
        return this.state.degree;
    }

    domain(): Array<Player> {
        return this.game.players.filter((player) => !this.is_excluded(player));
    }

    /***
     * exclude a player from this card, return true if not yet included
     */
    exclude(player: Player){
        if(!this.is_excluded(player)){ // isnt set
            this.state.excluded |= 1 << player.id;
            this.state.degree -= 1;
        }
    }

    is_excluded(player: Player): boolean{
        return player.is_in(this.state.excluded);
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
        this.state.excluded = ~value.bit_pattern();
        this.state.degree = 1;
    }

    assign(player: Player){
        if(this.owner != null || this.owner == this) return;

        this.category.reserve(player);
        this.owner = player;
        this.category.release(player); // now that we have a concrete card, we can release our reserved generic card
    }

    transfer(player: Player){
        if(this.owner == null || this.owner == player) throw Error();

        this.owner.hand_cards -= 1;
        this.owner = player;
        this.owner.hand_cards += 1;
    }

    can_be_claimed_by(player: Player): boolean {
        return this.state.owner == null && !this.is_excluded(player);
    }

    consistent(): Result {
        if(this.state.excluded == -1){
            return {possible: false, reason: "Card get_excluded by every player"};
        }else{
            return {possible: true};
        }
    }

    print() {
        return "cat#"+(this.category.id+1)+" card#"+(this.id+1);
    }

    render(app: GameView){
        let state = app.state;
        let card = this;

        let select_button: any = "";
        if(state.type == "move" && state.category == null && state.card == null){
            let consistent = MoveAsk.try_card(state.player, card);
            select_button = <button className="select btn btn-xs btn-default" disabled={!consistent.possible}
                                    title={!consistent.possible ? consistent.reason : undefined}
                                    onClick={() => app.setState({card})}>Select</button>;
        }

        let excluded, owner;
        if(card.owner == null) {
            const excluded_list = card.get_excluded().map((player) => <span className="count">{player.show()}</span>);
            if (excluded_list.length > 0) {
                excluded = <span className="info">- {excluded_list}</span>;
            }
        }else{
            owner = <span className="info">+ {card.owner.show()}</span>;
        }

        return <span>{card.show(app)} {excluded} {owner} {select_button}</span>;
    }
}