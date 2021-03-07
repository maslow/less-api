
export enum ActionType {
  READ = 'database.queryDocument',
  UPDATE = 'database.updateDocument',
  ADD = 'database.addDocument',
  REMOVE = 'database.deleteDocument',
  COUNT = 'database.countDocument'
}

export enum PermissionType {
  READ = '.read',
  UPDATE = '.update',
  ADD = '.add',
  REMOVE = '.remove',
  COUNT = '.count'
}


export interface Action {
  readonly type: ActionType,
  readonly permission: PermissionType,
  readonly fields: string[]
}
//  params types
export enum Direction {
  DESC = 'desc',
  ASC = 'asc'
}

export interface Order {
  direction: Direction,
  field: string
}

// left, right, inner, full
export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full'
}

export interface JoinParam {
  collection: string,
  type: JoinType,
  leftKey: string,
  rightKey: string
}

export interface Params {
  collection: string,
  action: ActionType,
  joins?: JoinParam[], // SQL join
  query?: any,
  data?: any,
  order?: Order[],
  offset?: number,
  limit?: number,
  projection?: any,
  multi?: boolean,
  upsert?: boolean,
  merge?: boolean,
  // @see https://github.com/mysqljs/mysql#joins-with-overlapping-column-names
  nested?: boolean  // nested table name, when use join, like [{ tableName: {id: 1, name: 'xxx'}, subTable: {id: 1, age: 1}}]
}

const ReadAcceptParams = ['query', 'order', 'offset', 'limit', 'projection', 'multi', 'joins', 'nested']
const UpdateAcceptParams = ['query', 'data', 'multi', 'upsert', 'merge', 'joins']
const AddAcceptParams = ['data', 'multi']
const RemoveAcceptParams = ['query', 'multi', 'joins']
const CountAcceptParams = ['query', 'joins']

const ReadAction: Action = { type: ActionType.READ, permission: PermissionType.READ, fields: ReadAcceptParams }
const UpdateAction: Action = { type: ActionType.UPDATE, permission: PermissionType.UPDATE, fields: UpdateAcceptParams }
const RemoveAction: Action = { type: ActionType.REMOVE, permission: PermissionType.REMOVE, fields: RemoveAcceptParams }
const AddAction: Action = { type: ActionType.ADD, permission: PermissionType.ADD, fields: AddAcceptParams }
const CountAction: Action = { type: ActionType.COUNT, permission: PermissionType.COUNT, fields: CountAcceptParams }

export function getAction(actionName: ActionType): Action | null {

  let action: Action
  switch (actionName) {
    case ActionType.READ:
      action = ReadAction
      break
    case ActionType.UPDATE:
      action = UpdateAction
      break
    case ActionType.ADD:
      action = AddAction
      break
    case ActionType.REMOVE:
      action = RemoveAction
      break
    case ActionType.COUNT:
      action = CountAction
      break
    default:
      action = null
  }
  return action
}

export const UPDATE_COMMANDS = {
  SET: '$set',
  REMOVE: '$unset',
  INC: '$inc',
  MUL: '$mul',
  PUSH: '$push',
  POP: '$pop',
  SHIFT: '$pop',
  UNSHIFT: '$push'
}

export const LOGIC_COMMANDS = {
  AND: '$and',
  OR: '$or',
  NOT: '$not',
  NOR: '$nor'
}

export const QUERY_COMMANDS = {
  EQ: '$eq',
  NEQ: '$ne',
  GT: '$gt',
  GTE: '$gte',
  LT: '$lt',
  LTE: '$lte',
  IN: '$in',
  NIN: '$nin',
  // GEO_NEAR: '$geoNear',
  // GEO_WITHIN: '$geoWithin',
  // GEO_INTERSECTS: '$geoIntersects'
  LIKE: '$like', // only for SQL query
}