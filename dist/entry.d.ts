import { Handler } from './processor';
import { Ruler } from './ruler';
import { AccessorInterface } from './accessor/accessor';
import { Params, ActionType } from "./types";
export declare class Entry {
    accessor: AccessorInterface;
    ruler: Ruler;
    constructor(accessor: AccessorInterface, ruler?: Ruler);
    init(): Promise<void>;
    loadRules(rules: object): boolean;
    execute(params: Params): Promise<import("./accessor/accessor").ReadResult | import("./accessor/accessor").UpdateResult | import("./accessor/accessor").AddResult | import("./accessor/accessor").RemoveResult | import("./accessor/accessor").CountResult>;
    validate(params: Params, injections: object): Promise<import("./ruler").ValidateResult>;
    registerValidator(name: string, handler: Handler): void;
    parseParams(actionType: ActionType, reqParams: any): Params;
}
