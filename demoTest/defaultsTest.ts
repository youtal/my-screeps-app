import * as _ from 'lodash'
interface testMap{
    p1?:number
    p2?:number
    p3?:number
    p4?:number
}

let t1:testMap = {p1:20}
let t2 = _.defaults(t1,{p2:20})
console.log(`${Object.keys(t1)}`)
console.log(`${Object.keys(t2)}`)