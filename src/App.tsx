import * as React from 'react';
import './App.css';
import {Game} from "./model/game";
import {Card, Player} from "./model/state";
import {Category} from "./model/category";


const g = new Game(5);

interface AppState {
    category: null | Category;
    target: null | Player;
    card: null | Card;
}

class App extends React.Component<any, AppState> {
    constructor(props: any){
        super(props);
        this.state = {category: null, target: null, card: null};
    }

    render_actions(){
        let action = g.next_action();
        if(action.type == "response"){
            return this.render_pick_response(action.player);
        }else{
            return this.render_pick_ask(action.player);
        }
    }

    executeAsk(target: Player, card: Card){
        g.move_ask(target, card);
        this.setState({target: null, category: null, card: null});
    }

    executeResponse(did_have: boolean){
        g.move_respond(did_have);
        this.setState({target: null, category: null, card: null});
    }

    render_pick_response(player: Player){

        if(g.last_move == null || g.last_move.type != "ask") throw new Error();

        let {target, card} = g.last_move;

        const question = <span>Does player {target.show()} have {card.show()} in category {card.category.show()}?</span>;

        return <div id="actions">
            <h3>{player.show()} has to reply</h3>
            {question}
            <button onClick={this.executeResponse.bind(this, true)}>Yes</button>
            <button onClick={this.executeResponse.bind(this, false)}>No</button>
        </div>;
    }

    render_pick_ask(player: Player){
        let parts = [];

        // noinspection LoopStatementThatDoesntLoopJS
        while(true){
            let {category, target, card} = this.state;

            if(category == null){
                parts.push(<ul>
                    {g.categories.map((category) => {
                        let res = g.try_ask_cat(player, category);
                        return <li>
                            <button disabled={!res.possible} title={!res.possible ? res.reason : ""} onClick={() => this.setState({category})}>
                                In {category.show()}
                            </button>
                        </li>;
                    })}
                </ul>);
                break;
            }else{
                parts.push(<button onClick={() => this.setState({category: null, target: null, card: null})}>Cancel</button>);
                parts.push(<span>In {category.show()}</span>);
            }

            if(target == null){
                parts.push(<ul>
                    {g.players.map((target) => <li><button onClick={() => this.setState({target})}>From {target.show()}</button></li>)}
                </ul>);
                break;
            }else{
                parts.push(<span>From {target.show()}</span>);
            }

            if(card == null){
                parts.push(<ul>
                    {category.cards.map((card) => {
                        let res = g.try_exclude(player, card);
                        return <li>
                            <button disabled={!res.possible} title={!res.possible ? res.reason : ""} onClick={() => this.setState({card})}>
                                 Ask {card.show()}
                            </button>
                        </li>;
                    })}
                </ul>);
                break;
            }else{
                parts.push(<span>Ask {card.show()}</span>);
            }

            parts.push(<button onClick={this.executeAsk.bind(this, target, card)}>Execute</button>);
            break;
        }

        return <div id="actions">
            <h3>It's {player.show()} turn</h3>
            {parts}
        </div>;
    }

    public render() {
        console.log(g);

        return <div id="game">
            {g.render_players()}
            {g.render_categories()}
            {g.render_log()}
            {this.render_actions()}
        </div>;
    }
}

export default App;
