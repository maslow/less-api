export declare enum ActionType {
    READ = "database.queryDocument",
    UPDATE = "database.updateDocument",
    ADD = "database.addDocument",
    REMOVE = "database.deleteDocument",
    COUNT = "database.countDocument"
}
export declare enum PermissionType {
    READ = ".read",
    UPDATE = ".update",
    ADD = ".add",
    REMOVE = ".remove",
    COUNT = ".count"
}
export interface Action {
    readonly type: ActionType;
    readonly permission: PermissionType;
    readonly fields: string[];
}
export declare enum Direction {
    DESC = "desc",
    ASC = "asc"
}
export interface Order {
    direction: Direction;
    field: string;
}
export interface Params {
    collection: string;
    action: ActionType;
    query?: any;
    data?: any;
    order?: Order[];
    offset?: number;
    limit?: number;
    projection?: any;
    multi?: boolean;
    upsert?: boolean;
    merge?: boolean;
}
export declare function getAction(actionName: ActionType): Action | null;
export declare const UPDATE_COMMANDS: {
    SET: string;
    REMOVE: string;
    INC: string;
    MUL: string;
    PUSH: string;
    POP: string;
    SHIFT: string;
    UNSHIFT: string;
};
export declare const LOGIC_COMMANDS: {
    AND: string;
    OR: string;
    NOT: string;
    NOR: string;
};
export declare const QUERY_COMMANDS: {
    EQ: string;
    NEQ: string;
    GT: string;
    GTE: string;
    LT: string;
    LTE: string;
    IN: string;
    NIN: string;
    GEO_NEAR: string;
    GEO_WITHIN: string;
    GEO_INTERSECTS: string;
};
