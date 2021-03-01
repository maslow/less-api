
import * as assert from 'assert'
import { Entry } from './entry'
import { Params, PermissionType, getAction } from './types'
import { Handler, Processor, HandlerContext } from './processor'
import * as BUILT_IN_VALIDATORS from './validators'
import { AccessorInterface } from './accessor'

// 数据库规则
interface DbRulesTree {
  [collection: string]: CollectionRules
}

// 集合规则
type CollectionRules = {
  [permission in PermissionType]: PermissionRule[]
}

// 权限规则
interface PermissionRule {
  [name: string]: Processor
}

// 验证错误信息
export interface ValidateError {
  type: string | number,
  error: string | object
}

// 验证结果
export interface ValidateResult {
  errors?: ValidateError[],
  matched?: PermissionRule
}

// 验证器容器
interface ValidatorMap {
  [name: string]: Handler
}

export class Ruler {

  private readonly entry: Entry

  /**
   * 验证器注册表
   */
  readonly validators: ValidatorMap

  /**
   * 解析后的数据库规则树
   */
  private rules: DbRulesTree

  constructor(entry: Entry) {
    this.entry = entry
    this.validators = {}
    this.rules = null
    this.init()
  }

  init() {
    this.loadBuiltins()
  }

  get collections() {
    if (!this.rules) return []
    return Object.keys(this.rules)
  }

  get accessor(): AccessorInterface {
    return this.entry ? this.entry.accessor : null
  }

  load(rules: any) {
    assert.equal(typeof rules, 'object', "invalid 'rules'")

    const tree = {} as DbRulesTree

    // 处理每张数据库表的访问规则
    for (let collection in rules) {
      // 表权限，是一个对象， like { ".read": {...}, '.update': {...} }
      const permissions = rules[collection]

      tree[collection] = {} as CollectionRules

      // 用户配置的「权限名」列表, like ['.read', '.update' ...]
      const perm_types = Object.keys(permissions) as PermissionType[]

      // 处理每个权限
      for (let ptype of perm_types) {
        // 权限对应的验证器配置, like { 'condition': true, 'data': {...} }
        const permissionConfig = permissions[ptype]
        tree[collection][ptype] = this.instantiateValidators(permissionConfig)
      }
    }

    this.rules = tree
    return true
  }

  /**
   * 实例化验证器
   * @param permissionRules 权限规则
   */
  private instantiateValidators(permissionRules: any): PermissionRule[] {
    assert.notEqual(permissionRules, undefined, 'permissionRules is undefined')

    let rules = permissionRules

    // 权限规则为布尔时，默认使用 condition 验证器
    if ([true, false].includes(rules)) {
      rules = [{ condition: `${rules}` }]
    }

    // 权限规则为字符串时，默认使用 condition 验证器
    if (typeof rules === 'string') rules = [{ condition: rules }]

    // 权限规则不为数组时，转为数组
    if (!(rules instanceof Array)) rules = [rules]

    const result: PermissionRule[] = rules.map(raw_rule => {
      const prule: PermissionRule = {}

      // 检查用户配置的验证器是否已注册
      for (let vname in raw_rule) {
        const handler = this.validators[vname]
        if (!handler) {
          throw new Error(`unknown validator '${vname}' in your rules`)
        }
      }

      // 逐一实例化验证器
      for (let vname in this.validators) {
        const handler = this.validators[vname]

        // 如果用户并未配置此验证器，则其配置缺省为 undefined，验证器实现时需处理缺省情况
        const config = raw_rule[vname]
        prule[vname] = new Processor(vname, handler, config)
      }
      return prule
    })

    return result
  }

  /**
   * 验证访问规则
   * @param params 
   * @param injections 
   */
  async validate(params: Params, injections: object): Promise<ValidateResult> {
    const { collection, action: actionType } = params

    let errors: ValidateError[] = []

    // 判断所访问的集合是否配置规则
    if (!this.collections.includes(collection)) {
      const err: ValidateError = { type: 0, error: `collection "${collection}" not found` }
      errors.push(err)
      return { errors }
    }

    // action 是否合法
    const action = getAction(actionType)
    if (!action) {
      const err: ValidateError = { type: 0, error: `action "${actionType}" invalid` }
      errors.push(err)
      return { errors }
    }

    const permName = action.permission
    const permRules: PermissionRule[] = this.rules[collection][permName]

    // 权限规则不存在
    if (!permRules) {
      const err: ValidateError = { type: 0, error: `${collection} ${actionType} don't has any rules` }
      errors.push(err)
      return { errors }
    }

    // 遍历验证权限的每一条规则
    let matched = null
    const context: HandlerContext = { ruler: this, params, injections }

    for (let validtrs of permRules) {
      let error: ValidateError = null
      // 执行一条规则的所有验证器
      for (let vname in validtrs) {
        let result = await validtrs[vname].run(context)
        // 任一验证器执行不通过，则跳过本条规则
        if (result) {
          error = { type: vname, error: result }
          break
        }
      }

      if (error) errors.push(error)

      // 本条规则验证通过
      if (!error) {
        matched = validtrs
        break
      }
    }

    // 没有匹配到任何规则，返回验证错误信息
    if (!matched) return { errors }

    return { matched }
  }


  /**
   * 注册验证器
   * @param name 
   * @param handler 
   */
  register(name: string, handler: Handler) {
    assert.ok(name, `register error: name must not be empty`)
    assert.ok(handler instanceof Function, `${name} register error: 'handler' must be a callable function`)

    const exists = Object.keys(this.validators).filter(vn => vn === name)
    assert.ok(!exists.length, `validator's name: '${name}' duplicated`)

    this.validators[name] = handler
  }

  /**
   * 加载内置验证器
   */
  private loadBuiltins() {
    for (let name in BUILT_IN_VALIDATORS) {
      const handler = BUILT_IN_VALIDATORS[name] as Handler
      this.register(name, handler)
    }
  }
}