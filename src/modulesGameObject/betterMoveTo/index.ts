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

//不能通过的建筑
const obstacles = [
    "spawn",
    "controller",
    "constructedWall",
    "extension",
    "link",
    "storage",
    "tower",
    "observer",
    "powerSpawn",
    "lab",
    "terminal",
    "nuker",
    "factory",
    "invaderCore"
];

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

            //根据配置确定swap和plain的cost
            const terrainCostKey = `${swapSymbol}${roadSymbol}`
            let [swapCost, plainCost] = [terrainCost[terrainCostKey][0], terrainCost[terrainCostKey][1]]

            //生成新的costMatrix,并按照地形权重配置
            let cost = new PathFinder.CostMatrix
            const terrain = new Room.Terrain(roomName)
            for (let x = 0; x < 50; ++x) for (let y = 0; y < 50; ++y) {
                const type = terrain.get(x, y)
                const weight =
                    type === TERRAIN_MASK_WALL ? 0xff :
                        type === TERRAIN_MASK_SWAMP ? swapCost : plainCost
                cost.set(x, y, weight)
            }

            const addCost = (item: Structure | ConstructionSite) => {
                // 更倾向走道路
                if (item.structureType === STRUCTURE_ROAD) {
                    // 造好的路可以走
                    if (item instanceof Structure) cost.set(item.pos.x, item.pos.y, 1)
                    // 路的工地保持原有 cost
                    else return
                }
                // 非我rampart即视为不可通过，无论是否为public状态，防止被放风筝
                else if (item instanceof StructureRampart) {
                    if (!item.my) cost.set(item.pos.x, item.pos.y, 0xff)
                    else return;
                }
                //挡路建筑设为255
                else if (obstacles.includes(item.structureType)) {
                    cost.set(item.pos.x, item.pos.y, 0xff)
                }
            }

            //按照建筑配置
            const structures = room.find(FIND_STRUCTURES)
            const sites = room.find(FIND_CONSTRUCTION_SITES)
            structures.forEach(addCost)
            sites.forEach(addCost)

            //按照ops.ignoreCreep和ops.disableCross来确定creep所占权重

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