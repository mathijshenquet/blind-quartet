
export class Stateful<S>{
    state: S;
    previousStates: Array<S>;

    constructor(state: S){
        this.state = state;
        this.previousStates = [];
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
}