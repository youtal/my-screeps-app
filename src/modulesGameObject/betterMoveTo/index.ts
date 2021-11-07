/**
 * key:形如'12,20,W42N21;20,35,W43N20;00'或‘W42N21;12,20;20,35;10’
 *
 *其中最后两位数字的意义为：00-考虑沼泽和路，10-不考虑沼泽，但考虑路，以此类推
 */
interface PATH_CACHE {
    [key: string]: PATH_CACHE_UNIT
}

/**
 *@param posArray pathFinder.search()返回值中的path成员
 *
 *@param lastUsed 上次使用该路径缓存的Game.time
 **/
interface PATH_CACHE_UNIT {
    posArray: RoomPosition[]
    lastUsed: number
}

interface moveOption {
    //忽略沼泽
    ignoreSwap?: boolean
    //忽略路
    ignoreRoads?: boolean
    //画出路径
    showPath?: boolean
    //显示下一tic计划移动的位置
    showNextPos?: boolean
    //到目标附近的范围
    range?: number
    //最多寻路房间
    maxRooms?: number

}

function findPath(origin: RoomPosition, goal: RoomPosition, ops: moveOption = {}) {
    ops = _.defaults(ops, {range: 1}, {maxRooms: 16})
    const rawPath = PathFinder.search(origin, goal)
}

function roomCallBack(roomName): CostMatrix {
    return null
}

const goTO = function (creep: Creep, target: RoomPosition, ops: moveOption = {}) {
    if (!creep.my) return ERR_NOT_OWNER
    if (!!creep.fatigue) return ERR_TIRED
    if (creep.spawning) return ERR_BUSY
    if (!creep.getActiveBodyparts(MOVE)) return ERR_NO_BODYPART
    if (target.x > 49 || target.y < 0 || target.y > 49 || target.y < 0 || (typeof target.roomName) !== "string")
        return ERR_INVALID_TARGET

}

export default goTO