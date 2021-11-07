//路径缓存
let pathCache: PATH_CACHE = {}

//CostMatrix建立时间超过这个数字的CostMatrix视为过期
const COST_MATRIX_UPDATE_INTERVAL = 10000
//CostMatrix缓存，后缀表示是否忽略沼泽和路
let costMatrix: { [roomName: string]: { matrix: CostMatrix, generateTime: number } } = {}
//swap、plain的cost对照表，键为是否忽略swap或road
const terrainCost = {
    '00': [10, 2],
    '10': [2, 2],
    '01': [5, 1],
    '11': [1, 1]
}

/**
 * key:形如'12,20,W42N21;20,35,W43N20;00'或‘W42N21;12,20;20,35;10’
 *
 *其中最后两位数字的意义为：00-考虑沼泽和路，10-不考虑沼泽，但考虑路，以此类推(前一位为沼泽，后一位为路)
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
    //最大寻路消耗
    maxOps?: number

}

function findPath(origin: RoomPosition, goal: RoomPosition, ops: moveOption = {}) {
    const rawPath = PathFinder.search(origin, {pos: goal, range: ops.range || 1}, {
        maxOps: ops.maxOps || 4000,
        maxRooms: ops.maxRooms || 16,
        roomCallback(roomName: string): boolean | CostMatrix {
            //检查并尝试获取回避房间
            const avoidRooms = Memory.avoidRooms ? Memory.avoidRooms : []
            if (avoidRooms.includes(roomName)) return false

            //生成costMatrix缓存key
            const swapSymbol = ops.ignoreSwap ? 1 : 0
            const roadSymbol = ops.ignoreRoads ? 1 : 0
            const costMatrixKey = `${roomName}${swapSymbol}${roadSymbol}`

            //尝试读取缓存中的CostMatrix
            if (costMatrixKey[costMatrixKey] && Game.time - costMatrixKey[costMatrixKey].generateTime < COST_MATRIX_UPDATE_INTERVAL)
                return costMatrixKey[costMatrixKey].matrix.clone()

            //房间没视野直接返回空
            const room = Game.rooms[roomName]
            if (!room) return

            //生成CostMatrix
            const terrainCostKey = `${swapSymbol}${roadSymbol}`
            let [swapCost, plainCost] = [terrainCost[terrainCostKey][0], terrainCost[terrainCostKey][1]]

        }
    })
}

//@NOTE 已废弃
function roomCallBack00(roomName) {

    /*//检查并尝试获取回避房间
    const avoidRooms = Memory.avoidRooms ? Memory.avoidRooms : []
    if (avoidRooms.includes(roomName)) return false

    //尝试读取缓存中的CostMatrix
    if (costMatrix00[roomName] && Game.time - costMatrix00[roomName].generateTime < COST_MATRIX_UPDATE_INTERVAL)
        return costMatrix00[roomName].matrix.clone()*/

    /*  //房间没视野直接返回空
      const room = Game.rooms[roomName]
      if (!room) return*/

    //生成CostMatrix
    let costs = new PathFinder.CostMatrix
    const terrain = new Room.Terrain(roomName)
    // 设置基础地形 cost
    for (let x = 0; x < 50; x++) for (let y = 0; y < 50; y++) {
        const tile = terrain.get(x, y);
        const weight =
            tile === TERRAIN_MASK_WALL ? 0xff :
                tile === TERRAIN_MASK_SWAMP ? 10 : 2

        costs.set(x, y, weight)
    }


}

const goTo = function (creep: Creep, target: RoomPosition, ops: moveOption = {}) {
    if (!creep.my) return ERR_NOT_OWNER
    if (!!creep.fatigue) return ERR_TIRED
    if (creep.spawning) return ERR_BUSY
    if (!creep.getActiveBodyparts(MOVE)) return ERR_NO_BODYPART
    if (target.x > 49 || target.y < 0 || target.y > 49 || target.y < 0 || (typeof target.roomName) !== "string")
        return ERR_INVALID_TARGET

}

export default goTo