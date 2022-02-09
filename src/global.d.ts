import {Role} from "./role/role";
declare global {
    type ROOM_NAME = `${'W' | 'E'}${number}${'N' | 'S'}${number}`
    type actionStage = 'prepare' | 'charge' | 'working'
    interface PowerCreepMemory {
        target?: Id<RoomObject>;
        stand?: boolean;
        fromShard?: string;
        actionStage?: actionStage;
    }

    interface CreepMemory {
        target?: Id<RoomObject>;
        role: Role;
        stand?: boolean;
        fromShard?: string;
        actionStage?: actionStage;
    }

    interface Memory {
        //寻路时将避开以数组内元素为名的房间
        avoidRooms?: string[];
        //单向屏蔽入口
        avoidExits?: { [from: ROOM_NAME]: ROOM_NAME };
    }

    interface Creep {
        isMoving: boolean;
    }

    interface PowerCreep {
        isMoving: boolean;
    }

    interface RoomMemory{
        center?:number[];
    }

    interface RoomPosition {
        //用于判断当前位置是否在路径期望位置上
        onPath(path: number[], idx: number): boolean;
        //将相对方向转换为位置
        dirToPos(dir: DirectionConstant): RoomPosition;

        //是否可通行
        walkable: boolean;
    }
}