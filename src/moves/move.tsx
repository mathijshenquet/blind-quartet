import * as React from "react";
import {Result} from "../model/result";
import {ReactNode} from "react";
import {Player} from "../model/player";
import {Game} from "../model/game";

export class Move{
    game: Game;
    player: Player;

    constructor(game: Game, player: Player){
        this.game = game;
        this.player = player;
    }

    execute(){
        this.game.log_move(this);
        this.run();
    }

    try(): Result {
        let game = this.game;
        game.push_state();
        this.run();
        let consistent = game.consistent();
        game.pop_state();
        return consistent;
    }
}

export interface Move{
    run(): void;
    render(): any;
}

interface MoveButtonProps {
    move: Move,
    after: () => void,
}

export class MoveButton extends React.Component<MoveButtonProps, {}> {
    render(): ReactNode{
        let consistent = this.props.move.try();
        return <button disabled={!consistent.possible}
                       title={!consistent.possible ? consistent.reason : undefined}
                       onClick={this.execute.bind(this)}>{this.props.children}</button>;
    }

    execute(){
        this.props.move.execute();
        this.props.after();
    }
}