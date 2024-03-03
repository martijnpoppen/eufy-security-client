/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Device } from "./device";
import { Picture, Schedule } from "./interfaces";
import { NotificationSwitchMode, SignalLevel, HB3DetectionTypes, SourceType, T8170DetectionTypes, IndoorS350NotificationTypes, FloodlightT8425NotificationTypes, SmartLockNotification } from "./types";
import { HTTPApi } from "./api";
import { LockPushEvent } from "./../push/types";
import { Station } from "./station";
import { PushMessage } from "../push/models";
export declare const isGreaterEqualMinVersion: (minimal_version: string, current_version: string) => boolean;
export declare const pad: (num: number) => string;
export declare const getTimezoneGMTString: () => string;
export declare const getAbsoluteFilePath: (device_type: number, channel: number, filename: string) => string;
export declare const getImageFilePath: (device_type: number, channel: number, filename: string) => string;
export declare const isNotificationSwitchMode: (value: number, mode: NotificationSwitchMode) => boolean;
export declare const switchNotificationMode: (currentValue: number, mode: NotificationSwitchMode, enable: boolean) => number;
export declare const calculateWifiSignalLevel: (device: Device, rssi: number) => SignalLevel;
export declare const calculateCellularSignalLevel: (rssi: number) => SignalLevel;
export declare const encryptAPIData: (data: string, key: Buffer) => string;
export declare const decryptAPIData: (data: string, key: Buffer) => Buffer;
export declare const getBlocklist: (directions: Array<number>) => Array<number>;
export declare const getDistances: (blocklist: Array<number>) => Array<number>;
export declare const isHB3DetectionModeEnabled: (value: number, type: HB3DetectionTypes) => boolean;
export declare const getHB3DetectionMode: (value: number, type: HB3DetectionTypes, enable: boolean) => number;
export interface EufyTimezone {
    timeZoneName: string;
    timeId: string;
    timeSn: string;
    timeZoneGMT: string;
}
export declare const getEufyTimezone: () => EufyTimezone | undefined;
export declare const getAdvancedLockTimezone: (stationSN: string) => string;
export declare class WritePayload {
    private split_byte;
    private data;
    write(bytes: Buffer): void;
    getData(): Buffer;
}
export declare class ParsePayload {
    private data;
    constructor(data: Buffer);
    readUint32BE(indexValue: number): number;
    readUint32LE(indexValue: number): number;
    readUint16BE(indexValue: number): number;
    readUint16LE(indexValue: number): number;
    readString(indexValue: number): string;
    readStringHex(indexValue: number): string;
    readInt8(indexValue: number): number;
    readData(indexValue: number): Buffer;
    private getDataPosition;
    private getNextStep;
}
export declare const encodePasscode: (pass: string) => string;
export declare const hexDate: (date: Date) => string;
export declare const hexTime: (date: Date) => string;
export declare const hexWeek: (schedule: Schedule) => string;
export declare const hexStringScheduleToSchedule: (startDay: string, startTime: string, endDay: string, endTime: string, week: string) => Schedule;
export declare const randomNumber: (min: number, max: number) => number;
export declare const getIdSuffix: (p2pDid: string) => number;
export declare const getImageBaseCode: (serialnumber: string, p2pDid: string) => string;
export declare const getImageSeed: (p2pDid: string, code: string) => string;
export declare const getImageKey: (serialnumber: string, p2pDid: string, code: string) => string;
export declare const decodeImage: (p2pDid: string, data: Buffer) => Buffer;
export declare const getImagePath: (path: string) => string;
export declare const getImage: (api: HTTPApi, serial: string, url: string) => Promise<Picture>;
export declare const isPrioritySourceType: (current: SourceType | undefined, update: SourceType) => boolean;
export declare const decryptTrackerData: (data: Buffer, key: Buffer) => Buffer;
export declare const isT8170DetectionModeEnabled: (value: number, type: T8170DetectionTypes) => boolean;
export declare const getT8170DetectionMode: (value: number, type: T8170DetectionTypes, enable: boolean) => number;
export declare const isIndoorNotitficationEnabled: (value: number, type: IndoorS350NotificationTypes) => boolean;
export declare const getIndoorNotification: (value: number, type: IndoorS350NotificationTypes, enable: boolean) => number;
export declare const isFloodlightT8425NotitficationEnabled: (value: number, type: FloodlightT8425NotificationTypes) => boolean;
export declare const getFloodLightT8425Notification: (value: number, type: FloodlightT8425NotificationTypes, enable: boolean) => number;
export declare const getLockEventType: (event: LockPushEvent) => number;
export declare const switchSmartLockNotification: (currentValue: number, mode: SmartLockNotification, enable: boolean) => number;
export declare const isSmartLockNotification: (value: number, mode: SmartLockNotification) => boolean;
export declare const getWaitSeconds: (device: Device) => number;
export declare const loadImageOverP2P: (station: Station, device: Device, id: string, p2pTimeouts: Map<string, NodeJS.Timeout>) => void;
export declare const loadEventImage: (station: Station, api: HTTPApi, device: Device, message: PushMessage, p2pTimeouts: Map<string, NodeJS.Timeout>) => void;
