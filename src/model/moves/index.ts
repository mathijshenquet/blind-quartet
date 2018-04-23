import {move_ask, try_ask, MoveAsk} from "./ask";
import {move_respond, try_respond, MoveResponse} from "./respond";
import {move_quartet, MoveQuartet, try_quartet} from "./quartet";

export type Move = MoveAsk | MoveQuartet | MoveResponse;

export {move_ask, try_ask};
export {move_respond, try_respond};
export {move_quartet, try_quartet};