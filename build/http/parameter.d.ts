import { Logger } from "ts-log";
export declare class ParameterHelper {
    static readValue(type: number, value: string, log: Logger): string | undefined;
    static writeValue(type: number, value: string): string;
}
