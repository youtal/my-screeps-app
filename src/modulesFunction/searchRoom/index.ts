import {roomNode} from "./types";
import {parseInt} from "lodash";
import PriorityQueue from "../PriorityQueue";

const evalDis = function (start: ROOM_NAME, goal: ROOM_NAME): number {
    let reg1 = /^([WE])([0-9]+)([NS])([0-9]+)$/;
    let [startSp, goalSp] = [reg1.exec(start), reg1.exec(goal)];
    let startCoor = [
        startSp[1] === 'W' ? -parseInt(startSp[2]) : parseInt(startSp[2]) + 1,
        startSp[3] === 'N' ? -parseInt(startSp[4]) : parseInt(startSp[4]) + 1
    ];
    let goalCoor = [
        goalSp[1] === 'W' ? -parseInt(goalSp[2]) : parseInt(goalSp[2]) + 1,
        goalSp[3] === 'N' ? -parseInt(goalSp[4]) : parseInt(goalSp[4]) + 1
    ];
    return Math.abs(startCoor[0] - goalCoor[0]) + Math.abs(startCoor[1] - goalCoor[1]);
};

const searchRoom = function (start: ROOM_NAME, goal: ROOM_NAME) {
    //起始房间房间状态与目标房间状态不同，则直接返回参数不合法
    const [startRoomMode, goalRoomMode] = [Game.map.getRoomStatus(start), Game.map.getRoomStatus(goal)];
    if (startRoomMode !== goalRoomMode)
        return ERR_INVALID_ARGS;

    //A*算法的优先队列
    let roomQueue = new PriorityQueue<roomNode>();
    //用于存放已遍历的房间
    let passed: { [key: ROOM_NAME]: roomNode } = {};
    //起始房间Node
    const startNode: roomNode = {
        priority: 0,
        roomName: start,
        Fn: 0,
        Gn: 0
    };
    //起始房间入队
    roomQueue.enqueue(startNode);
    //起始房间进入已遍历Hashmap
    passed[startNode.roomName] = startNode;
    while (roomQueue.length > 0) {
        //将队首node出队
        const curRoomNode = roomQueue.dequeue();

    }
};