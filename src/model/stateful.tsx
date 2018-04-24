import App from "../App";
import * as React from "react";

export interface Stateful<S> {
    get_kind(): string;
    get_style(): any;
}

export class Stateful<S>{
    state: S;
    previousStates: Array<S>;

    id: number;
    name: string;
    modifying: boolean;

    constructor(id: number, state: S){
        this.state = state;
        this.previousStates = [];
        this.id = id;
        this.name = "";
        this.modifying = false;
    }

    pop_state(){
        let state = this.previousStates.pop();
        if(state != null) {
            this.state = state;
        }else{
            throw new Error();
        }
    }

    push_state(){
        this.previousStates.push(Object.assign({}, this.state));
    }

    show(app?: App): any {
        if(this.modifying && app != undefined){
            return <input type="text" value={this.name} onChange={(event) => {
                this.name = event.target.value;
                app.forceUpdate();
            }} onBlur={() => {
                this.modifying = false;
                app.forceUpdate();
            }} />
        }

        let inner = <span className={this.name == "" ? "placeholder" : ""} style={this.get_style()}>
            {this.name != "" ? this.name : this.get_kind()+" #"+(this.id + 1)}
        </span>;
        if(app == null){
            return inner;
        }

        return <span onClick={() => {
            this.modifying = true;
            app.forceUpdate();
        }}>{inner}</span>;
    }
}