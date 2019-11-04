import { AccessorInterface } from './../../accessor/accessor';
export declare function validateField(field: string, data: any, rules: any, accessor: AccessorInterface, collection: string): Promise<any>;
export declare function isAllowedFields(fields: string[], allow_fields: string[]): string | null;
