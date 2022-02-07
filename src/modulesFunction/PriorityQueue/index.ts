import {NodeWithPriority} from "./types";

export default class PriorityQueue<T extends NodeWithPriority> {
    private _data: T[];

    constructor(externalRepository: T[] = []) {
        this._data = externalRepository;
        if (this._data.length > 0)
            //使用forEach进行深拷贝，如果有外部原数组，可以保证this._data指向外部原数组位置
            this._quickSort(this._data).forEach((val, idx) => {
                this._data[idx] = val;
            });
    }

    private _quickSort = function (arr: T[]): T[] {
        if (arr.length <= 1) {
            return arr;
        }
        let pivotIndex = Math.floor(arr.length / 2);
        let pivot = arr.splice(pivotIndex, 1)[0];
        let left = [];
        let right = [];
        for (let i = 0; i < arr.length; i++) {
            if (arr[i].priority < pivot.priority) {
                left.push(arr[i]);
            } else {
                right.push(arr[i]);
            }
        }
        return this._quickSort(left).concat([pivot], this._quickSort(right));
    };

    public show() {
        if (this._data.length > 0) {
            console.log(this._data);
        } else {
            console.log('no data');
        }
    }

    public enqueue(node: T) {
        if (this._data.length <= 0) {
            this._data.push(node);
            return;
        }

        if (this._data[this._data.length - 1].priority <= node.priority) {
            this._data.push(node);
            return;
        }

        if (this._data[0].priority > node.priority) {
            this._data.unshift(node);
            return;
        }

        let [left, right] = [0, this._data.length - 1];
        while (left <= right) {
            let point = Math.floor((left + right) / 2);
            if (node.priority >= this._data[point].priority && node.priority < this._data[point + 1].priority) {
                this._data.splice(point + 1, 0, node);
                break;
            }
            if (this._data[point].priority > node.priority) {
                right = point + 1;
                continue;
            }
            if (this._data[point].priority <= node.priority) {
                left = point;
            }
        }
    }

    public top(): T {
        return this._data[0];
    }

    public dequeue(): T {
        return this._data.shift();
    }

    get length() {
        return this._data.length;
    }
}

//export default PriorityQueue;