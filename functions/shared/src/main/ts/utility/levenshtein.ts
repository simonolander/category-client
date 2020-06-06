import {PriorityQueue} from "typescript-collections"

export function levenshtein(columnString: string, rowString: string, limit: number = Math.max(columnString.length, rowString.length)): number {
    if (limit < 0 || !Number.isFinite(limit) || !Number.isInteger(limit)) {
        throw Error(`Illegal limit: ${limit}`)
    }

    if (columnString === rowString) {
        return 0
    }

    if (limit === 0) {
        return limit
    }

    if (Math.abs(columnString.length - rowString.length) > limit) {
        return limit;
    }

    if (columnString.length === 0) {
        return Math.min(limit, rowString.length);
    }

    if (rowString.length === 0) {
        return Math.min(limit, columnString.length);
    }

    const queue = new PriorityQueue<[number, number, number]>(([a], [b]) => b - a)
    const visited: boolean[][] = []
    queue.add([0, 0, 0])
    while (true) {
        const position = queue.dequeue()
        if (!position) {
            break;
        }
        const [distance, rowIndex, columnIndex] = position
        if (distance >= limit) {
            continue
        }
        if (visited[rowIndex]?.[columnIndex]) {
            continue
        }

        if (!visited[rowIndex]) {
            visited[rowIndex] = []
        }
        visited[rowIndex][columnIndex] = true

        if (rowIndex === rowString.length && columnIndex === columnString.length) {
            return distance
        }

        if (rowIndex < rowString.length) {
            queue.add([distance + 1, rowIndex + 1, columnIndex])
        }

        if (columnIndex < columnString.length) {
            queue.add([distance + 1, rowIndex, columnIndex + 1])
        }

        if (rowIndex < rowString.length && columnIndex < columnString.length) {
            const substitutionCost = rowString[rowIndex] === columnString[columnIndex] ? 0 : 1
            queue.add([distance + substitutionCost, rowIndex + 1, columnIndex + 1])
        }

        if (rowIndex < rowString.length - 1 && columnIndex < columnString.length - 1 && rowString[rowIndex + 1] === columnString[columnIndex] && rowString[rowIndex] === columnString[columnIndex + 1]) {
            queue.add([distance + 1, rowIndex + 2, columnIndex + 2])
        }
    }

    return limit
}