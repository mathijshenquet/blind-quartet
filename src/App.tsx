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
    game: Game;
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
        state.game = null;

        this.state = state;
    }

    private tick(stateUpdate: any) {
        this.setState(stateUpdate);
        this.setState(g.next_action());
    }

    public render() {
        return <div id="game">
            <div id="players">
                <h3>Players</h3>
                <ul>{g.players.map((player) => player.render(this))}</ul>
            </div>
            <div id="categories">
                {g.categories.map((cat) => cat.render(this))}
            </div>
            {this.render_actions()}
        </div>;
    }

    render_actions(){
        return <div id="actions">
            <h2>Actions</h2>
            <table id="log">
                <tr>
                    <th>Player</th>
                    <th>Action</th>
                </tr>
                {g.moves.map((move) => <tr>
                    <td>{move.player.show()}</td>
                    <td>{move.render()}</td>
                </tr>)}
                <tr className="current">
                    <td>{this.state.player.show()}</td>
                    <td>{this.render_current_move()}</td>
                </tr>
            </table>
        </div>;
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
                if (target != null) parts.push();

                let $card = <span>ask {card == null ? "..." : card.show()}</span>;
                let $target = <span>from {target == null ? "..." : target.show()}</span>;

                parts.push([$card, " ", $target, "? "]);

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
