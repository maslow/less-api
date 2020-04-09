import { UPDATE_COMMANDS } from "../types"


/**
 * 将带操作符的 data 对象平铺
 * 
data: {
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

/**
 * 判断字段列是否都在白名单内
 * @param fields [string] 输入字段列表
 * @param allow_fields [string] 允许的字段列表
 */
export function isAllowedFields(fields: string[], allow_fields: string[]): string | null{
    for(let fd of fields){
        if(!allow_fields.includes(fd))
            return `the field '${fd}' is NOT allowed]`
    }
    return null
}