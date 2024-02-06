/// <reference types="node" />
import { Category } from "typescript-logging-category-style";
import EventEmitter from "events";
import { ErrorObject, EufySecurityPersistentData } from "./interfaces";
import { BaseError } from "./error";
import { PropertyMetadataAny } from "./http/interfaces";
export declare const getError: (error: BaseError) => ErrorObject;
export declare const removeLastChar: (text: string, char: string) => string;
export declare const generateUDID: () => string;
export declare const generateSerialnumber: (length: number) => string;
export declare const md5: (contents: string) => string;
export declare const handleUpdate: (config: EufySecurityPersistentData, oldVersion: number) => EufySecurityPersistentData;
export declare const isEmpty: (str: string | null | undefined) => boolean;
export declare const parseValue: (metadata: PropertyMetadataAny, value: unknown) => unknown;
export declare const parseJSON: (data: string, log: Category) => any;
export declare const validValue: (metadata: PropertyMetadataAny, value: unknown) => void;
export declare const mergeDeep: (target: Record<string, any> | undefined, source: Record<string, any>) => Record<string, any>;
export declare function waitForEvent<T>(emitter: EventEmitter, event: string): Promise<T>;
export declare function getShortUrl(url: URL, prefixUrl?: string): string;
