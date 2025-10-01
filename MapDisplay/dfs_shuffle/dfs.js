// dfs.js
// 2023-11-29
// D:\home\1_CJ\01_PureSwmmMap\SwmmMap\MapDisplay\dfs_shuffle\dfs.js
// Depth First Search (recursion)

export class DepthFirstSearch {
    /**
     * Depth First Search (recursion)
     * @param {{string: string[]}} graph 
     * @param {string} StartNode 開始節點名稱
     * @param {string} EndNode 結束節點名稱
     */
    constructor(graph, StartNode, EndNode) {
        this.graph = graph;
        this.StartNode = StartNode;
        this.EndNode = EndNode;
        this.Stack = [];
        this.Parent = {}; // ex. Parent['D18'] = ['D17-1','121']
    }

    PrintVisited(visited) {
        let keys = Object.keys(graph);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (visited[key] !== undefined)
                console.log("key:", keys[i], visited[key]);
        }
    }


    PrintStack() {
        console.log("Path, Stack.length:", this.Stack.length);
        for (let i = 0; i < this.Stack.length; i++) {
            console.log(`[${this.Stack[i]}]`);
        }
    }

    PrintParent() {
        console.log("Parent");
        let keys = Object.keys(this.Parent)
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            console.log(`${key}:[${this.Parent[key]}]`);
        }
    }
    /**
     * 深度優先搜尋法，遞迴
     * @param {string} node 
     * @param {bool[]} visited 
     */
    dfs(node, visited) {

        this.Stack.push(node);
        visited[node] = true;

        for (let i = 0; i < this.graph[node].length; i++) {
            const nextNode = this.graph[node][i];

            if (this.Parent[nextNode] === undefined) this.Parent[nextNode] = [];

            if (!visited[nextNode]) {
                this.Parent[nextNode].push(node);
                this.dfs(nextNode, visited);
            } else {
                this.Stack.pop();
            }
        }
    }
    /**
     * 從EndNode開始溯源
     * @returns {string[]}
     */
    BackWard() {
        // "name" in obj
        let p = this.EndNode;
        let paths = [p];
        //console.log("----- BackWard from ", this.EndNode);
        while (p in this.Parent) {
            p = this.Parent[p][0];
            if (p === undefined) break;
            // console.log(p)
            paths.push(p);
        }
        return paths;
    }
    /**
     * 從這裡開始搜尋路徑
     * @returns {string[]}
     */
    FindPath() {
        this.dfs(this.StartNode, new Array(Object.keys(this.graph).length).fill(false));
        // this.PrintParent();
        let paths = this.BackWard();
        paths = paths.reverse();
        return paths;
    }
}

/* 輸入資料
graph = {
        'A': ['B', 'Cq'],
        'B': ['D1', 'E'],
        'Cq': ['F', 'G'],
        'D1': ['B'],
        'E': ['F'],
        'F': ['Cq', 'E'],
        'G': []
    }
*/


// function dfs_iter(node, visited) {
//     const stack = [node];
//     while (stack.length > 0) {
//         const currNode = stack.pop();
//         if (!visited[currNode]) {
//             visited[currNode] = true;
//             console.log(currNode);
//             for (let i = graph[currNode].length - 1; i >= 0; i--) {
//                 const nextNode = graph[currNode][i];
//                 if (!visited[nextNode]) {
//                     stack.push(nextNode);
//                 }
//             }
//         }
//     }
// }