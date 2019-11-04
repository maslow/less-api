import { Entry } from './entry';
import { Params } from './types';
import { Handler, Processor } from './processor';
import { AccessorInterface } from './accessor';
interface InternalRuleTable {
    [name: string]: Processor;
}
export interface ValidateError {
    type: string | number;
    error: string | object;
}
export interface ValidateResult {
    errors?: ValidateError[];
    matched?: InternalRuleTable;
}
export declare class Ruler {
    private readonly entry;
    private validators;
    private rules;
    constructor(entry: Entry);
    init(): void;
    readonly collections: string[];
    readonly accessor: AccessorInterface;
    load(rules: any): boolean;
    private instantiateValidators;
    validate(params: Params, injections: object): Promise<ValidateResult>;
    register(name: string, handler: Handler): void;
    private loadBuiltins;
}
export {};
