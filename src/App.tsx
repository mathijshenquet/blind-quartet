import * as React from 'react';
import './App.css';
import {Game} from "./model/game";
import {Card} from "./model/card";
import {Player} from "./model/player";
import {Category} from "./model/category";


const g = new Game(2);

let colors = ["red", "blue", "green", "goldenrod", "purple"];

interface AppState {
    player: Player;
    type: "response"|"move";
    target: null | Player;
    category: null | Category;
    card: null | Card;
}

class App extends React.Component<any, AppState> {
    constructor(props: any){
        super(props);

        let state: any = g.next_action();
        state.category = null;
        state.target = null;
        state.card = null;

        this.state = state;
    }

    executeAsk(target: Player, card: Card){
        g.move_ask(target, card);
        this.setState(g.next_action());
    }

    executeResponse(did_have: boolean){
        g.move_respond(did_have);
        this.setState({target: null, card: null});
        this.setState(g.next_action());
    }

    executeQuartet(category: Category){
        g.move_quartet(category);
        this.setState({category: null});
        this.setState(g.next_action());
    }

    public render() {
        console.log(g);
        return <div id="game">
            {this.render_players()}
            {this.render_categories()}
            {this.render_actions()}
        </div>;
    }

    render_players(){
        return <div id="players">
            <h3>Players</h3>
            <ul>{g.players.map((player) => this.render_player(player))}</ul>
        </div>;
    }

    render_player(player: Player){
        let state = this.state;

        const select_button = state.type == "move" && state.target == null && state.category == null && player != state.player
            ? <button className="select" onClick={() => this.setState({target: player})}>Select</button>
            : "";

        return <li>
            <span className={player==this.state.player ? "turn" : ""}>{player.show()}</span>&nbsp;
            (free: {player.free_cards}, hand: {player.hand_cards}, quartets: {player.quartets})&nbsp;
            {select_button}
        </li>;
    }

    render_categories() {
        return <div id="categories">{g.categories.map((cat) => this.render_category(cat))}</div>;
    }

    render_category(category: Category){
        let color = colors[category.id];
        let state = this.state;

        let consistent = g.try_ask_cat(category);
        const select_button = state.type == "move" && state.target == null && state.category == null && state.card == null
            ? <button className="select" disabled={!consistent.possible} title={!consistent.possible ? consistent.reason : undefined} onClick={() => this.setState({category})}>Quartet</button>
            : "";

        let player_counts = g.players
            .map((player) => {
                return {player, count: category.multiplicity(player)};
            })
            .filter(({count}) => count > 0)
            .map(({player, count}) => count == 1 ? player.show() : count+"x"+player.show());

        let multiplicities = player_counts.length > 0 ? <span className="info"> + {player_counts.join(", ")}</span> : undefined;

        return <div style={{borderColor: color}} className="category">
            <h3 style={{color}}>{category.show()} {multiplicities} {select_button}</h3>
            <ul>
                {category.cards.map((card) => <li>{this.render_card(card)}</li>)}
            </ul>
        </div>;
    }

    render_card(card: Card){
        let state = this.state;

        const select_button = state.type == "move" && state.category == null && state.card == null
            ? <button className="select" onClick={() => this.setState({card})}>Select</button>
            : "";

        let excluded, owner;

        if(card.owner == null) {
            const excluded_list = card.get_excluded().map((player) => player.show());
            if (excluded_list.length > 0) {
                excluded = <span className="info">- {excluded_list.join(", ")}</span>;
            }
        }else{
            owner = <span className="info">+ {card.owner.show()}</span>;
        }

        return <span>{card.show()} {excluded} {owner} {select_button}</span>;
    }

    render_actions(){
        return <div id="actions">
            <h2>Actions</h2>
            <ul>
                <li>Log...</li>
                <li className="current">{this.render_current_move()}</li>
            </ul>
        </div>;
    }

    render_current_move(){
        let {category, target, card, player} = this.state;

        if(this.state.type == "response"){
            if(target == null || card == null) throw new Error();

            let parts = [<span>{target.show()} replies:</span>];

            parts.push(<span>Does player {target.show()} have {card.show()} in category {card.category.show()}?</span>);

            {
                let consistent = g.try_respond(true);
                parts.push(<button disabled={!consistent.possible}
                                   title={!consistent.possible ? consistent.reason : undefined}
                                   onClick={this.executeResponse.bind(this, true)}>Yes</button>);
            }

            {
                let consistent = g.try_respond(false);
                parts.push(<button disabled={!consistent.possible}
                                   title={!consistent.possible ? consistent.reason : undefined}
                                   onClick={this.executeResponse.bind(this, false)}>No</button>);
            }

            return parts;
        }else{
            if(target == null && card == null && category == null){
                return [
                    <span>It's {player.show()}'s turn</span>,
                    <span className="help">Pick a target and ask for a card, or proclaim a quartet</span>
                ]
            }

            let parts = [];
            parts.push(<button onClick={() => this.setState({category: null, target: null, card: null})}>Cancel</button>);

            if(category != null){
                parts.push(<span>Proclaim quartet of {category.show()}</span>);
                parts.push(<button onClick={this.executeQuartet.bind(this, category)}>Execute</button>);
                return parts;
            }

            if(target != null) parts.push(<span>from {target.show()}</span>);

            if(card != null) parts.push(<span>ask {card.show()}</span>);

            if(target != null && card != null){
                parts.push(<button onClick={this.executeAsk.bind(this, target, card)}>Execute</button>);
            }

            return parts;
        }
    }
}

export default App;
