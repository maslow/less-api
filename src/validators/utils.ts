import * as vm from 'vm'

export function execScript(code: string, context: Object){
    const script = new vm.Script(code)
    const ret = script.runInNewContext(context)
    return ret
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