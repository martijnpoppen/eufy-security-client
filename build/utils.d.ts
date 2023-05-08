/// <reference types="node" />
import { Logger } from "ts-log";
import EventEmitter from "events";
import { EufySecurityPersistentData } from "./interfaces";
import { PropertyMetadataAny } from "./http/interfaces";
export declare const removeLastChar: (text: string, char: string) => string;
export declare const generateUDID: () => string;
export declare const generateSerialnumber: (length: number) => string;
export declare const md5: (contents: string) => string;
export declare const handleUpdate: (config: EufySecurityPersistentData, log: Logger, oldVersion: number) => EufySecurityPersistentData;
export declare const isEmpty: (str: string | null | undefined) => boolean;
export declare const parseValue: (metadata: PropertyMetadataAny, value: unknown) => unknown;
export declare const validValue: (metadata: PropertyMetadataAny, value: unknown) => void;
export declare const mergeDeep: (target: Record<string, any> | undefined, source: Record<string, any>) => Record<string, any>;
export declare const parseJSON: (data: string, log: Logger) => any;
export declare function waitForEvent<T>(emitter: EventEmitter, event: string): Promise<T>;
