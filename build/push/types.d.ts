export declare enum CusPushEvent {
    SECURITY = 1,
    TFCARD = 2,
    DOOR_SENSOR = 3,
    CAM_STATE = 4,
    GSENSOR = 5,
    BATTERY_LOW = 6,
    BATTERY_HOT = 7,
    LIGHT_STATE = 8,
    MODE_SWITCH = 9,
    ALARM = 10,
    BATTERY_FULL = 11,
    REPEATER_RSSI_WEAK = 12,
    UPGRADE_STATUS = 13,
    MOTION_SENSOR_PIR = 14,
    ALARM_DELAY = 16,
    HUB_BATT_POWERED = 17,
    SENSOR_NO_OPEN = 18
}
export declare enum CusPushAlarmType {
    HUB_STOP = 0,
    DEV_STOP = 1,
    GSENSOR = 2,
    PIR = 3,
    APP = 4,
    HOT = 5,
    DOOR = 6,
    CAMERA = 7,
    MOTION_SENSOR = 8,
    CAMERA_GSENSOR = 9,
    CAMERA_APP = 10,
    CAMERA_LINKAGE = 11,
    HUB_LINKAGE = 12,
    HUB_KEYPAD_PANIC_BUTTON = 13,
    HUB_KEYPAD_EMERGENCY_CODE = 14,
    HUB_STOP_BY_KEYPAD = 15,
    HUB_STOP_BY_APP = 16,
    HUB_STOP_BY_HUB = 17,
    HUB_KEYPAD_CUSTOM_NOT_MAP = 18
}
export declare enum CusPushMode {
    SWITCH_FROM_KEYPAD = 1,
    SWITCH_FROM_APP = 2,
    SWITCH = 9
}
export declare enum ServerPushEvent {
    INVITE_DEVICE = 10300,
    REMOVE_DEVICE = 10200,
    REMOVE_HOMEBASE = 10100,
    VERIFICATION = 10500,
    WEB_ACTION = 10800,
    ALARM_NOTIFY = 10900,
    ALARM_GUEST_NOTIFY = 11000,
    HOUSE_ADDED = 11400,
    HOUSE_INVITE = 11300,
    HOUSE_REMOVE = 11200
}
export declare enum DoorbellPushEvent {
    BACKGROUND_ACTIVE = 3100,
    MOTION_DETECTION = 3101,
    FACE_DETECTION = 3102,
    PRESS_DOORBELL = 3103,
    PET_DETECTION = 3106,
    VEHICLE_DETECTION = 3107,
    PACKAGE_DELIVERED = 3301,
    PACKAGE_TAKEN = 3302,
    FAMILY_DETECTION = 3303,
    PACKAGE_STRANDED = 3304,
    SOMEONE_LOITERING = 3305,
    RADAR_MOTION_DETECTION = 3306,
    AWAY_FROM_HOME = 3307,
    RADAR_DETECTION = 3308
}
export declare enum LockPushEvent {
    MANUAL_UNLOCK = 257,
    AUTO_UNLOCK = 258,
    PW_UNLOCK = 259,
    FINGERPRINT_UNLOCK = 260,
    APP_UNLOCK = 261,
    MANUAL_LOCK = 262,
    KEYPAD_LOCK = 263,
    APP_LOCK = 264,
    AUTO_LOCK = 265,
    PW_LOCK = 266,
    FINGER_LOCK = 267,
    TEMPORARY_PW_LOCK = 268,
    TEMPORARY_PW_UNLOCK = 269,
    LOW_POWER = 513,
    VERY_LOW_POWER = 514,
    MULTIPLE_ERRORS = 515,
    LOCK_OFFLINE = 516,
    MECHANICAL_ANOMALY = 517,
    VIOLENT_DESTRUCTION = 518,
    LOCK_MECHANICAL_ANOMALY = 519,
    DOOR_OPEN_LEFT = 520,
    DOOR_TAMPER = 521,
    DOOR_STATE_ERROR = 522,
    STATUS_CHANGE = 769,
    OTA_STATUS = 770,
    LOCK_ONLINE = 771
}
export declare enum IndoorPushEvent {
    MOTION_DETECTION = 3101,
    FACE_DETECTION = 3102,
    CRYING_DETECTION = 3104,
    SOUND_DETECTION = 3105,
    PET_DETECTION = 3106,
    VEHICLE_DETECTION = 3107
}
export declare enum GarageDoorPushEvent {
    CLOSED_DOOR_BY_APP = 1,
    OPEN_DOOR_BY_APP = 2,
    CLOSED_DOOR_WITHOUT_APP = 3,
    OPEN_DOOR_WITHOUT_APP = 4,
    TIMEOUT_DOOR_OPEN_WARNING = 5,
    TIMEOUT_CLOSED_DOOR = 6,
    TIMEOUT_DOOR_OPEN_WARNING_MINUTES = 7,
    LOW_BATTERY = 8
}
export declare enum SmartSafeEvent {
    ALARM_911 = 1946161152,
    LOCK_STATUS = 1946161153,
    SHAKE_ALARM = 1946161154,
    BATTERY_STATUS = 1946161155,
    LONG_TIME_NOT_CLOSE = 1946161156,
    FORCE_FIGURE = 1946161157,
    LOW_POWER = 1946161158,
    INPUT_ERR_MAX = 1946161159,
    SHUTDOWN = 1946161160
}
export declare enum HB3PairedDevicePushEvent {
    MOTION_DETECTION = 3101,
    FACE_DETECTION = 3102,
    CRYING_DETECTION = 3104,
    SOUND_DETECTION = 3105,
    PET_DETECTION = 3106,
    VEHICLE_DETECTION = 3107,
    DOG_DETECTION = 3108,
    DOG_LICK_DETECTION = 3109,
    DOG_POOP_DETECTION = 3110,
    IDENTITY_PERSON_DETECTION = 3111,
    STRANGER_PERSON_DETECTION = 3112
}
export declare enum HB3PairedDeviceMessageType {
    SECURITY_EVT = 1,
    TFCARD_EVT = 2,
    DOOR_SENSOR_EVT = 3,
    CAM_STATE_EVT = 4,
    GSENSOR_EVT = 5,
    BATTERY_LOW_EVT = 6,
    BATTERY_HOT_EVT = 7,
    LIGHT_STATE_EVT = 8,
    ARMING_EVT = 9,
    ALARM_EVT = 10,
    BATTERY_FULL_EVT = 11,
    REPEATER_RSSI_WEAK_EVT = 12,
    UPGRADE_STATUS = 13,
    MOTION_SENSOR_EVT = 14,
    BAT_DOORBELL_EVT = 15,
    ALARM_DELAY_EVT = 16,
    HUB_BATT_POWERED_EVT = 17,
    INDOOR_EVT = 18,
    SMARTLOCK_EVT = 19,
    LOCK_EVT = 20,
    BBM_SOCK_EVT = 21,
    DOOR_STATUS_EVT = 22,
    HHD_EVT = 23
}
export declare enum HB3HDDType {
    NODISK = 0,
    READY = 1,
    PROCESSING = 2,
    NO_PARTED = 3,
    NO_ANKER_DISK = 4,
    NOT_FORMAT = 5,
    OTHER_USER_DISK = 6,
    BAD = 7,
    WAIT_NETWOR = 8,
    PARTED_DONE = 9,
    FULL = 32
}
export declare enum IndoorPushMessageType {
    INDOOR = 18,
    TFCARD = 2
}
export declare enum NotificationStyle {
    TEXT = 1,
    THUMB = 2,
    ALL = 3
}
export declare enum AlarmAction {
    CANCEL_APP = 0,
    CANCEL_NOLIGHT = 1
}
