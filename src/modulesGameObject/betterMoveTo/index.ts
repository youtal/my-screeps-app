import crossRules from "./crossRules";
import {parseInt} from "lodash";
import {getNearPos} from "../../utils";
import * as _ from "lodash";


//swap、plain的cost对照表，键为是否忽略swap或road
const terrainCost = {
    '00': [10, 2],
    '10': [2, 2],
    '01': [5, 1],
    '11': [1, 1]
};
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
//CostMatrix建立时间超过这个数字的CostMatrix视为过期，未启用。
const COST_MATRIX_UPDATE_INTERVAL = 10000;

//路径有效期
const PATH_INTERVAL = 100000;

//路径缓存
let pathCache: PATH_CACHE = {};
//按照creep正在使用的路径缓存
let creepPathCache: CREEP_PATH_CACHE = {};
//CostMatrix缓存，后缀表示是否忽略沼泽和路
let costMatrixCache: { [roomName: string]: CostMatrix } = {};


/**
 * key:形如'12,20,W42N21;20,35,W43N20;00'或‘W42N21;12,20;20,35;10’
 *
 *其中最后两位数字的意义为：00-考虑沼泽和路，10-不考虑沼泽，但考虑路，以此类推(前一位为沼泽，后一位为路)
 */
interface PATH_CACHE {
    [key: string]: PATH_CACHE_UNIT;
}

/**
 *@param posArray pathFinder.search()返回值中的path成员
 *
 *@param generateTime 该路径生成时的Game.time
 *
 **/
interface PATH_CACHE_UNIT {
    path: number[];
    generateTime: number;
}

interface CREEP_PATH_CACHE {
    [creepName: string]: CREEP_PATH_CACHE_UNIT;
}

/**
 *@param path 压缩后的路径数组
 *
 * @param idx 用于标记creep目前进行到path的位置
 * */
interface CREEP_PATH_CACHE_UNIT {
    path: number[],
    idx: number
}

interface moveOption {
    //寻路时忽略creep
    ignoreCreeps?: boolean;
    //忽略沼泽
    ignoreSwap?: boolean;
    //忽略路
    ignoreRoads?: boolean;
    //禁用对穿
    disableCross?: boolean;
    //画出路径
    showPath?: boolean;
    //显示下一tic计划移动的位置
    showNextPos?: boolean;
    //到目标附近的范围
    range?: number;
    //最多寻路房间
    maxRooms?: number;
    //最大寻路消耗
    maxOps?: number;
    //是否跨shard移动
    crossShard?: boolean;
    //临时路径，为真时，此次寻路不会被缓存
    tmpPath?: boolean;

}

//房间类型
enum roomType {
    highWay,
    my,
    default,
    armedCenter,
    infinity
}

//配置各个房间类型在寻路活动中的权重
const roomWeight: { [tp in roomType]: number } = {
    [roomType.highWay]: 1,
    [roomType.my]: 1.5,
    [roomType.default]: 2,
    [roomType.armedCenter]: 4,
    [roomType.infinity]: Infinity
};

//根据输入房间名称确定房间寻路权重
function evalRoomWight(name: ROOM_NAME): number {
    let rp = roomType.default;
    let room = Game.rooms[name];
    let parsed = /^[WE]([0-9]+)[NS]([0-9]+)$/.exec(name);
    if ((parseInt(parsed[1]) % 10 === 0) || (parseInt(parsed[2]) % 10 === 0)) {
        rp = roomType.highWay;
    } else if (room.controller && room.controller.my) {
        rp = roomType.my;
    } else if (parseInt(parsed[1]) % 10 === (4 || 6) && parseInt(parsed[2]) % 10 === (4 || 6)) {
        rp = roomType.armedCenter;
    }

    return roomWeight[rp];
}

/**
 * 寻路时默认忽略creep
 * */
function findPath(start: RoomPosition, goal: RoomPosition, ops: moveOption = {}): number[] {
    //ops.ignoreCreeps = ops.ignoreCreeps === undefined ? true : ops.ignoreCreeps;
    _.defaults(ops, {
        ignoreCreeps: true,
        maxOps: 4000,
        maxRooms: 16
    });
    let allowedRooms: { [roomName: string]: boolean } = {};
    allowedRooms[goal.roomName] = true;
    //如果起始位置和终点位置不在同一个房间，则开始确定路径要通过的房间
    if (start.roomName !== goal.roomName) {
        let res = Game.map.findRoute(start.roomName, goal.roomName, {
            routeCallback(roomName, fromRoomName) {
                //检查是否为屏蔽房间
                if (Memory.avoidRooms && Memory.avoidRooms.includes(roomName))
                    return roomWeight[roomType.infinity];
                //检查是否为屏蔽入口
                if (Memory.avoidExits && fromRoomName in Memory.avoidExits && (Memory.avoidExits[fromRoomName]) === roomName)
                    return roomWeight[roomType.infinity];
                return evalRoomWight(roomName as ROOM_NAME);
            }
        });
        if (res === ERR_NO_PATH) return null;
        else res.forEach(node => allowedRooms[node.room] = true);
    }
    const rawPath = PathFinder.search(start, {pos: goal, range: ops.range ? ops.range : undefined}, {
        // maxOps: ops.maxOps || 4000,
        // maxRooms: ops.maxRooms || 16,
        roomCallback(roomName: string): boolean | CostMatrix {
            //检查房间是否在allowedRooms内
            if (!allowedRooms[roomName]) return false;

            //生成costMatrix缓存key
            const swapSymbol = ops.ignoreSwap ? 1 : 0;
            const roadSymbol = ops.ignoreRoads ? 1 : 0;
            const costMatrixKey = `${roomName}${swapSymbol}${roadSymbol}`;

            //尝试读取缓存中的CostMatrix
            if (costMatrixCache[costMatrixKey])
                return costMatrixCache[costMatrixKey].clone();

            //根据配置确定swap和plain的cost
            const terrainCostKey = `${swapSymbol}${roadSymbol}`;
            let [swapCost, plainCost] = [terrainCost[terrainCostKey][0], terrainCost[terrainCostKey][1]];

            //生成新的costMatrix，并按照地形权重配置
            let cost = new PathFinder.CostMatrix;
            const terrain = new Room.Terrain(roomName);
            for (let x = 0; x < 50; ++x) for (let y = 0; y < 50; ++y) {
                const type = terrain.get(x, y);
                const weight =
                    type === TERRAIN_MASK_WALL ? 0xff :
                        type === TERRAIN_MASK_SWAMP ? swapCost : plainCost;
                cost.set(x, y, weight);
            }
            //房间没视野，返回仅根据地形配置了cost的costMatrix，且不进行缓存
            const room = Game.rooms[roomName];
            if (!room) return cost;
            //首先将source周围的cost调高，目的是让creep倾向规避source周围，避免影响harvester工作
            //此步放在按照地形权重配置之后，覆盖地形权重
            //TODO：房间对象访问缓存实现后，应换为房间对象缓存访问
            const sources = room.find(FIND_SOURCES);
            sources.forEach(s => {
                let nearPos = getNearPos(s.pos);
                nearPos.forEach(pos => {
                    let {x, y} = pos;
                    if (terrain.get(x, y) !== (TERRAIN_MASK_WALL || TERRAIN_MASK_LAVA))
                        cost.set(x, y, swapCost * 5);
                });
            });

            const addCost = (item: Structure | ConstructionSite) => {
                // 更倾向走道路
                if (item.structureType === STRUCTURE_ROAD) {
                    // 造好的路可以走
                    if (item instanceof Structure) cost.set(item.pos.x, item.pos.y, 1);
                    // 路的工地保持原有 cost
                    else return;
                }
                // 非我rampart即视为不可通过，无论是否为public状态，防止被放风筝
                else if (item instanceof StructureRampart) {
                    if (!item.my) cost.set(item.pos.x, item.pos.y, 0xff);
                    else return;
                }
                //挡路建筑设为255
                else if (obstacles.includes(item.structureType)) {
                    cost.set(item.pos.x, item.pos.y, 0xff);
                }
            };

            //按照建筑配置
            const structures = room.find(FIND_STRUCTURES);
            const sites = room.find(FIND_CONSTRUCTION_SITES);
            structures.forEach(addCost);
            sites.forEach(addCost);


            if (!ops.ignoreCreeps) {
                //躲避不可对穿的creep
                room.find(FIND_CREEPS).forEach(toCross => {
                    if (
                        ops.disableCross ||
                        !toCross.my ||
                        !(crossRules[toCross.memory.role] || crossRules.default)(toCross)) {
                        cost.set(toCross.pos.x, toCross.pos.y, 0xff);
                    }
                });

                //躲避非己方pc
                room.find(FIND_POWER_CREEPS).forEach(pc => {
                    if (ops.disableCross ||
                        !pc.my ||
                        !(crossRules['pc'])(pc)) {
                        cost.set(pc.pos.x, pc.pos.y, 0xff);
                    }
                });
            }

            // 跨 shard creep 需要解除目标 portal 的不可移动性（如果有的话）
            if (ops.crossShard && goal.roomName === roomName) {
                const portal = goal.lookFor(LOOK_STRUCTURES).find(s => s.structureType === STRUCTURE_PORTAL);
                if (portal) cost.set(goal.x, goal.y, 2);
            }

            costMatrixCache[costMatrixKey] = cost.clone();
            return cost;
        }
    });
    let serializedPath = dealWithPosArr(rawPath.path, start);
    if (!serializedPath) return null;
    const swapSymbol = ops.ignoreSwap ? true : false;
    const roadSymbol = ops.ignoreRoads ? true : false;
    //临时寻路不缓存
    if (!ops.tmpPath) {
        let routeKey = generateRouteKey(start, goal, swapSymbol, roadSymbol);
        pathCache[routeKey] = {path: serializedPath, generateTime: Game.time};
    }
    return serializedPath;
}

function generateRouteKey(start: RoomPosition, goal: RoomPosition, swapSymbol: boolean, roadSymbol: boolean): string {
    return start.roomName === goal.roomName ?
        `${goal.roomName};${start.x},${start.y};${goal.x},${goal.y};${swapSymbol}${roadSymbol}` :
        `${start.x},${start.y},${start.roomName};${goal.x},${goal.y},${goal.roomName};${swapSymbol}${roadSymbol}`;
}

/**
 *
 * */
function dealWithPosArr(posArr: RoomPosition[], pos: RoomPosition): number[] {
    //起始位置与creep自身位置不同，将creep自身位置加入到路径头
    if (!posArr[0].isEqualTo(pos)) posArr.splice(0, 0, pos);
    //至少两个position才能构成一条路径
    if (posArr.length < 2) return null;
    let res: number[] = new Array(posArr.length + 1).fill(0);
    let idx = 0;
    posArr.forEach((val, index, arr) => {
        // 最后一个位置就不用再移动
        if (index >= arr.length - 1) return;
        // 由于房间边缘地块会有重叠，所以这里筛除掉重叠的步骤
        if (val.roomName === arr[index + 1].roomName) return;
        let [r1, r2] = [Math.ceil(idx / 3), idx % 3 * 10];
        res[r1] |= (
            //前四位为移动方向
            val.getDirectionTo(arr[index + 1]) |
            //中间三位为x的低三位
            (val.x & 0b111) << 4 |
            //最后三位为y的低三位
            (val.y & 0b111) << 7
        ) << r2;
        ++idx;
    });
    //添加posArr最后一个元素
    let [r1, r2, last] = [Math.ceil(idx / 3), idx % 3 * 10, posArr[posArr.length - 1]];
    res[r1] |= (
        (last.x & 0b111) << 4 |
        (last.y & 0b111) << 7
    ) << r2;
    //加入末尾位置用于校验
    res[++r1] = last.x | (last.y << 6);
    //裁剪多余元素
    res.splice(++r1);
    return res;
}

function checkPathTarget(path: number[], target: RoomPosition): boolean {
    let end = target.x | target.y << 6;
    return end === path[path.length - 1];
}

const goTo = function (creep: Creep | PowerCreep, target: RoomPosition, ops: moveOption = {}) {
    if (!creep.my) return ERR_NOT_OWNER;
    if (creep instanceof Creep) {
        if (!!creep.fatigue) return ERR_TIRED;
        if (creep.spawning) return ERR_BUSY;
        if (!creep.getActiveBodyparts(MOVE)) return ERR_NO_BODYPART;
    }
    if (target.x > 49 || target.y < 0 || target.y > 49 || target.y < 0 || (typeof target.roomName) !== "string")
        return ERR_INVALID_TARGET;

    let [path, idx] = [[], 0];
    //首先看看有没有已经正在使用的缓存,并检查位置是否正确
    if (creepPathCache[creep.name]) {
        let curPath = creepPathCache[creep.name];
        //没有任何意外
        if (checkPathTarget(curPath.path, target) && creep.pos.onPath(curPath.path, curPath.idx))
            [path, idx] = [curPath.path, curPath.idx];
        //目标对，但是目前位置不对
        else if (checkPathTarget(curPath.path, target)) {
            //在上一个位置，说明被挡路了，要看看有没有建筑，或者请求下对穿
            if (creep.pos.onPath(curPath.path, curPath.idx - 1)) {

            }
        }
    } else {
        //没有正在使用的缓存，尝试从路径缓存中读取
        let routeKey = generateRouteKey(creep.pos, target, ops.ignoreSwap, ops.ignoreRoads);
        if (pathCache[routeKey] && Game.time - pathCache[routeKey].generateTime < PATH_INTERVAL)
            [path, idx] = [pathCache[routeKey].path, 0];
        //缓存中也没有，寻路
        else
            [path, idx] = [findPath(creep.pos, target, ops), 0];
    }
};

/**用于请求对穿
 *
 * @param creep 对穿发起creep
 * @param dir 发起对穿方向
 * */
function requireCross(creep: Creep, dir: DirectionConstant) {
    let frontPos = creep.pos.dirToPos(dir);
    if (!frontPos)
        return ERR_INVALID_ARGS;
    const frontCreep = frontPos.lookFor(LOOK_CREEPS)[0];
    const frontObstacles = frontPos.lookFor(LOOK_STRUCTURES).filter(str => obstacles.includes(str.structureType));
    if (!frontCreep && !frontObstacles)
        return ERR_NOT_FOUND;
    if (frontObstacles.length > 0)
        return ERR_NO_PATH;
}