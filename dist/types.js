"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ActionType;
(function (ActionType) {
    ActionType["READ"] = "database.queryDocument";
    ActionType["UPDATE"] = "database.updateDocument";
    ActionType["ADD"] = "database.addDocument";
    ActionType["REMOVE"] = "database.deleteDocument";
    ActionType["COUNT"] = "database.countDocument";
})(ActionType = exports.ActionType || (exports.ActionType = {}));
var PermissionType;
(function (PermissionType) {
    PermissionType["READ"] = ".read";
    PermissionType["UPDATE"] = ".update";
    PermissionType["ADD"] = ".add";
    PermissionType["REMOVE"] = ".remove";
    PermissionType["COUNT"] = ".count";
})(PermissionType = exports.PermissionType || (exports.PermissionType = {}));
var Direction;
(function (Direction) {
    Direction["DESC"] = "desc";
    Direction["ASC"] = "asc";
})(Direction = exports.Direction || (exports.Direction = {}));
const ReadAcceptParams = ['query', 'order', 'offset', 'limit', 'projection', 'multi'];
const UpdateAcceptParams = ['query', 'data', 'multi', 'upsert', 'merge'];
const AddAcceptParams = ['data', 'multi'];
const RemoveAcceptParams = ['query', 'multi'];
const CountAcceptParams = ['query'];
const ReadAction = { type: ActionType.READ, permission: PermissionType.READ, fields: ReadAcceptParams };
const UpdateAction = { type: ActionType.UPDATE, permission: PermissionType.UPDATE, fields: UpdateAcceptParams };
const RemoveAction = { type: ActionType.REMOVE, permission: PermissionType.REMOVE, fields: RemoveAcceptParams };
const AddAction = { type: ActionType.ADD, permission: PermissionType.ADD, fields: AddAcceptParams };
const CountAction = { type: ActionType.COUNT, permission: PermissionType.COUNT, fields: CountAcceptParams };
function getAction(actionName) {
    let action;
    switch (actionName) {
        case ActionType.READ:
            action = ReadAction;
            break;
        case ActionType.UPDATE:
            action = UpdateAction;
            break;
        case ActionType.ADD:
            action = AddAction;
            break;
        case ActionType.REMOVE:
            action = RemoveAction;
            break;
        case ActionType.COUNT:
            action = CountAction;
            break;
        default:
            action = null;
    }
    return action;
}
exports.getAction = getAction;
exports.UPDATE_COMMANDS = {
    SET: '$set',
    REMOVE: '$unset',
    INC: '$inc',
    MUL: '$mul',
    PUSH: '$push',
    POP: '$pop',
    SHIFT: '$pop',
    UNSHIFT: '$push'
};
exports.LOGIC_COMMANDS = {
    AND: '$and',
    OR: '$or',
    NOT: '$not',
    NOR: '$nor'
};
exports.QUERY_COMMANDS = {
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
};
