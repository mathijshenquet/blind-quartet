import * as React from 'react';
import './Game.css';
import {Game as GameModel} from "./model/game";
import {Card} from "./model/card";
import {Player} from "./model/player";
import {Category} from "./model/category";
import {Move, MoveAsk, MoveButton, MoveQuartet, MoveResponse} from "./moves";
import {ReactElement} from "react";

interface GameState {
    player: Player;
    type: "response"|"move";
    target: null | Player;
    category: null | Category;
    card: null | Card;
}

interface PartialGameState{
    target?: Player | null,
    category?: Category | null,
    card?: Card | null
}

const emptyPartialState: {target: null, category: null, card: null}
    = {target: null, category: null, card: null}

interface GameProps {
    game: GameModel
}

class Game extends React.Component<GameProps, GameState> {
    constructor(props: GameProps){
        super(props);
        this.state = Object.assign({}, this.computeState(), emptyPartialState);
    }

    private computeState(): any{
        let game = this.props.game;
        game.consistent();

        let last_move = game.last_move;
        if(last_move && last_move instanceof MoveAsk){
            return {
                type: "response",
                player: last_move.target,
                card: last_move.card,
                target: last_move.target,
                category: null
            };
        }else {
            return {
                type: "move",
                player: game.turn,
            };
        }
    }

    private tick(stateUpdate?: PartialGameState) {
        if(stateUpdate) {
            this.setState(stateUpdate as any);
        }else{
            this.setState(emptyPartialState);
        }
        this.setState(this.computeState());
    }

    private forcePlayer(){
        this.props.game.next_player(this.state.player);
        this.tick();
    }

    private undo_until(move: Move){
        this.props.game.undo_until(move);
        this.tick();
    }

    public render() {
        let game = this.props.game;

        return <div id="game">
            <div id="players">
                <h3>Players</h3>
                <ul>{game.players.map((player) => player.render(this))}</ul>
            </div>
            <div id="categories">
                {game.categories.map((cat) => cat.render(this))}
                {this.render_admin()}
            </div>
            {this.render_actions()}
        </div>;
    }

    render_admin(): ReactElement<any> {
        let changeTurn: string | ReactElement<any> = "";
        if(this.state.target){
            let player = this.state.target;
            changeTurn = <p>Change turn to {player.show()}? <button className="btn btn-danger btn-xs" onClick={this.forcePlayer.bind(this)}>execute</button></p>
        }

        let refresh: ReactElement<any> =
            <p>Refresh?
                <button className="btn btn-default btn-xs"
                        onClick={this.tick.bind(this)}>
                    execute
                </button>
            </p>;

        return <div style={{borderColor: "darkgray"}} className="category">
            <h3 style={{color: "darkgray"}}>Admin</h3>
            {changeTurn}
            {refresh}
        </div>;
    }

    render_actions(){
        let game = this.props.game;

        return <div id="actions">
            <h3>Actions</h3>
            <table id="log">
                <tr>
                    <th>Player</th>
                    <th>Action</th>
                </tr>
                {game.moves.map((move) => <tr>
                    <td>{move.player.show()}</td>
                    <td>
                        {move.render()}
                        <button onClick={this.undo_until.bind(this, move)}
                                className="float-right btn btn-xs btn-danger">
                            undo
                        </button>
                    </td>
                </tr>)}
                <tr className="current">
                    <td>{this.state.player.show()}</td>
                    <td>{this.render_current_move()}</td>
                </tr>
            </table>
        </div>;
    }

    render_current_move(){
        let game = this.props.game;
        let {category, target, player, card} = this.state;

        if(this.state.type == "response"){
            if(target == null || card == null) throw new Error();

            let parts: any = [<span>replies: </span>];

            parts.push(<MoveButton move={new MoveResponse(game, target, card, true)}
                                   after={() => this.tick({target: null, card: null})}>Yes</MoveButton>);
            parts.push(" ");
            parts.push(<MoveButton move={new MoveResponse(game, target, card, false)}
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

            parts.push(" ");
            parts.push(<button className="btn btn-xs btn-default" onClick={() => this.setState({category: null, target: null, card: null})}>Cancel</button>);
            return parts;
        }
    }
}

export default Game;
