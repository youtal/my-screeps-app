import {Role} from "./role/role";

declare global {
    type ROOM_NAME = `${'W' | 'E'}${number}${'N' | 'S'}${number}`

    interface PowerCreepMemory {
        role: Role;
        stand?: boolean;
        working?: boolean;
        fromShard: string;
    }

    interface CreepMemory {
        role: Role;
        stand?: boolean;
        working?: boolean;
        fromShard: string;
    }

    interface Memory {
        //寻路时将避开以数组内元素为名的房间
        avoidRooms?: string[];
        //单向屏蔽入口
        avoidExits?: { [from: ROOM_NAME]: ROOM_NAME };
    }

    interface Creep{
    }

    interface PowerCreep{
    }
    interface RoomPosition {
        //用于判断当前位置是否在路径期望位置上
        onPath(path: number[], idx: number): boolean;
        dirToPos(dir: DirectionConstant): RoomPosition
    }
}