const slicePath = function (path: RoomPosition[]): RoomPosition[][] {
    let tmpPath = [...path];
    let res: RoomPosition[][] = [];
    while (tmpPath.length > 0) {
        res.push(tmpPath.slice(0, 7));
        tmpPath.splice(0, 7);
    }
    return res;
};

const serializeFarPath = function (path: RoomPosition[]): number[] {
    let slicedPath = slicePath(path);
    let res: number[] = [];
    slicedPath.forEach(pathArr => {
        let data = 0;
        //27-31位用于记录路径长度，因为记录使用相对方向，所以为length-1
        data |= ((pathArr.length - 1) << 27);
        //22-27位用于校验末尾位置，分别取x、y在二进制下的前三位
        let [fx, fy] = [pathArr[pathArr.length - 1].x, pathArr[pathArr.length - 1].y];
        let checkSymbol = (fx & 7) | (fy & 7) << 3;
        data |= checkSymbol << 22;
        //取相对方向2进制前3位记录
        for (let i = 0; i < pathArr.length - 1; i++) {
            const dir = pathArr[i].getDirectionTo(pathArr[i + 1]) & 7;
            data |= dir << (i * 3);
        }
        res.push(data);
    });
    return res;
};

const tet = () => {
    const tab = [
        {x:1,y:1,roomName: 'W45N36'},
        {x:2,y:2,roomName: 'W45N36'},
        {x:3,y:3,roomName: 'W45N36'},
        {x:3,y:4,roomName: 'W45N36'},
        {x:3,y:5,roomName: 'W45N36'},
        {x:3,y:6,roomName: 'W45N36'},
        {x:4,y:7,roomName: 'W45N36'},
        {x:4,y:8,roomName: 'W45N36'},
        {x:3,y:7,roomName: 'W45N36'},
        {x:3,y:6,roomName: 'W45N36'},
        {x:4,y:6,roomName: 'W45N36'},
        {x:3,y:5,roomName: 'W45N36'},
        {x:2,y:4,roomName: 'W45N36'},
        {x:2,y:3,roomName: 'W45N36'},
        {x:2,y:2,roomName: 'W45N36'},
        {x:2,y:1,roomName: 'W45N36'},
    ];
    // @ts-ignore
    let num = serializeFarPath(tab);
    console.log(num);
    return 0;
};

tet();