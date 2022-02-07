import serializeFarPath from "./modulesGameObject/betterMoveTo";
import mountGlobal from "./modulesFunction/global"
export const loop = () => {
    mountGlobal()
    let p1 = new RoomPosition(5, 20, 'W33N46');
    let p2 = new RoomPosition(23, 46, 'W33N46');
    let path0 = PathFinder.search(p1, p2).path;
    //console.log(serializeFarPath(path0));
};
