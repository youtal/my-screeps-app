import {NodeWithPriority} from "../PriorityQueue/types";


export interface roomNode extends NodeWithPriority {
    //
    roomName:ROOM_NAME
    //由哪个房间扩展过来
    from?: ROOM_NAME,
    //Fn = Gn + Pn
    Fn: number
    Gn: number

}