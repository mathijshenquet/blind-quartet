
export class Stateful<S>{
    state: S;
    previousStates: Array<S>;

    constructor(state: S){
        this.state = state;
        this.previousStates = [];
    }

    pop_state(){
        let prev = this.previousStates.pop();
        if(prev != undefined) {
            this.state = prev;
        }
    }

    push_state(){
        this.previousStates.push(this.state);
    }
}