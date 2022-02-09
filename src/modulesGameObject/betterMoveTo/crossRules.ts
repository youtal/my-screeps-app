import {Role} from "../../role/role";

type ALLOW_CROSS_RULE = (creep: Creep | PowerCreep) => boolean
/**
 * 默认的对穿规则
 *
 * 当自己正在站定工作，并且请求对穿的和自己是相同角色时拒绝对穿
 *
 * @param creep 被对穿的 creep
 */
const defaultRule: ALLOW_CROSS_RULE = (creep) => !creep.memory.stand;

const refuseWhenWorking: ALLOW_CROSS_RULE = (creep) => !(creep.memory.actionStage === "working");

export type CROSS_RULES = {
    [role in Role | 'default' | 'pc']?: ALLOW_CROSS_RULE
}

const crossRules: CROSS_RULES = {
    pc: defaultRule,
    default: defaultRule,
    [Role.Harvester]: refuseWhenWorking,
    [Role.Miner]: refuseWhenWorking,
};

export default crossRules;