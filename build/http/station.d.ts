import { TypedEmitter } from "tiny-typed-emitter";
import { HTTPApi } from "./api";
import { AlarmTone, NotificationSwitchMode, DeviceType, FloodlightMotionTriggeredDistance, GuardMode, NotificationType, PowerSource, PropertyName, TimeFormat, CommandName, VideoTypeStoreToNAS, HB3DetectionTypes, WalllightNotificationType, DailyLightingType, MotionActivationMode, LightingActiveMode, SourceType, T8170DetectionTypes, IndoorS350NotificationTypes, SoloCameraDetectionTypes, MotionDetectionRangeType, ViewModeType, FloodlightT8425NotificationTypes, PresetPositionType, IndoorS350DetectionTypes } from "./types";
import { SnoozeDetail, StationListResponse } from "./models";
import { IndexedProperty, PropertyMetadataAny, PropertyValue, PropertyValues, RawValues, StationEvents, Schedule } from "./interfaces";
import { CrossTrackingGroupEntry, DynamicLighting, MotionZone, RGBColor } from "../p2p/interfaces";
import { CalibrateGarageType, FilterDetectType, FilterEventType, FilterStorageType, P2PConnectionType, PanTiltDirection, VideoCodec, WatermarkSetting1, WatermarkSetting2, WatermarkSetting3, WatermarkSetting4, WatermarkSetting5 } from "../p2p/types";
import { Device } from "./device";
import { PushMessage } from "../push/models";
export declare class Station extends TypedEmitter<StationEvents> {
    private api;
    private rawStation;
    private p2pSession;
    private properties;
    private rawProperties;
    private ready;
    private lockPublicKey;
    private currentDelay;
    private reconnectTimeout?;
    private terminating;
    private p2pConnectionType;
    static readonly CHANNEL: number;
    static readonly CHANNEL_INDOOR: number;
    private pinVerified;
    protected constructor(api: HTTPApi, station: StationListResponse, ipAddress?: string, listeningPort?: number, publicKey?: string, enableEmbeddedPKCS1Support?: boolean);
    protected initializeState(): void;
    initialize(): void;
    static getInstance(api: HTTPApi, stationData: StationListResponse, ipAddress?: string, listeningPort?: number, enableEmbeddedPKCS1Support?: boolean): Promise<Station>;
    getStateID(state: string, level?: number): string;
    getStateChannel(): string;
    getRawStation(): StationListResponse;
    update(station: StationListResponse): void;
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
    static getChannel(type: number): number;
    static isStation(type: number): boolean;
    isStation(): boolean;
    static isStationHomeBase3(type: number): boolean;
    static isStationHomeBase3BySn(sn: string): boolean;
    isStationHomeBase3(): boolean;
    isIntegratedDevice(): boolean;
    isP2PConnectableDevice(): boolean;
    getDeviceType(): number;
    getHardwareVersion(): string;
    getMACAddress(): string;
    getModel(): string;
    getName(): string;
    getSerial(): string;
    getSoftwareVersion(): string;
    getIPAddress(): string;
    getLANIPAddress(): PropertyValue;
    getGuardMode(): PropertyValue;
    getCurrentMode(): PropertyValue;
    processPushNotification(message: PushMessage): void;
    isConnected(): boolean;
    close(): void;
    isEnergySavingDevice(): boolean;
    connect(): Promise<void>;
    private onFinishDownload;
    private onStartDownload;
    private onStopLivestream;
    private onErrorLivestream;
    private onStartLivestream;
    private onStopRTSPLivestream;
    private onStartRTSPLivestream;
    private onWifiRssiChanged;
    private onRTSPUrl;
    private onParameter;
    private onAlarmDelay;
    private onAlarmArmed;
    private onAlarmEvent;
    setGuardMode(mode: GuardMode): void;
    getCameraInfo(): void;
    getStorageInfoEx(): void;
    private onAlarmMode;
    private getArmDelay;
    private _getDeviceSerial;
    private _handleCameraInfoParameters;
    private onCameraInfo;
    private onCommandResponse;
    private onSecondaryCommandResponse;
    private onConnect;
    private onDisconnect;
    private onTimeout;
    private getCurrentDelay;
    private resetCurrentDelay;
    private scheduleReconnect;
    rebootHUB(): void;
    setStatusLed(device: Device, value: boolean): void;
    setAutoNightVision(device: Device, value: boolean): void;
    setNightVision(device: Device, value: number): void;
    setMotionDetection(device: Device, value: boolean): void;
    setSoundDetection(device: Device, value: boolean): void;
    setSoundDetectionType(device: Device, value: number): void;
    setSoundDetectionSensitivity(device: Device, value: number): void;
    setPetDetection(device: Device, value: boolean): void;
    panAndTilt(device: Device, direction: PanTiltDirection, command?: number): void;
    switchLight(device: Device, value: boolean): void;
    setMotionDetectionSensitivity(device: Device, value: number): void;
    setMotionDetectionType(device: Device, value: number): void;
    setMotionDetectionTypeHB3(device: Device, type: HB3DetectionTypes | T8170DetectionTypes | SoloCameraDetectionTypes | IndoorS350DetectionTypes, value: boolean): void;
    setMotionZone(device: Device, value: MotionZone): void;
    setMotionTracking(device: Device, value: boolean): void;
    setPanAndTiltRotationSpeed(device: Device, value: number): void;
    setMicMute(device: Device, value: boolean): void;
    setAudioRecording(device: Device, value: boolean): void;
    enableSpeaker(device: Device, value: boolean): void;
    setSpeakerVolume(device: Device, value: number): void;
    setRingtoneVolume(device: Device, value: number): void;
    enableIndoorChime(device: Device, value: boolean): void;
    enableHomebaseChime(device: Device, value: boolean): void;
    setHomebaseChimeRingtoneVolume(device: Device, value: number): void;
    setHomebaseChimeRingtoneType(device: Device, value: number): void;
    setNotificationType(device: Device, value: NotificationType | WalllightNotificationType): void;
    setNotificationPerson(device: Device, value: boolean): void;
    setNotificationPet(device: Device, value: boolean): void;
    setNotificationAllOtherMotion(device: Device, value: boolean): void;
    setNotificationAllSound(device: Device, value: boolean): void;
    setNotificationCrying(device: Device, value: boolean): void;
    setNotificationRing(device: Device, value: boolean): void;
    setNotificationMotion(device: Device, value: boolean): void;
    setPowerSource(device: Device, value: PowerSource): void;
    setPowerWorkingMode(device: Device, value: number): void;
    setRecordingClipLength(device: Device, value: number): void;
    setRecordingRetriggerInterval(device: Device, value: number): void;
    setRecordingEndClipMotionStops(device: Device, value: boolean): void;
    setVideoStreamingQuality(device: Device, value: number): void;
    setVideoRecordingQuality(device: Device, value: number): void;
    setWDR(device: Device, value: boolean): void;
    setFloodlightLightSettingsEnable(device: Device, value: boolean): void;
    setFloodlightLightSettingsBrightnessManual(device: Device, value: number): void;
    setFloodlightLightSettingsBrightnessMotion(device: Device, value: number): void;
    setFloodlightLightSettingsBrightnessSchedule(device: Device, value: number): void;
    setFloodlightLightSettingsMotionTriggered(device: Device, value: boolean): void;
    setFloodlightLightSettingsMotionTriggeredDistance(device: Device, value: FloodlightMotionTriggeredDistance): void;
    setFloodlightLightSettingsMotionTriggeredTimer(device: Device, seconds: number): void;
    triggerStationAlarmSound(seconds: number): void;
    resetStationAlarmSound(): void;
    triggerDeviceAlarmSound(device: Device, seconds: number): void;
    resetDeviceAlarmSound(device: Device): void;
    setStationAlarmRingtoneVolume(value: number): void;
    setStationAlarmTone(value: AlarmTone): void;
    setStationPromptVolume(value: number): void;
    setStationNotificationSwitchMode(mode: NotificationSwitchMode, value: boolean): void;
    setStationNotificationStartAlarmDelay(value: boolean): void;
    setStationTimeFormat(value: TimeFormat): void;
    setRTSPStream(device: Device, value: boolean): void;
    setAntiTheftDetection(device: Device, value: boolean): void;
    setWatermark(device: Device, value: WatermarkSetting1 | WatermarkSetting2 | WatermarkSetting3 | WatermarkSetting4 | WatermarkSetting5): void;
    enableDevice(device: Device, value: boolean): void;
    startDownload(device: Device, path: string, cipher_id?: number): Promise<void>;
    cancelDownload(device: Device): void;
    startLivestream(device: Device, videoCodec?: VideoCodec, skipLiveStreamingCheck?: boolean): void;
    stopLivestream(device: Device): void;
    isLiveStreaming(device: Device): boolean;
    isDownloading(device: Device): boolean;
    quickResponse(device: Device, voice_id: number): void;
    setChirpVolume(device: Device, value: number): void;
    setChirpTone(device: Device, value: number): void;
    setHDR(device: Device, value: boolean): void;
    setDistortionCorrection(device: Device, value: boolean): void;
    setRingRecord(device: Device, value: number): void;
    lockDevice(device: Device, value: boolean): void;
    setStationSwitchModeWithAccessCode(value: boolean): void;
    setStationAutoEndAlarm(value: boolean): void;
    setStationTurnOffAlarmWithButton(value: boolean): void;
    startRTSPStream(device: Device): void;
    stopRTSPStream(device: Device): void;
    setMotionDetectionRange(device: Device, type: MotionDetectionRangeType): void;
    setMotionDetectionRangeStandardSensitivity(device: Device, sensitivity: number): void;
    setMotionDetectionRangeAdvancedLeftSensitivity(device: Device, sensitivity: number): void;
    setMotionDetectionRangeAdvancedMiddleSensitivity(device: Device, sensitivity: number): void;
    setMotionDetectionRangeAdvancedRightSensitivity(device: Device, sensitivity: number): void;
    setMotionDetectionTestMode(device: Device, enabled: boolean): void;
    setMotionTrackingSensitivity(device: Device, sensitivity: number): void;
    setMotionAutoCruise(device: Device, enabled: boolean): void;
    setMotionOutOfViewDetection(device: Device, enabled: boolean): void;
    setLightSettingsColorTemperatureManual(device: Device, value: number): void;
    setLightSettingsColorTemperatureMotion(device: Device, value: number): void;
    setLightSettingsColorTemperatureSchedule(device: Device, value: number): void;
    setLightSettingsMotionActivationMode(device: Device, value: MotionActivationMode): void;
    setVideoNightvisionImageAdjustment(device: Device, enabled: boolean): void;
    setVideoColorNightvision(device: Device, enabled: boolean): void;
    setAutoCalibration(device: Device, enabled: boolean): void;
    isRTSPLiveStreaming(device: Device): boolean;
    setConnectionType(type: P2PConnectionType): void;
    getConnectionType(): P2PConnectionType;
    private onRuntimeState;
    private onChargingState;
    hasDevice(deviceSN: string): boolean;
    hasDeviceWithType(deviceType: DeviceType): boolean;
    private onFloodlightManualSwitch;
    calibrateLock(device: Device): void;
    private convertAdvancedLockSettingValue;
    private convertAdvancedLockSettingValueT8530;
    private getAdvancedLockSettingsPayload;
    private getAdvancedLockSettingsPayloadT8530;
    private getAdvancedLockSettingName;
    private getAdvancedLockSettingNameT8530;
    setAdvancedLockParams(device: Device, property: PropertyName, value: PropertyValue): void;
    setLoiteringDetection(device: Device, value: boolean): void;
    setLoiteringDetectionRange(device: Device, value: number): void;
    setLoiteringDetectionLength(device: Device, value: number): void;
    private _setMotionDetectionSensitivity;
    private _getMotionDetectionSensitivityAdvanced;
    setMotionDetectionSensitivityMode(device: Device, value: number): void;
    setMotionDetectionSensitivityStandard(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedA(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedB(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedC(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedD(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedE(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedF(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedG(device: Device, value: number): void;
    setMotionDetectionSensitivityAdvancedH(device: Device, value: number): void;
    private _setLoiteringCustomResponse;
    setLoiteringCustomResponseAutoVoiceResponse(device: Device, value: boolean): void;
    setLoiteringCustomResponseAutoVoiceResponseVoice(device: Device, value: number): void;
    setLoiteringCustomResponseHomeBaseNotification(device: Device, value: boolean): void;
    setLoiteringCustomResponsePhoneNotification(device: Device, value: boolean): void;
    setLoiteringCustomResponseTimeFrom(device: Device, value: string): void;
    setLoiteringCustomResponseTimeTo(device: Device, value: string): void;
    setDeliveryGuard(device: Device, value: boolean): void;
    setDeliveryGuardPackageGuarding(device: Device, value: boolean): void;
    setDeliveryGuardPackageGuardingVoiceResponseVoice(device: Device, value: number): void;
    private setDeliveryGuardPackageGuardingActivatedTime;
    setDeliveryGuardPackageGuardingActivatedTimeFrom(device: Device, value: string): void;
    setDeliveryGuardPackageGuardingActivatedTimeTo(device: Device, value: string): void;
    setDeliveryGuardUncollectedPackageAlert(device: Device, value: boolean): void;
    setDeliveryGuardUncollectedPackageAlertTimeToCheck(device: Device, value: string): void;
    setDeliveryGuardPackageLiveCheckAssistance(device: Device, value: boolean): void;
    setDualCamWatchViewMode(device: Device, value: ViewModeType): void;
    private _setRingAutoResponse;
    setRingAutoResponse(device: Device, value: boolean): void;
    setRingAutoResponseVoiceResponse(device: Device, value: boolean): void;
    setRingAutoResponseVoiceResponseVoice(device: Device, value: number): void;
    setRingAutoResponseTimeFrom(device: Device, value: string): void;
    setRingAutoResponseTimeTo(device: Device, value: string): void;
    setNotificationRadarDetector(device: Device, value: boolean): void;
    calibrate(device: Device): void;
    setContinuousRecording(device: Device, value: boolean): void;
    setContinuousRecordingType(device: Device, value: number): void;
    enableDefaultAngle(device: Device, value: boolean): void;
    setDefaultAngleIdleTime(device: Device, value: number): void;
    setDefaultAngle(device: Device): void;
    setPrivacyAngle(device: Device): void;
    setNotificationIntervalTime(device: Device, value: number): void;
    setSoundDetectionRoundLook(device: Device, value: boolean): void;
    startTalkback(device: Device): void;
    stopTalkback(device: Device): void;
    private onTalkbackStarted;
    private onTalkbackStopped;
    private onTalkbackError;
    isTalkbackOngoing(device: Device): boolean;
    setScramblePasscode(device: Device, value: boolean): void;
    setWrongTryProtection(device: Device, value: boolean): void;
    setWrongTryAttempts(device: Device, value: number): void;
    setWrongTryLockdownTime(device: Device, value: number): void;
    private _sendSmartSafeCommand;
    setSmartSafeParams(device: Device, property: PropertyName, value: PropertyValue): void;
    unlock(device: Device): void;
    verifyPIN(device: Device, pin: string): void;
    private onDeviceShakeAlarm;
    private onDevice911Alarm;
    private onDeviceJammed;
    private onDeviceLowBattery;
    private onDeviceWrongTryProtectAlarm;
    private onSdInfoEx;
    setVideoTypeStoreToNAS(device: Device, value: VideoTypeStoreToNAS): void;
    snooze(device: Device, value: SnoozeDetail): void;
    addUser(device: Device, username: string, shortUserId: string, passcode: string, schedule?: Schedule): void;
    deleteUser(device: Device, username: string, shortUserId: string): void;
    updateUserSchedule(device: Device, username: string, shortUserId: string, schedule: Schedule): void;
    updateUserPasscode(device: Device, username: string, passwordId: string, passcode: string): void;
    setLockV12Params(device: Device, property: PropertyName, value: PropertyValue): void;
    setSmartLockParams(device: Device, property: PropertyName, value: PropertyValue): void;
    setAutoLock(device: Device, value: boolean): void;
    setAutoLockSchedule(device: Device, value: boolean): void;
    setAutoLockScheduleStartTime(device: Device, value: string): void;
    setAutoLockScheduleEndTime(device: Device, value: string): void;
    setAutoLockTimer(device: Device, value: number): void;
    setOneTouchLocking(device: Device, value: boolean): void;
    setSound(device: Device, value: number): void;
    setNotification(device: Device, value: boolean): void;
    setNotificationLocked(device: Device, value: boolean): void;
    setNotificationUnlocked(device: Device, value: boolean): void;
    private _sendLockV12P2PCommand;
    queryAllUserId(device: Device): void;
    chimeHomebase(value: number): void;
    private onImageDownload;
    downloadImage(cover_path: string): void;
    private onTFCardStatus;
    databaseQueryLatestInfo(failureCallback?: () => void): void;
    databaseQueryLocal(serialNumbers: Array<string>, startDate: Date, endDate: Date, eventType?: FilterEventType, detectionType?: FilterDetectType, storageType?: FilterStorageType): void;
    databaseDelete(ids: Array<number>): void;
    databaseCountByDate(startDate: Date, endDate: Date): void;
    private onDatabaseQueryLatest;
    private onDatabaseQueryLocal;
    private onDatabaseCountByDate;
    private onDatabaseDelete;
    private onSensorStatus;
    setMotionDetectionTypeHuman(device: Device, value: boolean): void;
    setMotionDetectionTypeAllOtherMotions(device: Device, value: boolean): void;
    private _setLightSettingsLightingActiveMode;
    setLightSettingsManualLightingActiveMode(device: Device, value: LightingActiveMode): void;
    setLightSettingsManualDailyLighting(device: Device, value: DailyLightingType): void;
    setLightSettingsManualColoredLighting(device: Device, value: RGBColor): void;
    setLightSettingsManualDynamicLighting(device: Device, value: number): void;
    setLightSettingsMotionLightingActiveMode(device: Device, value: LightingActiveMode): void;
    setLightSettingsMotionDailyLighting(device: Device, value: DailyLightingType): void;
    setLightSettingsMotionColoredLighting(device: Device, value: RGBColor): void;
    setLightSettingsMotionDynamicLighting(device: Device, value: number): void;
    setLightSettingsScheduleLightingActiveMode(device: Device, value: LightingActiveMode): void;
    setLightSettingsScheduleDailyLighting(device: Device, value: DailyLightingType): void;
    setLightSettingsScheduleColoredLighting(device: Device, value: RGBColor): void;
    setLightSettingsScheduleDynamicLighting(device: Device, value: number): void;
    setLightSettingsColoredLightingColors(device: Device, value: Array<RGBColor>): void;
    setLightSettingsDynamicLightingThemes(device: Device, value: Array<DynamicLighting>): void;
    setDoorControlWarning(device: Device, value: boolean): void;
    openDoor(device: Device, value: boolean, doorId?: number): void;
    private onGarageDoorStatus;
    calibrateGarageDoor(device: Device, doorId: number, type: CalibrateGarageType): void;
    private onStorageInfoHB3;
    setMirrorMode(device: Device, value: boolean): void;
    setFlickerAdjustment(device: Device, value: number): void;
    setCrossCameraTracking(value: boolean): void;
    setContinuousTrackingTime(value: number): void;
    setTrackingAssistance(value: boolean): void;
    setCrossTrackingCameraList(value: Array<string>): void;
    setCrossTrackingGroupList(value: Array<CrossTrackingGroupEntry>): void;
    setNotificationIndoor(device: Device, type: IndoorS350NotificationTypes, value: boolean): void;
    setNotificationFloodlightT8425(device: Device, type: FloodlightT8425NotificationTypes, value: boolean): void;
    presetPosition(device: Device, position: PresetPositionType): void;
    savePresetPosition(device: Device, position: PresetPositionType): void;
    deletePresetPosition(device: Device, position: PresetPositionType): void;
    setLeavingDetection(device: Device, value: boolean): void;
    private _setLeavingReactions;
    setLeavingReactionNotification(device: Device, value: boolean): void;
    setLeavingReactionStartTime(device: Device, value: string): void;
    setLeavingReactionEndTime(device: Device, value: string): void;
    setBeepVolume(device: Device, value: number): void;
    setNightvisionOptimization(device: Device, value: boolean): void;
    setNightvisionOptimizationSide(device: Device, value: number): void;
    getLockParameters(): void;
    getLockStatus(): void;
    private onSequenceError;
    updateUsername(device: Device, username: string, passwordId: string): void;
    setOpenMethod(device: Device, value: number): void;
    setMotionActivatedPrompt(device: Device, value: boolean): void;
    open(device: Device): void;
}
