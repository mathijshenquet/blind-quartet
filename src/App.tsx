import * as React from 'react';
import './App.css';
import {Game} from "./model/game";
import {Card} from "./model/card";
import {Player} from "./model/player";
import {Category} from "./model/category";
import {MoveAsk, MoveButton, MoveQuartet, MoveResponse} from "./moves";

const g = new Game(2);

interface AppState {
    player: Player;
    type: "response"|"move";
    target: null | Player;
    category: null | Category;
    card: null | Card;
}

class App extends React.Component<{}, AppState> {
    constructor(props: {}){
        super(props);

        let state: any = g.next_action();
        state.category = null;
        state.target = null;
        state.card = null;

        this.state = state;
    }

    private tick(stateUpdate: any) {
        this.setState(stateUpdate);
        this.setState(g.next_action());
    }

    public render() {
        console.log("render", g);

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
        return <div id="categories">{g.categories.map((cat) => cat.render(this))}</div>;
    }

    render_card(card: Card){
        let state = this.state;

        let consistent = MoveAsk.try_card(this.state.player, card);
        const select_button = state.type == "move" && state.category == null && state.card == null
            ? <button className="select" disabled={!consistent.possible} title={!consistent.possible ? consistent.reason : undefined} onClick={() => this.setState({card})}>Select</button>
            : "";

        let excluded, owner;

        if(card.owner == null) {
            const excluded_list = card.get_excluded().map((player) => player.show(this));
            if (excluded_list.length > 0) {
                excluded = <span className="info">- {excluded_list.join(", ")}</span>;
            }
        }else{
            owner = <span className="info">+ {card.owner.show(this)}</span>;
        }

        return <span>{card.show(this)} {excluded} {owner} {select_button}</span>;
    }

    render_actions(){
        return <div id="actions">
            <h2>Actions</h2>
            <table id="log">
                <tr>
                    <th>Player</th>
                    <th>Action</th>
                </tr>
                {this.render_log()}
                <tr className="current">
                    <td>{this.state.player.show(this)}</td>
                    <td>{this.render_current_move()}</td>
                </tr>
            </table>
        </div>;
    }

    render_log() {
        return g.moves.map((move) => <tr>
            <td>{move.player.show()}</td>
            <td>{move.render()}</td>
        </tr>)
    }

    render_current_move(){
        let {category, target, player, card} = this.state;

        if(this.state.type == "response"){
            if(target == null || card == null) throw new Error();

            let parts = [<span>replies: </span>];

            parts.push(<MoveButton move={new MoveResponse(g, target, card,true)}
                                   after={() => this.tick({target: null, card: null})}>Yes</MoveButton>);

            parts.push(<MoveButton move={new MoveResponse(g, target, card,false)}
                                   after={() => this.tick({target: null, card: null})}>No</MoveButton>);

            return parts;
        }else{
            if(target == null && card == null && category == null){
                return <span className="help">Pick a target and ask for a card, or proclaim a quartet</span>;
            }

            let parts = [];

            if(category != null){
                parts.push(<span>Proclaim quartet of {category.show(this)}? </span>);

                parts.push(<MoveButton move={new MoveQuartet(player, category)}
                                       after={() => this.tick({category: null})}>Execute</MoveButton>);

            }else {
                if (target != null) parts.push(<span>from {target.show(this)}</span>);
                if (card != null){
                    parts.push(" ");
                    parts.push(<span>ask {card.show()}</span>);
                }
                parts.push("? ");

                if (target != null && card != null) {
                    parts.push(<MoveButton move={new MoveAsk(player, target, card)}
                                           after={() => this.tick({category: null})}>Execute</MoveButton>);
                }
            }

            parts.push(<button onClick={() => this.setState({category: null, target: null, card: null})}>Cancel</button>);
            return parts;
        }
    }

}

export default App;
