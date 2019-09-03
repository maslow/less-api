
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
    [actions.ADD]: ['data'],
    [actions.REMOVE]: ['query', 'multi']
}

module.exports = {
    actions,
    permissions,
    actionMap,
    acceptParams
}