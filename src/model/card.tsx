import {Game} from "./game";
import {Category} from "./category";
import {Player, PlayerPattern} from "./player";
import {Stateful} from "./stateful";
import {Result} from "./result";

interface CardState {
    owner: Player | null;
    excluded: PlayerPattern;
    degree: number;
}

export class Card extends Stateful<CardState>{
    category: Category;

    constructor(category: Category, id: number){
        super(id, {excluded: category.game.empty_pattern(), owner: null, degree: category.game.length});

        this.category = category;
    }

    get_kind(): string{
        return "Card";
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
}