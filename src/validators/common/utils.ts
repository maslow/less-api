import { UPDATE_COMMANDS } from "../../types"


/**
{
    title: '',
    $set: {
        content: '',
        author: 123
    },
    $inc: {
        age: 1
    },
    $push: {
        grades: 99,
    },
}
*/

export function flattenData(data: any = {}): object{
    const arr = Object.values(UPDATE_COMMANDS)
    const operators = new Set<string>(arr)
    const result = {}
    
    for(const key in data) {
        if(!operators.has(key)){
            result[key] = data[key]
            continue
        }

        const obj = data[key]
        for(const k in obj){
            result[k] = obj[k]
        }
    }
    return result
}