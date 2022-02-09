import {Role} from "../../role/role";


type DirectionRule = (creep: Creep | PowerCreep, toDir: DirectionConstant) => DirectionConstant;

const defaultCross: DirectionRule = (creep: Creep | PowerCreep, toDir: DirectionConstant): DirectionConstant => {
    let tmpRes = [toDir + 1, toDir - 1, toDir + 2, toDir - 2, toDir + 3, toDir - 3, toDir + 4, toDir];
    let dirs: DirectionConstant[] = tmpRes.map((dir: DirectionConstant) => {
        if (dir < 1) {
            dir = <DirectionConstant>(8 + dir);
        }
        if (dir > 8) {
            dir = <DirectionConstant>(dir - 8);
        }
        return dir;
    });
    let res: DirectionConstant = dirs.find((dir: DirectionConstant) => creep.pos.dirToPos(dir).walkable);
    return res ? res : dirs[6];
};

const crossToTarget: DirectionRule = (creep: Creep | PowerCreep, toDir: DirectionConstant): DirectionConstant => {
    if (creep.memory.target) {
        let target: RoomObject = Game.getObjectById(creep.memory.target);
        if (target) {
            let dir: DirectionConstant = creep.pos.getDirectionTo(target);
            if (dir) {
                let tmpRes = [dir, dir + 1, dir - 1, dir + 2, dir - 2];
                let dirs: DirectionConstant[] = tmpRes.map((dir: DirectionConstant) => {
                    if (dir < 1) {
                        dir = <DirectionConstant>(8 + dir);
                    }
                    if (dir > 8) {
                        dir = <DirectionConstant>(dir - 8);
                    }
                    return dir;
                });
                let res: DirectionConstant = dirs.find((dir: DirectionConstant) => creep.pos.dirToPos(dir).walkable);
                if (res) {
                    return res;
                }
            }
        }
    }
    return defaultCross(creep, toDir);
};

export type CROSS_DIRECTION = {
    [role in Role | 'default' | 'pc']?: DirectionRule
}

const crossDirection: CROSS_DIRECTION = {
    default: defaultCross,
    pc: defaultCross,
    [Role.Worker]: crossToTarget,
};

export default crossDirection;