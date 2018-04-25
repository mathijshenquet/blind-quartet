import App from "../App";
import * as React from "react";

export interface Entity<S> {
    get_kind(): string;
    get_style(): any;
}

export class Entity<S>{
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

    end_edit(app: App){
        this.modifying = false;
        app.forceUpdate();
    }

    show(app?: App): any {
        if(this.modifying && app != undefined){
            return <input autoFocus type="text" value={this.name} onChange={(event) => {
                this.name = event.target.value;
                app.forceUpdate();
            }} onBlur={this.end_edit.bind(this, app)} onKeyPress={event => {
                if (event.key == 'Enter')
                    this.end_edit(app)
            }}/>
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