/// <reference types="node" />
/// <reference types="node" />
import { TypedEmitter } from "tiny-typed-emitter";
import { HTTPApi } from "./api";
import { CommandName, DeviceEvent, SourceType, TrackerType } from "./types";
import { DeviceListResponse } from "./models";
import { DeviceEvents, PropertyValue, PropertyValues, PropertyMetadataAny, IndexedProperty, RawValues, Schedule, Voices } from "./interfaces";
import { PushMessage } from "../push/models";
import { DeviceSmartLockNotifyData } from "../mqtt/model";
import { Station } from "./station";
export declare class Device extends TypedEmitter<DeviceEvents> {
    protected api: HTTPApi;
    protected rawDevice: DeviceListResponse;
    protected eventTimeouts: Map<DeviceEvent, NodeJS.Timeout>;
    protected pictureEventTimeouts: Map<string, NodeJS.Timeout>;
    protected properties: PropertyValues;
    private rawProperties;
    private ready;
    protected constructor(api: HTTPApi, device: DeviceListResponse);
    protected initializeState(): void;
    initialize(): void;
    getRawDevice(): DeviceListResponse;
    update(device: DeviceListResponse): void;
    updateProperty(name: string, value: PropertyValue, force?: boolean): boolean;
    updateRawProperties(values: RawValues): void;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    updateRawProperty(type: number, value: string, source: SourceType): boolean;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    getPropertyMetadata(name: string, hidden?: boolean): PropertyMetadataAny;
    getPropertyValue(name: string): PropertyValue;
    hasPropertyValue(name: string): boolean;
    getRawProperty(type: number): string | undefined;
    getRawProperties(): RawValues;
    getProperties(): PropertyValues;
    getPropertiesMetadata(hidden?: boolean): IndexedProperty;
    hasProperty(name: string, hidden?: boolean): boolean;
    getCommands(): Array<CommandName>;
    hasCommand(name: CommandName): boolean;
    processPushNotification(_station: Station, _message: PushMessage, _eventDurationSeconds: number): void;
    setCustomPropertyValue(name: string, value: PropertyValue): void;
    destroy(): void;
    protected clearEventTimeout(eventType: DeviceEvent): void;
    static isSupported(type: number): boolean;
    static isCamera(type: number): boolean;
    static hasBattery(type: number): boolean;
    static isStation(type: number): boolean;
    static isCamera1(type: number): boolean;
    static isCameraE(type: number): boolean;
    static isSensor(type: number): boolean;
    static isKeyPad(type: number): boolean;
    static isDoorbell(type: number): boolean;
    static isWiredDoorbell(type: number): boolean;
    static isWiredDoorbellT8200X(type: number, serialnumber: string): boolean;
    static isWiredDoorbellDual(type: number): boolean;
    static isIndoorCamera(type: number): boolean;
    static isPanAndTiltCamera(type: number): boolean;
    static isOutdoorPanAndTiltCamera(type: number): boolean;
    static isIndoorPanAndTiltCameraS350(type: number): boolean;
    static isFloodLight(type: number): boolean;
    static isFloodLightT8420X(type: number, serialnumber: string): boolean;
    static isFloodLightT8425(type: number): boolean;
    static isWallLightCam(type: number): boolean;
    static isLock(type: number): boolean;
    static isLockKeypad(type: number): boolean;
    static isLockBle(type: number): boolean;
    static isLockBleNoFinger(type: number): boolean;
    static isLockWifi(type: number, serialnumber: string): boolean;
    static isLockWifiNoFinger(type: number): boolean;
    static isLockWifiR10(type: number): boolean;
    static isLockWifiR20(type: number): boolean;
    static isLockWifiVideo(type: number): boolean;
    static isLockWifiR10Keypad(type: number): boolean;
    static isLockWifiR20Keypad(type: number): boolean;
    static isLockWifiT8506(type: number): boolean;
    static isLockWifiT8502(type: number): boolean;
    static isLockWifiT8510P(type: number, serialnumber: string): boolean;
    static isLockWifiT8520P(type: number, serialnumber: string): boolean;
    static isBatteryDoorbell1(type: number): boolean;
    static isBatteryDoorbell2(type: number): boolean;
    static isBatteryDoorbellDual(type: number): boolean;
    static isBatteryDoorbellDualE340(type: number): boolean;
    static isDoorbellDual(type: number): boolean;
    static isBatteryDoorbell(type: number): boolean;
    static isSoloCamera(type: number): boolean;
    static isSoloCameraPro(type: number): boolean;
    static isSoloCameraSpotlight1080(type: number): boolean;
    static isSoloCameraSpotlight2k(type: number): boolean;
    static isSoloCameraSpotlightSolar(type: number): boolean;
    static isSoloCameraSolar(type: number): boolean;
    static isSoloCameraC210(type: number): boolean;
    static isSoloCameras(type: number): boolean;
    static isStarlight4GLTE(type: number): boolean;
    static isIndoorOutdoorCamera1080p(type: number): boolean;
    static isIndoorOutdoorCamera1080pNoLight(type: number): boolean;
    static isIndoorOutdoorCamera2k(type: number): boolean;
    static isIndoorCamMini(type: number): boolean;
    static isCamera1Product(type: number): boolean;
    static isCamera2(type: number): boolean;
    static isCamera2C(type: number): boolean;
    static isCamera2Pro(type: number): boolean;
    static isCamera2CPro(type: number): boolean;
    static isCamera2Product(type: number): boolean;
    static isCamera3(type: number): boolean;
    static isCamera3C(type: number): boolean;
    static isCameraProfessional247(type: number): boolean;
    static isCamera3Product(type: number): boolean;
    static isEntrySensor(type: number): boolean;
    static isMotionSensor(type: number): boolean;
    static isSmartDrop(type: number): boolean;
    static isSmartSafe(type: number): boolean;
    static isGarageCamera(type: number): boolean;
    static isIntegratedDeviceBySn(sn: string): boolean;
    static isSoloCameraBySn(sn: string): boolean;
    static isSmartDropBySn(sn: string): boolean;
    static isLockBySn(sn: string): boolean;
    static isGarageCameraBySn(sn: string): boolean;
    static isFloodlightBySn(sn: string): boolean;
    static isIndoorCameraBySn(sn: string): boolean;
    static is4GCameraBySn(sn: string): boolean;
    static isSmartSafeBySn(sn: string): boolean;
    static isSmartTrackCard(type: number): boolean;
    static isSmartTrackLink(type: number): boolean;
    static isSmartTrack(type: number): boolean;
    isCamera(): boolean;
    isFloodLight(): boolean;
    isFloodLightT8420X(): boolean;
    isFloodLightT8425(): boolean;
    isWallLightCam(): boolean;
    isDoorbell(): boolean;
    isWiredDoorbell(): boolean;
    isWiredDoorbellT8200X(): boolean;
    isWiredDoorbellDual(): boolean;
    isLock(): boolean;
    isLockKeypad(): boolean;
    isLockBle(): boolean;
    isLockBleNoFinger(): boolean;
    isLockWifi(): boolean;
    isLockWifiNoFinger(): boolean;
    isLockWifiR10(): boolean;
    isLockWifiR20(): boolean;
    isLockWifiVideo(): boolean;
    isLockWifiR10Keypad(): boolean;
    isLockWifiR20Keypad(): boolean;
    isLockWifiT8506(): boolean;
    isLockWifiT8502(): boolean;
    isLockWifiT8510P(): boolean;
    isLockWifiT8520P(): boolean;
    isBatteryDoorbell1(): boolean;
    isBatteryDoorbell2(): boolean;
    isBatteryDoorbellDual(): boolean;
    isBatteryDoorbellDualE340(): boolean;
    isDoorbellDual(): boolean;
    isBatteryDoorbell(): boolean;
    isSoloCamera(): boolean;
    isSoloCameraPro(): boolean;
    isSoloCameraSpotlight1080(): boolean;
    isSoloCameraSpotlight2k(): boolean;
    isSoloCameraSpotlightSolar(): boolean;
    isSoloCameraSolar(): boolean;
    isSoloCameraC210(): boolean;
    isStarlight4GLTE(): boolean;
    isIndoorOutdoorCamera1080p(): boolean;
    isIndoorOutdoorCamera1080pNoLight(): boolean;
    isIndoorOutdoorCamera2k(): boolean;
    isIndoorCamMini(): boolean;
    isSoloCameras(): boolean;
    isCamera2(): boolean;
    isCamera2C(): boolean;
    isCamera2Pro(): boolean;
    isCamera2CPro(): boolean;
    isCamera2Product(): boolean;
    isCamera3(): boolean;
    isCamera3C(): boolean;
    isCameraProfessional247(): boolean;
    isCamera3Product(): boolean;
    isEntrySensor(): boolean;
    isKeyPad(): boolean;
    isMotionSensor(): boolean;
    isIndoorCamera(): boolean;
    isPanAndTiltCamera(): boolean;
    isOutdoorPanAndTiltCamera(): boolean;
    isIndoorPanAndTiltCameraS350(): boolean;
    isSmartDrop(): boolean;
    isSmartSafe(): boolean;
    isGarageCamera(): boolean;
    isIntegratedDevice(): boolean;
    isSmartTrack(): boolean;
    isSmartTrackCard(): boolean;
    isSmartTrackLink(): boolean;
    hasBattery(): boolean;
    getDeviceKey(): string;
    getDeviceType(): number;
    getHardwareVersion(): string;
    getSoftwareVersion(): string;
    getModel(): string;
    getName(): string;
    getSerial(): string;
    getStationSerial(): string;
    setParameters(params: {
        paramType: number;
        paramValue: any;
    }[]): Promise<boolean>;
    getChannel(): number;
    getStateID(state: string, level?: number): string;
    getStateChannel(): string;
    getWifiRssi(): PropertyValue;
    getStoragePath(filename: string): string;
    isEnabled(): PropertyValue;
}
export declare class Camera extends Device {
    protected constructor(api: HTTPApi, device: DeviceListResponse);
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<Camera>;
    getStateChannel(): string;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    getLastCameraImageURL(): PropertyValue;
    getMACAddress(): string;
    startDetection(): Promise<void>;
    stopDetection(): Promise<void>;
    getState(): PropertyValue;
    close(): Promise<void>;
    getLastChargingDays(): number;
    getLastChargingFalseEvents(): number;
    getLastChargingRecordedEvents(): number;
    getLastChargingTotalEvents(): number;
    getBatteryValue(): PropertyValue;
    getBatteryTemperature(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    isLedEnabled(): PropertyValue;
    isAutoNightVisionEnabled(): PropertyValue;
    isRTSPStreamEnabled(): PropertyValue;
    isAntiTheftDetectionEnabled(): PropertyValue;
    getWatermark(): PropertyValue;
    isMotionDetected(): boolean;
    isPersonDetected(): boolean;
    getDetectedPerson(): string;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class SoloCamera extends Camera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<SoloCamera>;
    isLedEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class IndoorCamera extends Camera {
    protected constructor(api: HTTPApi, device: DeviceListResponse);
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<IndoorCamera>;
    isLedEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    isPetDetectionEnabled(): PropertyValue;
    isSoundDetectionEnabled(): PropertyValue;
    isPetDetected(): boolean;
    isSoundDetected(): boolean;
    isCryingDetected(): boolean;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
    destroy(): void;
}
export declare class DoorbellCamera extends Camera {
    protected voices: Voices;
    protected constructor(api: HTTPApi, device: DeviceListResponse, voices: Voices);
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<DoorbellCamera>;
    private loadMetadataVoiceStates;
    getVoiceName(id: number): string;
    getVoices(): Voices;
    getPropertiesMetadata(hidden?: boolean): IndexedProperty;
    isRinging(): boolean;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class WiredDoorbellCamera extends DoorbellCamera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<WiredDoorbellCamera>;
    isLedEnabled(): PropertyValue;
    isAutoNightVisionEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
}
export declare class BatteryDoorbellCamera extends DoorbellCamera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<BatteryDoorbellCamera>;
    isLedEnabled(): PropertyValue;
}
export declare class FloodlightCamera extends Camera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<FloodlightCamera>;
    isLedEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class WallLightCam extends Camera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<WallLightCam>;
    isLedEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    getPropertiesMetadata(hidden?: boolean): IndexedProperty;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class GarageCamera extends Camera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<GarageCamera>;
    isLedEnabled(): PropertyValue;
    isMotionDetectionEnabled(): PropertyValue;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class Sensor extends Device {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<Sensor>;
    getStateChannel(): string;
    getState(): PropertyValue;
}
export declare class EntrySensor extends Sensor {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<EntrySensor>;
    isSensorOpen(): PropertyValue;
    getSensorChangeTime(): PropertyValue;
    isBatteryLow(): PropertyValue;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
}
export declare class MotionSensor extends Sensor {
    static readonly MOTION_COOLDOWN_MS = 120000;
    protected constructor(api: HTTPApi, device: DeviceListResponse);
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<MotionSensor>;
    isMotionDetected(): boolean;
    getMotionSensorPIREvent(): PropertyValue;
    isBatteryLow(): PropertyValue;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class Lock extends Device {
    static readonly VERSION_CODE_SMART_LOCK = 3;
    static readonly VERSION_CODE_LOCKV12 = 18;
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<Lock>;
    getStateChannel(): string;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    getState(): PropertyValue;
    getBatteryValue(): PropertyValue;
    getWifiRssi(): PropertyValue;
    isLocked(): PropertyValue;
    getLockStatus(): PropertyValue;
    static encodeESLCmdOnOff(short_user_id: number, nickname: string, lock: boolean): Buffer;
    static encodeESLCmdQueryStatus(admin_user_id: string): Buffer;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
    processMQTTNotification(message: DeviceSmartLockNotifyData, eventDurationSeconds: number): void;
    private processNotification;
    private static getCurrentTimeInSeconds;
    private static getUInt8Buffer;
    private static getUint16LEBuffer;
    private static getUint16BEBuffer;
    static encodeCmdStatus(user_id: string): Buffer;
    static encodeCmdUnlock(short_user_id: string, value: number, username: string): Buffer;
    static encodeCmdCalibrate(user_id: string): Buffer;
    static encodeCmdAddUser(short_user_id: string, passcode: string, username: string, schedule?: Schedule, user_permission?: number): Buffer;
    static encodeCmdAddTemporaryUser(schedule?: Schedule, unlimited?: boolean): Buffer;
    static encodeCmdDeleteTemporaryUser(password_id: string): Buffer;
    static encodeCmdDeleteUser(short_user_id: string): Buffer;
    static encodeCmdVerifyPw(password: string): Buffer;
    static encodeCmdQueryLockRecord(index: number): Buffer;
    static encodeCmdQueryUser(short_user_id: string): Buffer;
    static encodeCmdQueryPassword(password_id: string): Buffer;
    static encodeCmdModifyPassword(password_id: string, passcode: string): Buffer;
    static encodeCmdUpdateSchedule(short_user_id: string, schedule: Schedule): Buffer;
    static encodeCmdModifyUsername(username: string, password_id: string): Buffer;
    static encodeCmdGetLockParam(user_id: string): Buffer;
    static encodeCmdSetLockParamAutoLock(enabled: boolean, lockTimeSeconds: number): Buffer;
    private static hexTime;
    static encodeCmdSetLockParamAutoLockSchedule(enabled: boolean, schedule_start: string, schedule_end: string): Buffer;
    static encodeCmdSetLockParamOneTouchLock(enabled: boolean): Buffer;
    static encodeCmdSetLockParamWrongTryProtect(enabled: boolean, lockdownTime: number, attempts: number): Buffer;
    static encodeCmdSetLockParamScramblePasscode(enabled: boolean): Buffer;
    static encodeCmdSetLockParamSound(value: number): Buffer;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    static encodeCmdSmartLockUnlock(adminUserId: string, lock: boolean, username: string, shortUserId: string): Buffer;
    static encodeCmdSmartLockCalibrate(adminUserId: string): Buffer;
    static encodeCmdSetSmartLockParamWrongTryProtect(adminUserId: string, enabled: boolean, attempts: number, lockdownTime: number): Buffer;
    private static hexTimeSmartLock;
    static encodeCmdSetSmartLockParamAutoLock(adminUserId: string, enabled: boolean, lockTimeSeconds: number, schedule: boolean, scheduleStart: string, scheduleEnd: string): Buffer;
    static encodeCmdSetSmartLockParamOneTouchLock(adminUserId: string, enabled: boolean): Buffer;
    static encodeCmdSetSmartLockParamScramblePasscode(adminUserId: string, enabled: boolean): Buffer;
    static encodeCmdSetSmartLockParamSound(adminUserId: string, value: number): Buffer;
    static encodeCmdSmartLockAddUser(adminUserId: string, shortUserId: string, passcode: string, username: string, schedule?: Schedule, userPermission?: number): Buffer;
    static encodeCmdSmartLockDeleteUser(adminUserId: string, shortUserId: string): Buffer;
    static encodeCmdSmartLockUpdateSchedule(adminUserId: string, shortUserId: string, username: string, schedule: Schedule, userPermission?: number): Buffer;
    static encodeCmdSmartLockModifyPassword(adminUserId: string, passwordId: string, passcode: string): Buffer;
    static encodeCmdSmartLockGetUserList(adminUserId: string): Buffer;
    static encodeCmdSmartLockStatus(adminUserId: string): Buffer;
    static encodeCmdSmartLockGetParams(adminUserId: string): Buffer;
}
export declare class LockKeypad extends Device {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<LockKeypad>;
    getStateChannel(): string;
}
export declare class Keypad extends Device {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<Keypad>;
    getStateChannel(): string;
    getState(): PropertyValue;
    isBatteryLow(): PropertyValue;
    isBatteryCharging(): PropertyValue;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
}
export declare class SmartSafe extends Device {
    static readonly IV = "052E19EB3F880512E99EBB684D4DC1FE";
    static readonly DATA_HEADER: number[];
    static readonly VERSION_CODE = 1;
    static readonly PUSH_NOTIFICATION_POSITION: {
        [index: string]: number;
    };
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<SmartSafe>;
    getStateChannel(): string;
    private static getCurrentTimeInSeconds;
    private static getUInt8Buffer;
    private static getUint16LEBuffer;
    private static encodeCmdSingleUInt8;
    static encodeCmdWrongTryProtect(user_id: string, enabled: boolean, attempts: number, lockdownTime: number): Buffer;
    static encodeCmdLeftOpenAlarm(user_id: string, enabled: boolean, duration: number): Buffer;
    static encodeCmdDualUnlock(user_id: string, enabled: boolean): Buffer;
    static encodeCmdScramblePIN(user_id: string, enabled: boolean): Buffer;
    static encodeCmdPowerSave(user_id: string, enabled: boolean): Buffer;
    static encodeCmdInteriorBrightness(user_id: string, interiorBrightness: number, duration: number): Buffer;
    static encodeCmdTamperAlarm(user_id: string, option: number): Buffer;
    static encodeCmdRemoteUnlock(user_id: string, option: number): Buffer;
    static encodeCmdAlertVolume(user_id: string, volume: number): Buffer;
    static encodeCmdPromptVolume(user_id: string, volume: number): Buffer;
    static encodeCmdPushNotification(user_id: string, modes: number): Buffer;
    static encodeCmdUnlock(user_id: string): Buffer;
    static encodeCmdVerifyPIN(user_id: string, pin: string): Buffer;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    shakeEvent(event: number, eventDurationSeconds: number): void;
    alarm911Event(event: number, eventDurationSeconds: number): void;
    jammedEvent(eventDurationSeconds: number): void;
    lowBatteryEvent(eventDurationSeconds: number): void;
    wrongTryProtectAlarmEvent(eventDurationSeconds: number): void;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    getState(): PropertyValue;
    getBatteryValue(): PropertyValue;
    getWifiRssi(): PropertyValue;
    isLocked(): boolean;
}
export declare class Tracker extends Device {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<Tracker>;
    getStateChannel(): string;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    setFindPhone(value: boolean): Promise<boolean>;
    setLeftBehindAlarm(value: boolean): Promise<boolean>;
    setTrackerType(value: TrackerType): Promise<boolean>;
}
export declare class DoorbellLock extends DoorbellCamera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<DoorbellLock>;
    getStateChannel(): string;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
    protected convertRawPropertyValue(property: PropertyMetadataAny, value: string): PropertyValue;
    getState(): PropertyValue;
    getBatteryValue(): PropertyValue;
    getWifiRssi(): PropertyValue;
    isLocked(): PropertyValue;
    getLockStatus(): PropertyValue;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
}
export declare class SmartDrop extends Camera {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<SmartDrop>;
    getStateChannel(): string;
    processPushNotification(station: Station, message: PushMessage, eventDurationSeconds: number): void;
    protected handlePropertyChange(metadata: PropertyMetadataAny, oldValue: PropertyValue, newValue: PropertyValue): void;
}
export declare class UnknownDevice extends Device {
    static getInstance(api: HTTPApi, device: DeviceListResponse): Promise<UnknownDevice>;
    getStateChannel(): string;
}
