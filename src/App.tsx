import {Game} from "./model/game";
import * as React from "react";
import GameView from "./Game";

interface AppState {
    game: Game | null,
    showInfo: boolean,
}

export class App extends React.Component<any, AppState> {
    constructor(props: any){
        super(props);
        this.state = {game: null, showInfo: false};
    }

    startGame(length: number){
        this.setState({game: new Game(length)});
    }

    render(){
        let {game, showInfo} = this.state;
        if(game == null || showInfo){
            let picks = [3,4,5,6].map((i) => <button className="btn btn-default btn-sm" key={i} onClick={this.startGame.bind(this, i)}>{i} players</button>);

            return <div id="explain">
                <h1>Blind quartet</h1>

                <p>Blind Quartets works similarly to regular Quartets, in that
                    each player's goal is to collect as many 'quartets', sets of
                    4 cards from the same category, as possible. The difference
                    is that the categories and cards therein are initially unknown
                    (hence 'Blind') and are only established during the game
                    itself, instead of being fixed beforehand. In fact, the
                    'cards' are completely imaginary, and no physical items of
                    any sort are required to play this game.</p>

                <h2>Basics</h2>
                <p>Each player starts with 4 hand cards and must attempt to collect as many sets of 4 cards as possible. The players take turns requesting a specific card from a specific category from any other player they wish. For example, at the start of the game, Player 1 could ask Player 2 'do you have the card kB from the category fundamental constants?' If Player 2 decides that they indeed have card, they say so; Player 1 then receives the card and may ask another card from any player. If Player 2 decides they do not have the card, Player 1's turn ends.</p>

                <p>
                    Which cards and categories are in play, and which player owns which cards, is initially unknown, but becomes clear in the course of the game. For example, the above request made by Player 1 would establish the following facts:
                </p>
                    <ol>
                        <li>There exists a category 'fundamental constants'</li>
                        <li>The category 'fundamental constants' contains a card 'kB'</li>
                        <li>Player 1 does not currently own kB.</li>
                        <li>Player 1 does currently own a different card from that category</li>
                    </ol>
                <p>Eventually, one can deduce exactly which player owns which card, at which point your job is to simply request those cards and assemble them into quartets.</p>

                <h2>Rules</h2>
                <ul>
                    <li>You are obliged to request a card if it is your turn and you have at least 1 active card.</li>
                    <li>You may only ask one card from one player at a time.</li>
                    <li>You may only ask a card from a category from which you already have at least 1 card. This implies that a player with 0 active cards cannot ask anything anymore.</li>
                    <li>You may not ask a card that does not exist (once all categories and cards in the game have been defined, this rule becomes important).</li>
                    <li>You may not ask a card that you have yourself.</li>
                </ul>

                <p>The single important most important rule in the game is <b>'everything still possible is allowed'</b>.</p>

                <h2>Start game</h2>
                <p>Start a game with: {picks}</p>
            </div>;
        }else{
            return <GameView game={game} />;
        }
    }
}