export default {
    say() {
        console.log('success');
    }
}

export const getNearPos = function (oriPos: RoomPosition): RoomPosition[] {
    let res: RoomPosition[] = []
    const tmpArr = [-1, 0, 1]
    const {x, y, roomName} = oriPos
    for (let i of tmpArr)
        for (let j of tmpArr) {
            //跳过自身
            if (i === 0 && j === 0)
                continue;
            let [dx, dy] = [x + i, y + j]
            //跳过边界
            if ((dx || dy) >= 50 || (dx || dy) <= 0)
                continue
            res.push(new RoomPosition(dx, dy, roomName))
        }
    return res
}