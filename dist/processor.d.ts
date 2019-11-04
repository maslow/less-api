import { Params } from './types';
import { Ruler } from './ruler';
export declare enum ProcessTypes {
    Validator = "validator"
}
export interface HandlerContext {
    ruler: Ruler;
    params: Params;
    injections: any;
}
export interface Handler {
    (config: any, context: HandlerContext): any;
}
export declare class Processor {
    protected handler: Handler;
    readonly name: string;
    readonly type: ProcessTypes;
    readonly config: any;
    constructor(name: string, handler: Handler, config: any, type?: ProcessTypes);
    run(context: HandlerContext): Promise<any>;
}
