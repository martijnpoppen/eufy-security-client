"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStyle = exports.IndoorPushMessageType = exports.HB3HDDType = exports.HB3PairedDeviceMessageType = exports.HB3PairedDevicePushEvent = exports.SmartSafeEvent = exports.GarageDoorPushEvent = exports.IndoorPushEvent = exports.LockPushEvent = exports.DoorbellPushEvent = exports.ServerPushEvent = exports.CusPushMode = exports.CusPushAlarmType = exports.CusPushEvent = void 0;
var CusPushEvent;
(function (CusPushEvent) {
    CusPushEvent[CusPushEvent["SECURITY"] = 1] = "SECURITY";
    CusPushEvent[CusPushEvent["TFCARD"] = 2] = "TFCARD";
    CusPushEvent[CusPushEvent["DOOR_SENSOR"] = 3] = "DOOR_SENSOR";
    CusPushEvent[CusPushEvent["CAM_STATE"] = 4] = "CAM_STATE";
    CusPushEvent[CusPushEvent["GSENSOR"] = 5] = "GSENSOR";
    CusPushEvent[CusPushEvent["BATTERY_LOW"] = 6] = "BATTERY_LOW";
    CusPushEvent[CusPushEvent["BATTERY_HOT"] = 7] = "BATTERY_HOT";
    CusPushEvent[CusPushEvent["LIGHT_STATE"] = 8] = "LIGHT_STATE";
    CusPushEvent[CusPushEvent["MODE_SWITCH"] = 9] = "MODE_SWITCH";
    CusPushEvent[CusPushEvent["ALARM"] = 10] = "ALARM";
    CusPushEvent[CusPushEvent["BATTERY_FULL"] = 11] = "BATTERY_FULL";
    CusPushEvent[CusPushEvent["REPEATER_RSSI_WEAK"] = 12] = "REPEATER_RSSI_WEAK";
    CusPushEvent[CusPushEvent["UPGRADE_STATUS"] = 13] = "UPGRADE_STATUS";
    CusPushEvent[CusPushEvent["MOTION_SENSOR_PIR"] = 14] = "MOTION_SENSOR_PIR";
    CusPushEvent[CusPushEvent["ALARM_DELAY"] = 16] = "ALARM_DELAY";
    CusPushEvent[CusPushEvent["HUB_BATT_POWERED"] = 17] = "HUB_BATT_POWERED";
    CusPushEvent[CusPushEvent["SENSOR_NO_OPEN"] = 18] = "SENSOR_NO_OPEN";
})(CusPushEvent || (exports.CusPushEvent = CusPushEvent = {}));
var CusPushAlarmType;
(function (CusPushAlarmType) {
    CusPushAlarmType[CusPushAlarmType["HUB_STOP"] = 0] = "HUB_STOP";
    CusPushAlarmType[CusPushAlarmType["DEV_STOP"] = 1] = "DEV_STOP";
    CusPushAlarmType[CusPushAlarmType["GSENSOR"] = 2] = "GSENSOR";
    CusPushAlarmType[CusPushAlarmType["PIR"] = 3] = "PIR";
    CusPushAlarmType[CusPushAlarmType["APP"] = 4] = "APP";
    CusPushAlarmType[CusPushAlarmType["HOT"] = 5] = "HOT";
    CusPushAlarmType[CusPushAlarmType["DOOR"] = 6] = "DOOR";
    CusPushAlarmType[CusPushAlarmType["CAMERA"] = 7] = "CAMERA";
    CusPushAlarmType[CusPushAlarmType["MOTION_SENSOR"] = 8] = "MOTION_SENSOR";
    CusPushAlarmType[CusPushAlarmType["CAMERA_GSENSOR"] = 9] = "CAMERA_GSENSOR";
    CusPushAlarmType[CusPushAlarmType["CAMERA_APP"] = 10] = "CAMERA_APP";
    CusPushAlarmType[CusPushAlarmType["CAMERA_LINKAGE"] = 11] = "CAMERA_LINKAGE";
    CusPushAlarmType[CusPushAlarmType["HUB_LINKAGE"] = 12] = "HUB_LINKAGE";
    CusPushAlarmType[CusPushAlarmType["HUB_KEYPAD_PANIC_BUTTON"] = 13] = "HUB_KEYPAD_PANIC_BUTTON";
    CusPushAlarmType[CusPushAlarmType["HUB_KEYPAD_EMERGENCY_CODE"] = 14] = "HUB_KEYPAD_EMERGENCY_CODE";
    CusPushAlarmType[CusPushAlarmType["HUB_STOP_BY_KEYPAD"] = 15] = "HUB_STOP_BY_KEYPAD";
    CusPushAlarmType[CusPushAlarmType["HUB_STOP_BY_APP"] = 16] = "HUB_STOP_BY_APP";
    CusPushAlarmType[CusPushAlarmType["HUB_STOP_BY_HUB"] = 17] = "HUB_STOP_BY_HUB";
    CusPushAlarmType[CusPushAlarmType["HUB_KEYPAD_CUSTOM_NOT_MAP"] = 18] = "HUB_KEYPAD_CUSTOM_NOT_MAP";
})(CusPushAlarmType || (exports.CusPushAlarmType = CusPushAlarmType = {}));
var CusPushMode;
(function (CusPushMode) {
    CusPushMode[CusPushMode["SWITCH_FROM_KEYPAD"] = 1] = "SWITCH_FROM_KEYPAD";
    CusPushMode[CusPushMode["SWITCH_FROM_APP"] = 2] = "SWITCH_FROM_APP";
    CusPushMode[CusPushMode["SWITCH"] = 9] = "SWITCH";
})(CusPushMode || (exports.CusPushMode = CusPushMode = {}));
var ServerPushEvent;
(function (ServerPushEvent) {
    ServerPushEvent[ServerPushEvent["INVITE_DEVICE"] = 10300] = "INVITE_DEVICE";
    ServerPushEvent[ServerPushEvent["REMOVE_DEVICE"] = 10200] = "REMOVE_DEVICE";
    ServerPushEvent[ServerPushEvent["REMOVE_HOMEBASE"] = 10100] = "REMOVE_HOMEBASE";
    ServerPushEvent[ServerPushEvent["VERIFICATION"] = 10500] = "VERIFICATION";
    ServerPushEvent[ServerPushEvent["WEB_ACTION"] = 10800] = "WEB_ACTION";
    ServerPushEvent[ServerPushEvent["ALARM_NOTIFY"] = 10900] = "ALARM_NOTIFY";
    ServerPushEvent[ServerPushEvent["ALARM_GUEST_NOTIFY"] = 11000] = "ALARM_GUEST_NOTIFY";
    ServerPushEvent[ServerPushEvent["HOUSE_ADDED"] = 11400] = "HOUSE_ADDED";
    ServerPushEvent[ServerPushEvent["HOUSE_INVITE"] = 11300] = "HOUSE_INVITE";
    ServerPushEvent[ServerPushEvent["HOUSE_REMOVE"] = 11200] = "HOUSE_REMOVE";
})(ServerPushEvent || (exports.ServerPushEvent = ServerPushEvent = {}));
var DoorbellPushEvent;
(function (DoorbellPushEvent) {
    DoorbellPushEvent[DoorbellPushEvent["BACKGROUND_ACTIVE"] = 3100] = "BACKGROUND_ACTIVE";
    DoorbellPushEvent[DoorbellPushEvent["MOTION_DETECTION"] = 3101] = "MOTION_DETECTION";
    DoorbellPushEvent[DoorbellPushEvent["FACE_DETECTION"] = 3102] = "FACE_DETECTION";
    DoorbellPushEvent[DoorbellPushEvent["PRESS_DOORBELL"] = 3103] = "PRESS_DOORBELL";
    DoorbellPushEvent[DoorbellPushEvent["OFFLINE"] = 3106] = "OFFLINE";
    DoorbellPushEvent[DoorbellPushEvent["ONLINE"] = 3107] = "ONLINE";
    DoorbellPushEvent[DoorbellPushEvent["PACKAGE_DELIVERED"] = 3301] = "PACKAGE_DELIVERED";
    DoorbellPushEvent[DoorbellPushEvent["PACKAGE_TAKEN"] = 3302] = "PACKAGE_TAKEN";
    DoorbellPushEvent[DoorbellPushEvent["FAMILY_DETECTION"] = 3303] = "FAMILY_DETECTION";
    DoorbellPushEvent[DoorbellPushEvent["PACKAGE_STRANDED"] = 3304] = "PACKAGE_STRANDED";
    DoorbellPushEvent[DoorbellPushEvent["SOMEONE_LOITERING"] = 3305] = "SOMEONE_LOITERING";
    DoorbellPushEvent[DoorbellPushEvent["RADAR_MOTION_DETECTION"] = 3306] = "RADAR_MOTION_DETECTION";
})(DoorbellPushEvent || (exports.DoorbellPushEvent = DoorbellPushEvent = {}));
var LockPushEvent;
(function (LockPushEvent) {
    LockPushEvent[LockPushEvent["APP_LOCK"] = 264] = "APP_LOCK";
    LockPushEvent[LockPushEvent["APP_UNLOCK"] = 261] = "APP_UNLOCK";
    LockPushEvent[LockPushEvent["AUTO_LOCK"] = 265] = "AUTO_LOCK";
    LockPushEvent[LockPushEvent["AUTO_UNLOCK"] = 258] = "AUTO_UNLOCK";
    LockPushEvent[LockPushEvent["FINGERPRINT_UNLOCK"] = 260] = "FINGERPRINT_UNLOCK";
    LockPushEvent[LockPushEvent["FINGER_LOCK"] = 267] = "FINGER_LOCK";
    LockPushEvent[LockPushEvent["KEYPAD_LOCK"] = 263] = "KEYPAD_LOCK";
    LockPushEvent[LockPushEvent["LOCK_MECHANICAL_ANOMALY"] = 519] = "LOCK_MECHANICAL_ANOMALY";
    LockPushEvent[LockPushEvent["LOCK_OFFLINE"] = 516] = "LOCK_OFFLINE";
    LockPushEvent[LockPushEvent["LOW_POWER"] = 513] = "LOW_POWER";
    LockPushEvent[LockPushEvent["MANUAL_LOCK"] = 262] = "MANUAL_LOCK";
    LockPushEvent[LockPushEvent["MANUAL_UNLOCK"] = 257] = "MANUAL_UNLOCK";
    LockPushEvent[LockPushEvent["MECHANICAL_ANOMALY"] = 517] = "MECHANICAL_ANOMALY";
    LockPushEvent[LockPushEvent["MULTIPLE_ERRORS"] = 515] = "MULTIPLE_ERRORS";
    LockPushEvent[LockPushEvent["PW_LOCK"] = 266] = "PW_LOCK";
    LockPushEvent[LockPushEvent["PW_UNLOCK"] = 259] = "PW_UNLOCK";
    LockPushEvent[LockPushEvent["TEMPORARY_PW_LOCK"] = 268] = "TEMPORARY_PW_LOCK";
    LockPushEvent[LockPushEvent["TEMPORARY_PW_UNLOCK"] = 269] = "TEMPORARY_PW_UNLOCK";
    LockPushEvent[LockPushEvent["VERY_LOW_POWER"] = 514] = "VERY_LOW_POWER";
    LockPushEvent[LockPushEvent["VIOLENT_DESTRUCTION"] = 518] = "VIOLENT_DESTRUCTION";
    LockPushEvent[LockPushEvent["LOCK_ONLINE"] = 771] = "LOCK_ONLINE";
    LockPushEvent[LockPushEvent["OTA_STATUS"] = 770] = "OTA_STATUS";
    LockPushEvent[LockPushEvent["STATUS_CHANGE"] = 769] = "STATUS_CHANGE";
})(LockPushEvent || (exports.LockPushEvent = LockPushEvent = {}));
var IndoorPushEvent;
(function (IndoorPushEvent) {
    IndoorPushEvent[IndoorPushEvent["MOTION_DETECTION"] = 3101] = "MOTION_DETECTION";
    IndoorPushEvent[IndoorPushEvent["FACE_DETECTION"] = 3102] = "FACE_DETECTION";
    IndoorPushEvent[IndoorPushEvent["CRYING_DETECTION"] = 3104] = "CRYING_DETECTION";
    IndoorPushEvent[IndoorPushEvent["SOUND_DETECTION"] = 3105] = "SOUND_DETECTION";
    IndoorPushEvent[IndoorPushEvent["PET_DETECTION"] = 3106] = "PET_DETECTION";
    IndoorPushEvent[IndoorPushEvent["VEHICLE_DETECTION"] = 3107] = "VEHICLE_DETECTION";
})(IndoorPushEvent || (exports.IndoorPushEvent = IndoorPushEvent = {}));
var GarageDoorPushEvent;
(function (GarageDoorPushEvent) {
    GarageDoorPushEvent[GarageDoorPushEvent["CLOSED_DOOR_BY_APP"] = 1] = "CLOSED_DOOR_BY_APP";
    GarageDoorPushEvent[GarageDoorPushEvent["OPEN_DOOR_BY_APP"] = 2] = "OPEN_DOOR_BY_APP";
    GarageDoorPushEvent[GarageDoorPushEvent["CLOSED_DOOR_WITHOUT_APP"] = 3] = "CLOSED_DOOR_WITHOUT_APP";
    GarageDoorPushEvent[GarageDoorPushEvent["OPEN_DOOR_WITHOUT_APP"] = 4] = "OPEN_DOOR_WITHOUT_APP";
    GarageDoorPushEvent[GarageDoorPushEvent["TIMEOUT_DOOR_OPEN_WARNING"] = 5] = "TIMEOUT_DOOR_OPEN_WARNING";
    GarageDoorPushEvent[GarageDoorPushEvent["TIMEOUT_CLOSED_DOOR"] = 6] = "TIMEOUT_CLOSED_DOOR";
    GarageDoorPushEvent[GarageDoorPushEvent["TIMEOUT_DOOR_OPEN_WARNING_MINUTES"] = 7] = "TIMEOUT_DOOR_OPEN_WARNING_MINUTES";
    GarageDoorPushEvent[GarageDoorPushEvent["LOW_BATTERY"] = 8] = "LOW_BATTERY";
})(GarageDoorPushEvent || (exports.GarageDoorPushEvent = GarageDoorPushEvent = {}));
var SmartSafeEvent;
(function (SmartSafeEvent) {
    SmartSafeEvent[SmartSafeEvent["ALARM_911"] = 1946161152] = "ALARM_911";
    SmartSafeEvent[SmartSafeEvent["LOCK_STATUS"] = 1946161153] = "LOCK_STATUS";
    SmartSafeEvent[SmartSafeEvent["SHAKE_ALARM"] = 1946161154] = "SHAKE_ALARM";
    SmartSafeEvent[SmartSafeEvent["BATTERY_STATUS"] = 1946161155] = "BATTERY_STATUS";
    SmartSafeEvent[SmartSafeEvent["LONG_TIME_NOT_CLOSE"] = 1946161156] = "LONG_TIME_NOT_CLOSE";
    SmartSafeEvent[SmartSafeEvent["FORCE_FIGURE"] = 1946161157] = "FORCE_FIGURE";
    SmartSafeEvent[SmartSafeEvent["LOW_POWER"] = 1946161158] = "LOW_POWER";
    SmartSafeEvent[SmartSafeEvent["INPUT_ERR_MAX"] = 1946161159] = "INPUT_ERR_MAX";
    SmartSafeEvent[SmartSafeEvent["SHUTDOWN"] = 1946161160] = "SHUTDOWN";
})(SmartSafeEvent || (exports.SmartSafeEvent = SmartSafeEvent = {}));
var HB3PairedDevicePushEvent;
(function (HB3PairedDevicePushEvent) {
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["MOTION_DETECTION"] = 3101] = "MOTION_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["FACE_DETECTION"] = 3102] = "FACE_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["CRYING_DETECTION"] = 3104] = "CRYING_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["SOUND_DETECTION"] = 3105] = "SOUND_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["PET_DETECTION"] = 3106] = "PET_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["VEHICLE_DETECTION"] = 3107] = "VEHICLE_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["DOG_DETECTION"] = 3108] = "DOG_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["DOG_LICK_DETECTION"] = 3109] = "DOG_LICK_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["DOG_POOP_DETECTION"] = 3110] = "DOG_POOP_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["IDENTITY_PERSON_DETECTION"] = 3111] = "IDENTITY_PERSON_DETECTION";
    HB3PairedDevicePushEvent[HB3PairedDevicePushEvent["STRANGER_PERSON_DETECTION"] = 3112] = "STRANGER_PERSON_DETECTION";
})(HB3PairedDevicePushEvent || (exports.HB3PairedDevicePushEvent = HB3PairedDevicePushEvent = {}));
var HB3PairedDeviceMessageType;
(function (HB3PairedDeviceMessageType) {
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["SECURITY_EVT"] = 1] = "SECURITY_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["TFCARD_EVT"] = 2] = "TFCARD_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["DOOR_SENSOR_EVT"] = 3] = "DOOR_SENSOR_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["CAM_STATE_EVT"] = 4] = "CAM_STATE_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["GSENSOR_EVT"] = 5] = "GSENSOR_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["BATTERY_LOW_EVT"] = 6] = "BATTERY_LOW_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["BATTERY_HOT_EVT"] = 7] = "BATTERY_HOT_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["LIGHT_STATE_EVT"] = 8] = "LIGHT_STATE_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["ARMING_EVT"] = 9] = "ARMING_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["ALARM_EVT"] = 10] = "ALARM_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["BATTERY_FULL_EVT"] = 11] = "BATTERY_FULL_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["REPEATER_RSSI_WEAK_EVT"] = 12] = "REPEATER_RSSI_WEAK_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["UPGRADE_STATUS"] = 13] = "UPGRADE_STATUS";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["MOTION_SENSOR_EVT"] = 14] = "MOTION_SENSOR_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["BAT_DOORBELL_EVT"] = 15] = "BAT_DOORBELL_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["ALARM_DELAY_EVT"] = 16] = "ALARM_DELAY_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["HUB_BATT_POWERED_EVT"] = 17] = "HUB_BATT_POWERED_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["INDOOR_EVT"] = 18] = "INDOOR_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["SMARTLOCK_EVT"] = 19] = "SMARTLOCK_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["LOCK_EVT"] = 20] = "LOCK_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["BBM_SOCK_EVT"] = 21] = "BBM_SOCK_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["DOOR_STATUS_EVT"] = 22] = "DOOR_STATUS_EVT";
    HB3PairedDeviceMessageType[HB3PairedDeviceMessageType["HHD_EVT"] = 23] = "HHD_EVT";
})(HB3PairedDeviceMessageType || (exports.HB3PairedDeviceMessageType = HB3PairedDeviceMessageType = {}));
var HB3HDDType;
(function (HB3HDDType) {
    HB3HDDType[HB3HDDType["NODISK"] = 0] = "NODISK";
    HB3HDDType[HB3HDDType["READY"] = 1] = "READY";
    HB3HDDType[HB3HDDType["PROCESSING"] = 2] = "PROCESSING";
    HB3HDDType[HB3HDDType["NO_PARTED"] = 3] = "NO_PARTED";
    HB3HDDType[HB3HDDType["NO_ANKER_DISK"] = 4] = "NO_ANKER_DISK";
    HB3HDDType[HB3HDDType["NOT_FORMAT"] = 5] = "NOT_FORMAT";
    HB3HDDType[HB3HDDType["OTHER_USER_DISK"] = 6] = "OTHER_USER_DISK";
    HB3HDDType[HB3HDDType["BAD"] = 7] = "BAD";
    HB3HDDType[HB3HDDType["WAIT_NETWOR"] = 8] = "WAIT_NETWOR";
    HB3HDDType[HB3HDDType["PARTED_DONE"] = 9] = "PARTED_DONE";
    HB3HDDType[HB3HDDType["FULL"] = 32] = "FULL";
})(HB3HDDType || (exports.HB3HDDType = HB3HDDType = {}));
var IndoorPushMessageType;
(function (IndoorPushMessageType) {
    IndoorPushMessageType[IndoorPushMessageType["INDOOR"] = 18] = "INDOOR";
    IndoorPushMessageType[IndoorPushMessageType["TFCARD"] = 2] = "TFCARD";
})(IndoorPushMessageType || (exports.IndoorPushMessageType = IndoorPushMessageType = {}));
var NotificationStyle;
(function (NotificationStyle) {
    NotificationStyle[NotificationStyle["TEXT"] = 1] = "TEXT";
    NotificationStyle[NotificationStyle["THUMB"] = 2] = "THUMB";
    NotificationStyle[NotificationStyle["ALL"] = 3] = "ALL";
})(NotificationStyle || (exports.NotificationStyle = NotificationStyle = {}));
//# sourceMappingURL=types.js.map