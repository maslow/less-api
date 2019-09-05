const actions = {
  READ: 'database.queryDocument',
  UPDATE: 'database.updateDocument',
  ADD: 'database.addDocument',
  REMOVE: 'database.deleteDocument'
}

const permissions = {
  READ: '.read',
  UPDATE: '.update',
  ADD: '.add',
  REMOVE: '.remove'
}

const actionMap = {
  [actions.READ]: '.read',
  [actions.UPDATE]: '.update',
  [actions.ADD]: '.add',
  [actions.REMOVE]: '.remove'
}
const acceptParams = {
  [actions.READ]: ['query', 'order', 'offset', 'limit', 'projection', 'multi'],
  [actions.UPDATE]: ['query', 'data', 'multi', 'upsert', 'merge'],
  [actions.ADD]: ['data', 'multi'],
  [actions.REMOVE]: ['query', 'multi']
}

const UPDATE_COMMANDS = {
  SET: '$set',
  REMOVE: '$unset',
  INC: '$inc',
  MUL: '$mul',
  PUSH: '$push',
  POP: '$pop',
  SHIFT: '$pop',
  UNSHIFT: '$push'
}

const LOGIC_COMMANDS = {
  AND: '$and',
  OR: '$or',
  NOT: '$not',
  NOR: '$nor'
}

const QUERY_COMMANDS = {
  EQ: '$eq',
  NEQ: '$ne',
  GT: '$gt',
  GTE: '$gte',
  LT: '$lt',
  LTE: '$lte',
  IN: '$in',
  NIN: '$nin',
  GEO_NEAR: '$geoNear',
  GEO_WITHIN: '$geoWithin',
  GEO_INTERSECTS: '$geoIntersects'
}

module.exports = {
  actions,
  permissions,
  actionMap,
  acceptParams,
  UPDATE_COMMANDS,
  LOGIC_COMMANDS,
  QUERY_COMMANDS
}
