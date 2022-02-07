import {Role} from "../../role/role";


type AllowCrossRuleFunc = (creep: Creep | PowerCreep) => boolean
/**
 * 默认的对穿规则
 *
 * 当自己正在站定工作，并且请求对穿的和自己是相同角色时拒绝对穿
 *
 * @param creep 被对穿的 creep
 */
const defaultRule: AllowCrossRuleFunc = (creep) => !creep.memory.stand

const refuseWhenWorking: AllowCrossRuleFunc = (creep) => !creep.memory.working

export type CrossRules = {
    [role in Role | 'default'|'pc']?: AllowCrossRuleFunc
}

const crossRules: CrossRules = {
    pc:()=>true,
    default: defaultRule,
    [Role.Harvester]: refuseWhenWorking
}

export default crossRules