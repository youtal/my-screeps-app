function swap(array: any[], a: number, b: number) {
    [array[a], array[b]] = [array[b], array[a]];
}

function downJust(arr: number[], parentIdx: number) {
    //左孩子索引值为父节点索引*2+1
    let childIdx = parentIdx * 2 + 1
    while (childIdx < arr.length) {
        //如果有右孩子，且右孩子的值比左孩子小，则把子节点索引值置为左孩子索引值
        if (childIdx + 1 < arr.length && arr[childIdx + 1] < arr[childIdx])
            ++childIdx
        //父节点的值不大于子节点的值，则视为整棵子树已经成堆
        if (arr[parentIdx] <= arr[childIdx])
            break
        swap(arr, parentIdx, childIdx)
        parentIdx = childIdx
        childIdx = 2 * childIdx + 1
    }
}

function heapify(arr: number[]) {
    for (let i = Math.floor((arr.length - 1) / 2); i >= 0; --i)
        downJust(arr, i)
}

let arr = [10,20,1,-8,90,12,65,-20,3]
heapify(arr)
console.log(arr)