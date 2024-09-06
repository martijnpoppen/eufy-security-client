import { LockV12P2PCommandType, SmartLockP2PCommandType } from "./models";
export declare const RequestMessageType: {
    STUN: Buffer;
    LOOKUP: Buffer;
    LOOKUP_WITH_KEY: Buffer;
    LOOKUP_WITH_KEY2: Buffer;
    TURN_LOOKUP_WITH_KEY: Buffer;
    TURN_SERVER_INIT: Buffer;
    TURN_CLIENT_OK: Buffer;
    CHECK_CAM2: Buffer;
    LOCAL_LOOKUP: Buffer;
    PING: Buffer;
    PONG: Buffer;
    CHECK_CAM: Buffer;
    DATA: Buffer;
    ACK: Buffer;
    END: Buffer;
};
export declare const ResponseMessageType: {
    STUN: Buffer;
    LOOKUP_RESP: Buffer;
    LOOKUP_ADDR: Buffer;
    LOCAL_LOOKUP_RESP: Buffer;
    TURN_SERVER_LIST: Buffer;
    TURN_SERVER_OK: Buffer;
    TURN_SERVER_TOKEN: Buffer;
    TURN_SERVER_LOOKUP_OK: Buffer;
    LOOKUP_ADDR2: Buffer;
    UNKNOWN_83: Buffer;
    TURN_SERVER_CAM_ID: Buffer;
    END: Buffer;
    PONG: Buffer;
    PING: Buffer;
    CAM_ID: Buffer;
    ACK: Buffer;
    DATA: Buffer;
};
export declare enum P2PDataType {
    UNKNOWN = -1,
    DATA = 0,
    VIDEO = 1,
    CONTROL = 2,
    BINARY = 3
}
export declare const P2PDataTypeHeader: {
    DATA: Buffer;
    VIDEO: Buffer;
    CONTROL: Buffer;
    BINARY: Buffer;
};
export declare enum CommandType {
    ARM_DELAY_AWAY = 1158,
    ARM_DELAY_CUS1 = 1159,
    ARM_DELAY_CUS2 = 1160,
    ARM_DELAY_CUS3 = 1161,
    ARM_DELAY_HOME = 1157,
    ARM_DELAY_OFF = 1180,
    AUTOMATION_DATA = 1278,
    AUTOMATION_ID_LIST = 1165,
    CMD_ALARM_DELAY_AWAY = 1167,
    CMD_ALARM_DELAY_CUSTOM1 = 1168,
    CMD_ALARM_DELAY_CUSTOM2 = 1169,
    CMD_ALARM_DELAY_CUSTOM3 = 1170,
    CMD_ALARM_DELAY_HOME = 1166,
    CMD_AUDDEC_SWITCH = 1017,
    CMD_AUDIO_FRAME = 1301,
    CMD_BATCH_RECORD = 1049,
    CMD_BAT_DOORBELL_CHIME_SWITCH = 1702,
    CMD_BAT_DOORBELL_DINGDONG_R = 1718,
    CMD_BAT_DOORBELL_DINGDONG_V = 1717,
    CMD_BAT_DOORBELL_MECHANICAL_CHIME_SWITCH = 1703,
    CMD_BAT_DOORBELL_ONLY_AI = 1719,
    CMD_BAT_DOORBELL_QUICK_RESPONSE = 1706,
    CMD_BAT_DOORBELL_SET_AC_VALUE = 1714,
    CMD_BAT_DOORBELL_SET_ELECTRONIC_RINGTONE_TIME = 1709,
    CMD_BAT_DOORBELL_SET_LED_ENABLE = 1716,
    CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE = 1710,
    CMD_BAT_DOORBELL_SET_RINGTONE_VOLUME = 1708,
    CMD_BAT_DOORBELL_UPDATE_QUICK_RESPONSE = 1707,
    CMD_BAT_DOORBELL_VIDEO_QUALITY = 1705,
    CMD_BAT_DOORBELL_VIDEO_QUALITY2 = 2730,
    CMD_BAT_DOORBELL_RECORD_QUALITY2 = 2731,
    CMD_BAT_DOORBELL_WDR_SWITCH = 1704,
    CMD_BIND_BROADCAST = 1000,
    CMD_BIND_SYNC_ACCOUNT_INFO = 1001,
    CMD_BIND_SYNC_ACCOUNT_INFO_EX = 1054,
    CMD_CAMERA_INFO = 1103,
    CMD_CHANGE_PWD = 1030,
    CMD_CHANGE_WIFI_PWD = 1031,
    CMD_CLOSE_AUDDEC = 1018,
    CMD_CLOSE_DEV_LED = 1046,
    CMD_CLOSE_EAS = 1016,
    CMD_CLOSE_IRCUT = 1014,
    CMD_CLOSE_PIR = 1012,
    CMD_COLLECT_RECORD = 1047,
    CMD_CONVERT_MP4_OK = 1303,
    CMD_DECOLLECT_RECORD = 1048,
    CMD_DELLETE_RECORD = 1027,
    CMD_DEL_FACE_PHOTO = 1234,
    CMD_DEL_USER_PHOTO = 1232,
    CMD_DEVS_BIND_BROADCASE = 1038,
    CMD_DEVS_BIND_NOTIFY = 1039,
    CMD_DEVS_LOCK = 1019,
    CMD_DEVS_SWITCH = 1035,
    CMD_DEVS_TO_FACTORY = 1037,
    CMD_DEVS_UNBIND = 1040,
    CMD_DEVS_UNLOCK = 1020,
    CMD_DEV_LED_SWITCH = 1045,
    CMD_DEV_PUSHMSG_MODE = 1252,
    CMD_DEV_RECORD_AUTOSTOP = 1251,
    CMD_DEV_RECORD_INTERVAL = 1250,
    CMD_DEV_RECORD_TIMEOUT = 1249,
    CMD_DOWNLOAD_FINISH = 1304,
    CMD_DOORBELL_NOTIFY_PAYLOAD = 1701,
    CMD_DOORBELL_SET_PAYLOAD = 1700,
    CMD_DOORLOCK_ACCOUNT_UNBIND = 1915,
    CMD_DOORLOCK_BIND = 1910,
    CMD_DOORLOCK_DATA_PASS_THROUGH = 1911,
    CMD_DOORLOCK_DATA_PASS_THROUGH_ERR = 1918,
    CMD_DOORLOCK_GET_STATE = 1912,
    CMD_DOORLOCK_ONLINE_REPORT = 1917,
    CMD_DOORLOCK_OTA = 1914,
    CMD_DOORLOCK_P2P_SEQ = 1916,
    CMD_DOORLOCK_SET_PUSH_MODE = 1919,
    CMD_DOOR_SENSOR_ALARM_ENABLE = 1506,
    CMD_DOOR_SENSOR_DOOR_EVT = 1503,
    CMD_DOOR_SENSOR_ENABLE_LED = 1505,
    CMD_DOOR_SENSOR_GET_DOOR_STATE = 1502,
    CMD_DOOR_SENSOR_GET_INFO = 1501,
    CMD_DOOR_SENSOR_INFO_REPORT = 1500,
    CMD_DOOR_SENSOR_LOW_POWER_REPORT = 1504,
    CMD_DOWNLOAD_CANCEL = 1051,
    CMD_DOWNLOAD_VIDEO = 1024,
    CMD_EAS_SWITCH = 1015,
    CMD_ENTRY_SENSOR_BAT_STATE = 1552,
    CMD_ENTRY_SENSOR_CHANGE_TIME = 1551,
    CMD_ENTRY_SENSOR_STATUS = 1550,
    CMD_FLOODLIGHT_BROADCAST = 902,
    CMD_FORMAT_SD = 1029,
    CMD_FORMAT_SD_PROGRESS = 1053,
    CMD_GATEWAYINFO = 1100,
    CMD_GEO_ADD_USER_INFO = 1259,
    CMD_GEO_DEL_USER_INFO = 1261,
    CMD_GEO_SET_USER_STATUS = 1258,
    CMD_GEO_UPDATE_LOC_SETTING = 1262,
    CMD_GEO_UPDATE_USER_INFO = 1260,
    CMD_GET_ADMIN_PWD = 1122,
    CMD_GET_ALARM_MODE = 1151,
    CMD_GET_ARMING_INFO = 1107,
    CMD_GET_ARMING_STATUS = 1108,
    CMD_GET_AUDDEC_INFO = 1109,
    CMD_GET_AUDDEC_SENSITIVITY = 1110,
    CMD_GET_AUDDE_CSTATUS = 1111,
    CMD_GET_AWAY_ACTION = 1239,
    CMD_GET_BATTERY = 1101,
    CMD_GET_BATTERY_TEMP = 1138,
    CMD_GET_CAMERA_LOCK = 1119,
    CMD_GET_CHARGE_STATUS = 1136,
    CMD_GET_CUSTOM1_ACTION = 1148,
    CMD_GET_CUSTOM2_ACTION = 1149,
    CMD_GET_CUSTOM3_ACTION = 1150,
    CMD_GET_DELAY_ALARM = 1164,
    CMD_GET_DEVICE_PING = 1152,
    CMD_GET_DEVS_NAME = 1129,
    CMD_GET_DEVS_RSSI_LIST = 1274,
    CMD_GET_DEV_CLOUD_STATUS = 1182,
    CMD_GET_DEV_HK_RECORD_STATUS = 1181,
    CMD_GET_DEV_STATUS = 1131,
    CMD_GET_DEV_TONE_INFO = 1127,
    CMD_GET_DEV_UPGRADE = 1134,
    CMD_GET_EAS_STATUS = 1118,
    CMD_GET_EXCEPTION_LOG = 1124,
    CMD_GET_FLOODLIGHT_WIFI_LIST = 1405,
    CMD_GET_GATEWAY_LOCK = 1120,
    CMD_GET_HOME_ACTION = 1225,
    CMD_GET_HUB_LAN_IP = 1176,
    CMD_GET_HUB_LOG = 1132,
    CMD_GET_HUB_LOGIG = 1140,
    CMD_GET_HUB_NAME = 1128,
    CMD_GET_HUB_POWER_SUPPLY = 1137,
    CMD_GET_HUB_TONE_INFO = 1126,
    CMD_GET_HUB_UPGRADE = 1133,
    CMD_GET_IRCUTSENSITIVITY = 1114,
    CMD_GET_IRMODE = 1113,
    CMD_GET_MDETECT_PARAM = 1105,
    CMD_GET_MIRRORMODE = 1112,
    CMD_GET_NEWVESION = 1125,
    CMD_GET_OFF_ACTION = 1177,
    CMD_GET_P2P_CONN_STATUS = 1130,
    CMD_GET_PIRCTRL = 1116,
    CMD_GET_PIRINFO = 1115,
    CMD_GET_PIRSENSITIVITY = 1117,
    CMD_GET_RECORD_TIME = 1104,
    CMD_GET_REPEATER_CONN_TEST_RESULT = 1270,
    CMD_GET_REPEATER_RSSI = 1266,
    CMD_GET_REPEATER_SITE_LIST = 1263,
    CMD_GET_SOLAR_SHOW = 1294,
    CMD_GET_START_HOMEKIT = 1163,
    CMD_GET_SUB1G_RSSI = 1141,
    CMD_GET_TFCARD_FORMAT_STATUS = 1143,
    CMD_GET_TFCARD_REPAIR_STATUS = 1153,
    CMD_GET_TFCARD_STATUS = 1135,
    CMD_GET_UPDATE_STATUS = 1121,
    CMD_GET_UPGRADE_RESULT = 1043,
    CMD_GET_WAN_LINK_STATUS = 1268,
    CMD_GET_WAN_MODE = 1265,
    CMD_GET_WIFI_PWD = 1123,
    CMD_GET_WIFI_RSSI = 1142,
    CMD_HUB_ALARM_TONE = 1281,
    CMD_HUB_CLEAR_EMMC_VOLUME = 1800,
    CMD_HUB_NOTIFY_ALARM = 1282,
    CMD_HUB_NOTIFY_MODE = 1283,
    CMD_HUB_REBOOT = 1034,
    CMD_HUB_TO_FACTORY = 1036,
    CMD_IRCUT_SWITCH = 1013,
    CMD_KEYPAD_BATTERY_CAP_STATE = 1653,
    CMD_KEYPAD_BATTERY_CHARGER_STATE = 1655,
    CMD_KEYPAD_BATTERY_TEMP_STATE = 1654,
    CMD_KEYPAD_GET_PASSWORD = 1657,
    CMD_KEYPAD_GET_PASSWORD_LIST = 1662,
    CMD_KEYPAD_IS_PSW_SET = 1670,
    CMD_KEYPAD_PSW_OPEN = 1664,
    CMD_KEYPAD_SET_CUSTOM_MAP = 1660,
    CMD_KEYPAD_SET_PASSWORD = 1650,
    CMD_LEAVING_DELAY_AWAY = 1172,
    CMD_LEAVING_DELAY_CUSTOM1 = 1173,
    CMD_LEAVING_DELAY_CUSTOM2 = 1174,
    CMD_LEAVING_DELAY_CUSTOM3 = 1175,
    CMD_LEAVING_DELAY_HOME = 1171,
    CMD_LIVEVIEW_LED_SWITCH = 1056,
    CMD_MDETECTINFO = 1106,
    CMD_MOTION_SENSOR_BAT_STATE = 1601,
    CMD_MOTION_SENSOR_ENABLE_LED = 1607,
    CMD_MOTION_SENSOR_ENTER_USER_TEST_MODE = 1613,
    CMD_MOTION_SENSOR_EXIT_USER_TEST_MODE = 1610,
    CMD_MOTION_SENSOR_PIR_EVT = 1605,
    CMD_MOTION_SENSOR_SET_CHIRP_TONE = 1611,
    CMD_MOTION_SENSOR_SET_PIR_SENSITIVITY = 1609,
    CMD_MOTION_SENSOR_WORK_MODE = 1612,
    CMD_NAS_SWITCH = 1145,
    CMD_NAS_TEST = 1146,
    CMD_NOTIFY_PAYLOAD = 1351,
    CMD_P2P_DISCONNECT = 1044,
    CMD_PING = 1139,
    CMD_PIR_SWITCH = 1011,
    CMD_RECORDDATE_SEARCH = 1041,
    CMD_RECORDLIST_SEARCH = 1042,
    CMD_RECORD_AUDIO_SWITCH = 1366,
    CMD_RECORD_IMG = 1021,
    CMD_RECORD_IMG_STOP = 1022,
    CMD_RECORD_PLAY_CTRL = 1026,
    CMD_RECORD_VIEW = 1025,
    CMD_REPAIR_PROGRESS = 1058,
    CMD_REPAIR_SD = 1057,
    CMD_REPEATER_RSSI_TEST = 1269,
    CMD_RF433_DONGLE_STATUS_CHANGE = 1900,
    CMD_RF433_GET_DONGLE_STATE = 1901,
    CMD_RF433_TRIGER_RING = 1902,
    CMD_SDINFO = 1102,
    CMD_SDINFO_EX = 1144,
    CMD_SENSOR_SET_CHIRP_TONE = 1507,
    CMD_SENSOR_SET_CHIRP_VOLUME = 1508,
    CMD_SET_AI_NICKNAME = 1242,
    CMD_SET_AI_PHOTO = 1231,
    CMD_SET_AI_SWITCH = 1236,
    CMD_SET_ALL_ACTION = 1255,
    CMD_SET_ARMING = 1224,
    CMD_SET_ARMING_SCHEDULE = 1211,
    CMD_SET_AS_SERVER = 1237,
    CMD_SET_AUDDEC_INFO = 1212,
    CMD_SET_AUDDEC_SENSITIVITY = 1213,
    CMD_SET_AUDIOSENSITIVITY = 1227,
    CMD_SET_AUDIO_MUTE_RECORD = 1288,
    CMD_SET_AUDIO_MOTION_ACTIVATED_PROMPT = 2123,
    CMD_SET_AUTO_DELETE_RECORD = 1367,
    CMD_SET_BITRATE = 1206,
    CMD_SET_CUSTOM_MODE = 1256,
    CMD_SET_DEVS_NAME = 1217,
    CMD_SET_DEVS_OSD = 1214,
    CMD_SET_DEVS_TONE_FILE = 1202,
    CMD_SET_DEV_MD_RECORD = 1273,
    CMD_SET_DEV_MIC_MUTE = 1240,
    CMD_SET_DEV_MIC_VOLUME = 1229,
    CMD_SET_DEV_SPEAKER_MUTE = 1241,
    CMD_SET_DEV_SPEAKER_VOLUME = 1230,
    CMD_SET_DEV_STORAGE_TYPE = 1228,
    CMD_SET_DOORSENSOR_ALWAYS_OPEN = 1290,
    CMD_SET_DOORSENSOR_ALWAYS_OPEN_DELAY = 1291,
    CMD_SET_FLOODLIGHT_BRIGHT_VALUE = 1401,
    CMD_SET_FLOODLIGHT_DETECTION_AREA = 1407,
    CMD_SET_FLOODLIGHT_LIGHT_SCHEDULE = 1404,
    CMD_SET_FLOODLIGHT_MANUAL_SWITCH = 1400,
    CMD_SET_FLOODLIGHT_STREET_LAMP = 1402,
    CMD_SET_FLOODLIGHT_TOTAL_SWITCH = 1403,
    CMD_SET_FLOODLIGHT_WIFI_CONNECT = 1406,
    CMD_SET_GSSENSITIVITY = 1226,
    CMD_SET_HUB_ALARM_AUTO_END = 1280,
    CMD_SET_HUB_ALARM_CLOSE = 1279,
    CMD_SET_HUB_AUDEC_STATUS = 1222,
    CMD_SET_HUB_GS_STATUS = 1220,
    CMD_SET_HUB_IRCUT_STATUS = 1219,
    CMD_SET_HUB_MVDEC_STATUS = 1221,
    CMD_SET_HUB_NAME = 1216,
    CMD_SET_HUB_OSD = 1253,
    CMD_SET_HUB_PIR_STATUS = 1218,
    CMD_SET_HUB_SPK_VOLUME = 1235,
    CMD_SET_IRMODE = 1208,
    CMD_SET_JSON_SCHEDULE = 1254,
    CMD_SET_LANGUAGE = 1200,
    CMD_SET_LIGHT_CTRL_BRIGHT_PIR = 1412,
    CMD_SET_LIGHT_CTRL_BRIGHT_PIR_T8425 = 1422,
    CMD_SET_LIGHT_CTRL_BRIGHT_SCH = 1413,
    CMD_SET_LIGHT_CTRL_BRIGHT_SCH_T8425 = 1421,
    CMD_SET_LIGHT_CTRL_LAMP_VALUE = 1410,
    CMD_SET_LIGHT_CTRL_PIR_SWITCH = 1408,
    CMD_SET_LIGHT_CTRL_PIR_TIME = 1409,
    CMD_SET_LIGHT_CTRL_SUNRISE_INFO = 1415,
    CMD_SET_LIGHT_CTRL_SUNRISE_SWITCH = 1414,
    CMD_SET_LIGHT_CTRL_TRIGGER = 1411,
    CMD_SET_MDETECTPARAM = 1204,
    CMD_SET_MDSENSITIVITY = 1272,
    CMD_SET_MIRRORMODE = 1207,
    CMD_SET_MOTION_SENSITIVITY = 1276,
    CMD_SET_NAS_PASSWD = 1287,
    CMD_SET_NIGHT_VISION_TYPE = 1277,
    CMD_SET_NOTFACE_PUSHMSG = 1248,
    CMD_SET_PAYLOAD = 1350,
    CMD_SET_PIRSENSITIVITY = 1210,
    CMD_SET_PIR_INFO = 1209,
    CMD_SET_PIR_POWERMODE = 1246,
    CMD_SET_PIR_TEST_MODE = 1243,
    CMD_SET_POWER_CHARGE = 1293,
    CMD_SET_PRIVACYPARAM = 1295,
    CMD_SET_PRI_ACTION = 1233,
    CMD_SET_PROMPT_VOLUME = 1292,
    CMD_SET_PUSH_EFFECT = 1289,
    CMD_SET_RECORDTIME = 1203,
    CMD_SET_RECORD_QUALITY = 1286,
    CMD_SET_REPEATER_PARAMS = 1264,
    CMD_SET_RESOLUTION = 1205,
    CMD_SET_SCHEDULE_DEFAULT = 1257,
    CMD_SET_SNOOZE_MODE = 1271,
    CMD_SET_STORGE_TYPE = 1223,
    CMD_SET_TELNET = 1247,
    CMD_SET_TIMEZONE = 1215,
    CMD_SET_TONE_FILE = 1201,
    CMD_SET_UPGRADE = 1238,
    CMD_SNAPSHOT = 1028,
    CMD_START_REALTIME_MEDIA = 1003,
    CMD_START_RECORD = 1009,
    CMD_START_REC_BROADCASE = 900,
    CMD_START_TALKBACK = 1005,
    CMD_START_VOICECALL = 1007,
    CMD_STOP_REALTIME_MEDIA = 1004,
    CMD_STOP_RECORD = 1010,
    CMD_STOP_REC_BROADCASE = 901,
    CMD_STOP_SHARE = 1023,
    CMD_STOP_TALKBACK = 1006,
    CMD_STOP_VOICECALL = 1008,
    CMD_STREAM_MSG = 1302,
    CMD_STRESS_TEST_OPER = 1050,
    CMD_TIME_SYCN = 1033,
    CMD_UNBIND_ACCOUNT = 1002,
    CMD_VIDEO_FRAME = 1300,
    CMD_WIFI_CONFIG = 1032,
    SWITCH_TIME = 1162,
    CMD_BATTERY_FALSE_EVENT_COUNT = 6056,
    CMD_FLOODLIGHT_GET_WIFI_RSSI_INFO = 6080,
    CMD_INDOOR_AI_CRYING_ENABLE = 6024,
    CMD_INDOOR_AI_MOTION_ENABLE = 6023,
    CMD_INDOOR_AI_PERSON_ENABLE = 6022,
    CMD_INDOOR_AI_PET_ENABLE = 6026,
    CMD_INDOOR_AI_SOUND_ENABLE = 6025,
    CMD_INDOOR_SET_MOTION_DETECTION_TYPE = 6027,
    CMD_INDOOR_CONTINUE_RECORD_SCHEDULE = 6013,
    CMD_INDOOR_DET_SET_ACTIVE_ZONE = 6042,
    CMD_INDOOR_DET_SET_MOTION_DETECT_ENABLE = 6040,
    CMD_INDOOR_DET_SET_MOTION_DETECT_TYPE = 6045,
    CMD_INDOOR_DET_SET_MOTION_SENSITIVITY_IDX = 6041,
    CMD_INDOOR_DET_SET_PET_ENABLE = 6047,
    CMD_INDOOR_DET_SET_PET_EXPEL_RESPONSOR = 6048,
    CMD_INDOOR_DET_SET_PET_EXPEL_RESP_IDX = 6049,
    CMD_INDOOR_DET_SET_SOUND_DETECT_ENABLE = 6043,
    CMD_INDOOR_DET_SET_SOUND_DETECT_TYPE = 6046,
    CMD_INDOOR_DET_SET_SOUND_SENSITIVITY_IDX = 6044,
    CMD_INDOOR_EVENT_COUNT = 6053,
    CMD_INDOOR_HK_ACTIVE_HOMEKIT = 6061,
    CMD_INDOOR_HK_GET_HK_BIND_STATUS = 6062,
    CMD_INDOOR_LED_SWITCH = 6014,
    CMD_INDOOR_NAS_STORAGE_TYPE = 6050,
    CMD_INDOOR_OWNER_STREAM_TYPE = 6052,
    CMD_INDOOR_PAN_CALIBRATION = 6017,
    CMD_OUTDOOR_PAN_CALIBRATION = 6251,
    CMD_INDOOR_PAN_MOTION_TRACK = 6016,
    CMD_INDOOR_PAN_SPEED = 6015,
    CMD_INDOOR_PUSH_JUMP_TYPE = 6021,
    CMD_INDOOR_PUSH_NOTIFY_TYPE = 6020,
    CMD_INDOOR_SET_CONTINUE_ENABLE = 6010,
    CMD_INDOOR_SET_CONTINUE_TYPE = 6011,
    CMD_INDOOR_SET_RECORD_AUDIO_ENABLE = 6012,
    CMD_INDOOR_SHOW_SDCARD = 6054,
    CMD_INDOOR_TFCARD_NAS_STATUS = 6051,
    CMD_INDOOR_ROTATE = 6030,
    CMD_OUTDOOR_ROTATE = 6038,
    CMD_INDOOR_ENABLE_PRIVACY_MODE = 6090,
    CMD_INDOOR_SET_PRIVACY_ANGLE = 6091,
    CMD_INDOOR_DEFAULT_ANGLE_SET = 6092,
    CMD_INDOOR_DEFAULT_ANGLE_ENABLE = 6093,
    CMD_INDOOR_DEFAULT_ANGLE_IDLE_TIME = 6094,
    CMD_INDOOR_SET_SOUND_DETECT_ROUND_LOOK = 6095,
    CMD_T8200X_SET_RINGTONE_VOLUME = 6096,
    CMD_IN_TEST_MODE = 6072,
    CMD_PLAY_BACK_EVENT_STOP = 1055,
    CMD_SET_DETECT_TYPE = 6071,
    CMD_SET_PIR_SENSITIVITY = 6070,
    CMD_SMARTLOCK_QUERY_BATTERY_LEVEL = 6001,
    CMD_SMARTLOCK_QUERY_STATUS = 6000,
    P2P_ADD_PW = 1950,
    P2P_CALIBRATE_LOCK = 1960,
    P2P_DELETE_FINGER = 1953,
    P2P_DELETE_USER = 1951,
    P2P_ENTER_OTA = 1238,
    P2P_GET_FINGER_PW_USAGE = 1963,
    P2P_GET_LOCK_PARAM = 1959,
    P2P_GET_USER_AND_PW_ID = 1964,
    P2P_ON_OFF_LOCK = 1961,
    P2P_PULL_BLE = 1962,
    P2P_QUERY_PW = 1954,
    P2P_QUERY_STATUS_IN_LOCK = 1955,
    P2P_RESET = 1040,
    P2P_SET_LOCK_PARAM = 1958,
    P2P_UPDATE_PW = 1957,
    P2P_UPDATE_USER_TIME = 1956,
    SUB1G_REP_BIND_FAILED = 2109,
    SUB1G_REP_CHARGE_STATE = 2108,
    SUB1G_REP_POWER_OFF = 2110,
    SUB1G_REP_RUNTIME_STATE = 2107,
    SUB1G_REP_UNPLUG_POWER_LINE = 2111,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE_T8425 = 6073,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE = 6086,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE_STD_SENSITIVITY = 6087,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE_ADV_LEFT_SENSITIVITY = 6081,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE_ADV_MIDDLE_SENSITIVITY = 6083,
    CMD_FLOODLIGHT_SET_DETECTION_RANGE_ADV_RIGHT_SENSITIVITY = 6085,
    CMD_FLOODLIGHT_SET_MOTION_TRACKING_SENSITIVITY = 6107,
    CMD_FLOODLIGHT_SAVE_MOTION_PRESET_POSITION = 6032,
    CMD_FLOODLIGHT_DELETE_MOTION_PRESET_POSITION = 6033,
    CMD_FLOODLIGHT_SET_MOTION_PRESET_POSITION = 6035,
    CMD_FLOODLIGHT_SET_MOTION_AUTO_CRUISE = 6031,
    CMD_FLOODLIGHT_SET_MOTION_OUT_OF_VIEW_DETECTION = 6098,
    CMD_FLOODLIGHT_SET_LIGHT_COLOR_TEMP_MANUAL = 6100,
    CMD_FLOODLIGHT_SET_LIGHT_COLOR_TEMP_MOTION = 6101,
    CMD_FLOODLIGHT_SET_LIGHT_COLOR_TEMP_SCHEDULE = 6102,
    CMD_FLOODLIGHT_SET_VIDEO_NIGHTVISION_IMAGE_ADJUSTMENT = 6105,
    CMD_FLOODLIGHT_SET_VIDEO_COLOR_NIGHTVISION = 6106,
    CMD_FLOODLIGHT_SET_AUTO_CALIBRATION = 6099,
    CMD_SMARTLOCK_AUTO_LOCK = 6500,
    CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE = 6501,
    CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE_STARTTIME = 6601,
    CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE_ENDTIME = 6602,
    CMD_SMARTLOCK_LOCK_SOUND = 6505,
    CMD_SMARTLOCK_LOG = 6700,
    CMD_SMARTLOCK_NOTIFICATION = 6506,
    CMD_SMARTLOCK_NOTIFICATION_LOCKED = 6606,
    CMD_SMARTLOCK_NOTIFICATION_UNLOCKED = 6605,
    CMD_SMARTLOCK_ONE_TOUCH_LOCK = 6502,
    CMD_SMARTLOCK_SCRAMBLE_PASSCODE = 6504,
    CMD_SMARTLOCK_WIFI_STATUS = 6507,
    CMD_SMARTLOCK_WRONG_TRY_PROTECT = 6503,
    CMD_SMARTLOCK_AUTO_LOCK_TIMER = 6600,
    CMD_SMARTLOCK_WRONG_TRY_LOCKDOWN = 6604,
    CMD_SMARTLOCK_WRONG_TRY_ATTEMPTS = 6603,
    CMD_SMARTLOCK_NIGHT_VISION_ENHANCE = 6614,
    CMD_SMARTLOCK_NIGHT_VISION_SIDE = 6615,
    CMD_SMARTLOCK_LEFT_OPEN_ALARM = 6616,
    CMD_SMARTLOCK_TAMPER_ALARM = 6617,
    CMD_SMARTLOCK_VOLUME = 6618,
    CMD_DOORBELL_DUAL_VIEW_MODE = 2700,
    CMD_DOORBELL_DUAL_VIEW_MODE2 = 6243,
    CMD_DOORBELL_DUAL_RADAR_WD_DETECTION_SENSITIVITY = 2705,
    CMD_DOORBELL_DUAL_RADAR_WD_SWITCH = 2706,
    CMD_DOORBELL_DUAL_RADAR_WD_DISTANCE = 2707,
    CMD_DOORBELL_DUAL_RADAR_WD_TIME = 2708,
    CMD_DOORBELL_DUAL_PACKAGE_GUARD_SWITCH = 2709,
    CMD_DOORBELL_DUAL_PACKAGE_GUARD_VOICE = 2710,
    CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME = 2711,
    CMD_DOORBELL_DUAL_PACKAGE_STRAND_SWITCH = 2712,
    CMD_DOORBELL_DUAL_PACKAGE_STRAND_TIME = 2713,
    CMD_DOORBELL_DUAL_PACKAGE_ASSISTANT_SWITCH = 2714,
    CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE = 2715,
    CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE = 2716,
    CMD_DOORBELL_DUAL_DELIVERY_GUARD_SWITCH = 2723,
    CMD_DOORBELL_DUAL_NOTIFICATION_HUMAN_DETECT = 2725,
    CMD_SMARTSAFE_ALERT_VOLUME = 1946165264,
    CMD_SMARTSAFE_IS_ENABLE_BEEP = 1946165248,
    CMD_SMARTSAFE_IS_ENABLE_CRACK_PROTECT = 1946165251,
    CMD_SMARTSAFE_IS_ENABLE_LEFT_OPEN = 1946165262,
    CMD_SMARTSAFE_IS_ENABLE_SHAKE_ALARM = 1946165255,
    CMD_SMARTSAFE_IS_ENABLE_STATUS_CHANGE_NOTIFY = 1946165258,
    CMD_SMARTSAFE_IS_ENABLE_TOW_FACTOR_CHK = 1946165256,
    CMD_SMARTSAFE_IS_PWD_SET = 1946165254,
    CMD_SMARTSAFE_IS_SET_PREFIX_PWD = 1946165257,
    CMD_SMARTSAFE_LED_BRIGHTNESS_LEVEL = 1946165250,
    CMD_SMARTSAFE_LED_BRIGHTNESS_SECOND = 1946165261,
    CMD_SMARTSAFE_LEFT_OPEN_SECONDS = 1946165263,
    CMD_SMARTSAFE_LOCK_STATUS = 1946165260,
    CMD_SMARTSAFE_MAX_WRONG_PIN_TIMES = 1946165252,
    CMD_SMARTSAFE_NOTIF = 1946165265,
    CMD_SMARTSAFE_PANIC_FINGER_COUNT = 1946165268,
    CMD_SMARTSAFE_POWER_SAVE_ON = 1946165267,
    CMD_SMARTSAFE_PROTECT_COOLDOWN_SECONDS = 1946165253,
    CMD_SMARTSAFE_REMOTE_OPEN_TYPE = 1946165266,
    CMD_SMARTSAFE_RSSI = 1946165259,
    CMD_SMARTSAFE_VOLUME = 1946165249,
    CMD_SMARTSAFE_PARAM_BASE = 1946165248,
    CMD_SMARTSAFE_SETTINGS = 1946157056,
    CMD_SMARTSAFE_STATUS_UPDATE = 1946157057,
    CMD_SET_PAYLOAD_LOCKV12 = 1930,
    CMD_SET_MOTION_DETECTION_TYPE_HB3 = 1298,
    CMD_GET_WORKING_DAYS_HB3 = 1191,
    CMD_GET_DETECTED_EVENTS_HB3 = 1192,
    CMD_GET_RECORDED_EVENTS_HB3 = 1193,
    CELLULAR_INFO = 7002,
    CELLULAR_SIGNAL_STRENGTH = 7006,
    CMD_DATABASE_COUNT = 10005,
    CMD_DATABASE_COUNT_BY_DEVICE = 10012,
    CMD_DATABASE_COUNT_BY_DATE = 10008,
    CMD_DATABASE_DELETE = 10001,
    CMD_DATABASE_DOWNLOAD = 8001,
    CMD_DATABASE_IMAGE = 1308,
    CMD_DATABASE_QUERY = 10000,
    CMD_DATABASE_QUERY_BY_DATE = 10006,
    CMD_DATABASE_QUERY_COMBINATION = 10009,
    CMD_DATABASE_QUERY_COMBINATION_WITH_AI = 10011,
    CMD_DATABASE_QUERY_LATEST_INFO = 10013,
    CMD_DATABASE_SYNC = 10003,
    CMD_DATABASE_UPDATE = 10002,
    CMD_DATABASE = 1306,
    CMD_SYNC_QUERY_RECENT_PACKAGE_INFO = 10018,
    CMD_DATABASE_QUERY_LOCAL = 10017,
    CMD_WALL_LIGHT_SPEAKER_VOLUME = 6342,
    CMD_WALL_LIGHT_ALERT_VOLUME = 6347,
    CMD_WALL_LIGHT_MOTION_DETECTION_TYPE_HUMAN = 6330,
    CMD_WALL_LIGHT_MOTION_DETECTION_TYPE_ALL = 6332,
    CMD_WALL_LIGHT_NOTIFICATION = 6334,
    CMD_WALL_LIGHT_NOTIFICATION_TYPE_HUMAN = 6335,
    CMD_WALL_LIGHT_NOTIFICATION_TYPE_ALL = 6337,
    CMD_WALL_LIGHT_NOTIFICATION_TYPE = 6338,
    CMD_WALL_LIGHT_SETTINGS_COLORED_LIGHTING_COLORS = 6379,// [{"color":16760832},{"color":16744448},{"color":16728320},{"color":16720384},{"color":16711696},{"color":3927961},{"color":1568995},{"color":485368},{"color":9983},{"color":4664060},{"color":16769280}]
    CMD_WALL_LIGHT_SETTINGS_DYNAMIC_LIGHTING_THEMES = 6380,// [{"name":"Aurora","mode":1,"id":0,"speed":4000,"colors":[65321,65468,28671,9215,42239]},{"name":"Warmth","mode":1,"id":1,"speed":4000,"colors":[16758528,16744448,16732160,16719360,16742144]},{"name":"Let's Party","mode":2,"id":2,"speed":500,"colors":[16718080,16756736,65298,40703,4980991]}]
    CMD_WALL_LIGHT_SETTINGS_MANUAL_LIGHTING_ACTIVE_MODE = 6381,
    CMD_WALL_LIGHT_SETTINGS_SCHEDULE_LIGHTING_ACTIVE_MODE = 6382,
    CMD_WALL_LIGHT_SETTINGS_MOTION_LIGHTING_ACTIVE_MODE = 6383,
    CMD_WALL_LIGHT_SETTINGS_MANUAL_DAILY_LIGHTING = 6361,
    CMD_WALL_LIGHT_SETTINGS_MANUAL_COLORED_LIGHTING = 6384,
    CMD_WALL_LIGHT_SETTINGS_MANUAL_DYNAMIC_LIGHTING = 6366,
    CMD_WALL_LIGHT_SETTINGS_SCHEDULE_DAILY_LIGHTING = 6367,
    CMD_WALL_LIGHT_SETTINGS_SCHEDULE_COLORED_LIGHTING = 6385,
    CMD_WALL_LIGHT_SETTINGS_SCHEDULE_DYNAMIC_LIGHTING = 6372,
    CMD_WALL_LIGHT_SETTINGS_MOTION_DAILY_LIGHTING = 6373,
    CMD_WALL_LIGHT_SETTINGS_MOTION_COLORED_LIGHTING = 6386,
    CMD_WALL_LIGHT_SETTINGS_MOTION_DYNAMIC_LIGHTING = 6378,
    CMD_CAMERA_GARAGE_DOOR_CONTROL_WARNING = 7511,
    CMD_CAMERA_GARAGE_DOOR_STATUS = 7500,
    CMD_CAMERA_GARAGE_DOOR_CALIBRATE = 7505,
    CMD_CAMERA_GARAGE_DOOR_SENSORS = 7503,
    CMD_STORAGE_INFO_HB3 = 1307,
    CMD_SET_FLICKER_ADJUSTMENT = 8000,
    CMD_SET_CROSS_CAMERA_TRACKING = 1065,
    CMD_SET_TRACKING_ASSISTANCE = 1069,
    CMD_SET_CONTINUOUS_TRACKING_TIME = 1070,
    CMD_SET_CROSS_TRACKING_CAMERA_LIST = 1072,
    CMD_SET_CROSS_TRACKING_GROUP_LIST = 1073,
    CMD_INDOOR_SET_SOUND_DETECT_ROUND_LOOK_S350 = 6208,
    CMD_INDOOR_ENABLE_PRIVACY_MODE_S350 = 6250,
    CMD_MOTION_SET_LEAVING_DETECTION = 2726,
    CMD_MOTION_SET_LEAVING_REACTIONS = 2727,
    CMD_SMARKLOCK_ADD_FINGER = 1965,
    CMD_SMARKLOCK_ADD_FINGER_STEP = 1967,
    CMD_SMARKLOCK_CANCLE_FINGER = 1966,
    CMD_SMARTLOCK_ALARM_NOTIFY = 1970,
    CMD_SMARTLOCK_ALARM_STOP = 1971,
    CMD_SMARTLOCK_GET_DOOR_STATUS = 1972,
    CMD_TRANSFER_PAYLOAD = 1940,
    CMD_WIFILOCK_KEYPAD_ENTER_OTA = 1933,
    CMD_SMART_DROP_DELIVERY_MODE = 2103,
    CMD_SMART_DROP_OPEN = 2105,
    CMD_SMART_DROP_OPEN_LID = 2100,
    CMD_SMART_DROP_IS_DENIED_DELIVERY = 2106,
    CMD_SMART_DROP_HAS_MASTER_PIN = 2109,
    CMD_SMART_DROP_IS_PIN_REQUIRED = 2107
}
export declare enum MessageType {
    INIT_P2P_CLIENT_TYPE = 1,
    CONNECT_P2P_TYPE = 2,
    DEINIT_P2P_CLIENT_TYPE = 3,
    SET_COMMAND_WITH_INT_TYPE = 4,
    GET_COMMAND_WITH_INT_TYPE = 5,
    SET_COMMAND_WITH_STRING_TYPE = 6,
    GET_COMMAND_WITH_STRING_TYPE = 7,
    SET_REC_BROADCAT_STATE_TYPE = 8,
    SET_COMMAND_WITH_M_STRING = 9,
    SET_COMMAND_WITH_INT_STRING_TYPE = 10,
    SET_SCHEDULE_TYPE = 11,
    BATCH_DEL_EVENT_TYPE = 12,
    ADD_AI_FACE_INFO_TYPE = 13,
    SET_COMMAND_WITH_2INT_MSTRING = 14,
    CHECK_HUB_STATE = 15,
    SET_COMMAND_WITH_2STR_INT = 16,
    BIND_HUB_TYPE = 17,
    P2P_BIND_HUB_TYPE = 18
}
export declare enum ErrorCode {
    ERROR_BIND_CLIENT_SOCKET_CREATE_FAIL = -304,
    ERROR_BIND_CLIENT_SOCKET_RECEIVE_LEN_ERROR = -307,
    ERROR_BIND_CLIENT_SOCKET_RECEIVE_TIMEOUT = -306,
    ERROR_BIND_CLIENT_SOCKET_SEND_FAIL = -305,
    ERROR_BIND_COMMAND_ERROR = -309,
    ERROR_BIND_PARAM_NULL = -308,
    ERROR_BROADCAST_RECEIVE_SN_NULL = -303,
    ERROR_BROADCAST_RECEIVE_TIME_OUT = -302,
    ERROR_BROADCAST_START_ALREADY_RUNNING = -300,
    ERROR_BROADCAST_STOP_SOCKET_FD_ERROR = -301,
    ERROR_CLOSE_HOMEKIT = -143,
    ERROR_COMMAND_TIMEOUT = -133,
    ERROR_CONNECT_TIMEOUT = -134,
    ERROR_DEV_BUSY = -114,
    ERROR_DEV_CLOSE = -128,
    ERROR_DEV_OFFLINE = -109,
    ERROR_DEV_UPDATEING = -113,
    ERROR_GET_EXEC_RESULT = -120,
    ERROR_HAVE_CONNECT = -101,
    ERROR_HIGHT_TEMPERATURE = -121,
    ERROR_HUB_NON_ADMIN = -125,
    ERROR_HUB_UPDATEING = -112,
    ERROR_INVALID_ACCOUNT = -104,
    ERROR_INVALID_COMMAND = -103,
    ERROR_INVALID_PARAM = -110,
    ERROR_INVALID_PARAM_LEN = -107,
    ERROR_MAX_DEV_CONNECT_NUM = -123,
    ERROR_MAX_HUB_CONNECT_NUM = -102,
    ERROR_MAX_NAS_CONNECT_NUM = -130,
    ERROR_MODE_DISABLE = -129,
    ERROR_NETWORK_NOT_AVAILABLE = 998,
    ERROR_NOT_FACE = -115,
    ERROR_NOT_FIND_DEV = -106,
    ERROR_NOT_TFCARD = -118,
    ERROR_NULL_POINT = -100,
    ERROR_OPEN_FILE_FAIL = -111,
    ERROR_PARAM_NO_CHANGE = -116,
    ERROR_PIPE_FAIL = -124,
    ERROR_PLAY_STOP = -127,
    ERROR_POWER_LOW = -117,
    ERROR_PPCS_ALREADY_INITIALIZED = -2,
    ERROR_PPCS_CONNECTING = -126,
    ERROR_PPCS_DEVICE_NOT_ONLINE = -6,
    ERROR_PPCS_FAIL_TO_CREATE_THREAD = -22,
    ERROR_PPCS_FAIL_TO_RESOLVE_NAME = -7,
    ERROR_PPCS_ID_OUT_OF_DATE = -9,
    ERROR_PPCS_INVALID_APILICENSE = -21,
    ERROR_PPCS_INVALID_DSK = -23,
    ERROR_PPCS_INVALID_ID = -4,
    ERROR_PPCS_INVALID_PARAMETER = -5,
    ERROR_PPCS_INVALID_PREFIX = -8,
    ERROR_PPCS_INVALID_SESSION_HANDLE = -11,
    ERROR_PPCS_MAX_SESSION = -17,
    ERROR_PPCS_NOT_INITIALIZED = -1,
    ERROR_PPCS_NO_RELAY_SERVER_AVAILABLE = -10,
    ERROR_PPCS_RELAY = 1,
    ERROR_PPCS_REMOTE_SITE_BUFFER_FULL = -15,
    ERROR_PPCS_SESSION_CLOSED_CALLED = -14,
    ERROR_PPCS_SESSION_CLOSED_INSUFFICIENT_MEMORY = -20,
    ERROR_PPCS_SESSION_CLOSED_REMOTE = -12,
    ERROR_PPCS_SESSION_CLOSED_TIMEOUT = -13,
    ERROR_PPCS_SUCCESSFUL = 0,
    ERROR_PPCS_TIME_OUT = -3,
    ERROR_PPCS_UDP_PORT_BIND_FAILED = -18,
    ERROR_PPCS_USER_CONNECT_BREAK = -19,
    ERROR_PPCS_USER_LISTEN_BREAK = -16,
    ERROR_SET_P2P_INFO = -122,
    ERROR_STATION_HAS_BIND = 20020,
    ERROR_TFCARD_FORMATING = -119,
    ERROR_TFCARD_REPAIRING = -135,
    ERROR_TFCARD_VOLUME_OVERFLOW = -132,
    ERROR_WAIT_TIMEOUT = -108,
    ERROR_WAKEUP_CAMRA_TYPE = -131,
    ERROR_WRITE_FLASH = -105,
    ERROR_XM_BASE = -200,
    ERROR_XM_WIFI_DISCONNECT = -203,
    ERROR_XM_WIFI_TIMEOUT = -205,
    ERROR_XM_WIFI_WAKEUP_FAIL = -204,
    ERROR_LIMIT_REACHED = -500,
    ERROR_FAILED_TO_REQUEST = 503,
    ERROR_SEQUENCE_NUMBER = -151
}
export declare enum TFCardStatus {
    NULL = -1,
    NORMAL = 0,
    NON_ORIGINAL = 1,
    MOUNT_FAIL = 2,
    FORMAT_FAIL = 3,
    REMOVE = 4,
    FORMATING = 5,
    BUSY = 6,
    E2FSCK_FAIL_MOUNT_RW = 7,
    E2FSCK_FAIL_MOUNT_FAIL_REINSERT = 8,
    E2FSCK_FAIL_MOUNT_RO = 9,
    E2FSCK_FAIL_MOUNT_RW_ERR = 10,
    REPAIRING = 11,
    MOUNT_FAIL_E2FSCK_ERROR = 12,
    MOUNT_FAIL_E2FSCK_TIMEOUT = 13,
    MOUNT_RW_E2FSCK_ERROR = 14,
    MOUNT_RW_E2FSCK_TIMEOUT = 15,
    MOUNT_RO_E2FSCK_OK = 16,
    MOUNT_RO_E2FSCK_ERROR = 17,
    MOUNT_RO_E2FSCK_TIMEOUT = 18,
    MOUNT_RERR_E2FSCK_OK = 19,
    MOUNT_RERR_E2FSCK_ERROR = 20,
    MOUNT_RERR_E2FSCK_TIMEOUT = 21,
    UNNORMAL_IO_ERROR = 22,
    RISK = 23,
    MOUNTING = 24
}
export declare enum AlarmEvent {
    HUB_STOP = 0,
    DEV_STOP = 1,
    GSENSOR = 2,
    PIR = 3,
    APP = 4,
    HOT = 5,
    DOOR = 6,
    CAMERA_PIR = 7,
    MOTION_SENSOR = 8,
    CAMERA_GSENSOR = 9,
    CAMERA_APP = 10,
    CAMERA_LINKAGE = 11,
    HUB_KEYPAD = 13,
    HUB_STOP_BY_KEYPAD = 15,
    HUB_STOP_BY_APP = 16,
    HUB_STOP_BY_HAND = 17,
    APP_LIGHT = 22,
    APP_LIGHT_SOUND = 23,
    MOTION_APP_LIGHT = 24,
    MOTION_APP_LIGHT_ALARM = 25
}
export declare enum WatermarkSetting1 {
    OFF = 0,
    ON = 1
}
export declare enum WatermarkSetting2 {
    OFF = 1,
    ON = 2
}
export declare enum WatermarkSetting3 {
    OFF = 0,
    TIMESTAMP = 1,
    TIMESTAMP_AND_LOGO = 2
}
export declare enum WatermarkSetting4 {
    TIMESTAMP = 0,
    TIMESTAMP_AND_LOGO = 1,
    OFF = 2
}
export declare enum WatermarkSetting5 {
    LOGO = 1,
    OFF = 2
}
export declare enum PanTiltDirection {
    ROTATE360 = 0,
    LEFT = 1,
    RIGHT = 2,
    UP = 3,
    DOWN = 4
}
export declare enum VideoCodec {
    UNKNOWN = -1,
    H264 = 0,
    H265 = 1
}
export declare enum AudioCodec {
    UNKNOWN = -1,
    NONE = 0,
    AAC = 1,// 0
    AAC_LC = 2,// 1
    AAC_ELD = 3
}
export declare enum ESLCommand {
    ACTIVATE_DEVICE = 107,
    ADD_FINGER = 6003,
    ADD_FINGER_STEP = 6029,
    ADD_PW = 6002,
    BIND_LOCK = 101,
    CALIBRATE_LOCK = 6017,
    CANCEL_ADD_FINGER = 115,
    CHECK_KEYPAD_CONNECT = 130,
    CREATE_TEMPORARY_PW = 125,
    DELETE_FINGER = 6006,
    DELETE_LOCK_EVENT = 127,
    DELETE_PW = 6005,
    DELETE_USER = 6004,
    ECDH_CONSULT = 131,
    ECDH_MODE_GET_PUBLIC_KEY = 138,
    END_BIND = 102,
    ENTER_OTA = 6020,
    ENTER_OTA_UPDATE = 116,
    GET_FINGER_PW_USAGE = 6022,
    GET_KEYPAD_INFO = 136,
    GET_LOCK_PARAM = 6016,
    GET_LOCK_PUBLIC_KEY = 121,
    GET_USER_ID_AND_PW_ID = 6027,
    HEART_BEAT = 6001,
    KEYPAD_ENTER_OTA = 135,
    KEYPAD_VERIFY_APP = 134,
    LOCK_KEYPAD_BIND_NOTIFY = 133,
    MANUAL_CALIBRATE = 128,
    MODIFY_NAME = 119,
    NOTIFY = 110,
    ON_OFF_LOCK = 6018,
    PULL_BLE = 6024,
    QUERY_ALL_USERS = 6007,
    QUERY_LOCK_RECORD = 122,
    QUERY_ONE_USER = 6008,
    QUERY_PW = 6009,
    QUERY_PW_LIST = 6010,
    QUERY_STATUS_IN_LOCK = 6012,
    QUERY_STATUS_IN_SERVER = 6011,
    RECEIVE_SEQ_NUM = 6028,
    REMOVE_DEVICE = 124,
    REMOVE_KEYPAD = 137,
    RESET = 6019,
    SAVE_LOCK_PARAM_TO_SERVER = 6023,
    SEND_LOCK_INFO_TO_KEYPAD = 132,
    SEND_OTA_PACKAGE = 117,
    SET_LOCK_PARAM = 6015,
    SHUT_DOWN_BLE = 6026,
    TEMPORARY_PW_LIST = 126,
    UPDATE_PW = 6014,
    UPDATE_USER_TIME = 6013,
    VERIFY_IDENTITY = 6000,
    VERIFY_PW = 118,
    WIFI_CONNECT = 106,
    WIFI_LIST = 105,
    WIFI_SCAN = 104
}
export declare enum ESLBleCommand {
    BIND_LOCK = 1,
    VERIFY_IDENTITY = 2,
    HEART_BEAT = 3,
    ACTIVATE_DEVICE = 4,
    ADD_PW = 5,
    CALIBRATE_LOCK = 7,
    ON_OFF_LOCK = 8,
    RESET = 9,
    WIFI_SCAN = 10,
    WIFI_LIST = 11,
    WIFI_CONNECT = 12,
    ADD_FINGER = 13,
    DELETE_FINGER = 14,
    DELETE_USER = 15,
    CANCEL_ADD_FINGER = 16,
    QUERY_STATUS_IN_LOCK = 17,
    NOTIFY = 18,
    END_BIND = 21,
    GET_LOCK_PUBLIC_KEY = 22,
    VERIFY_PW = 23,
    QUERY_LOCK_RECORD = 24,
    QUERY_ALL_USERS = 25,
    QUERY_PW = 26,
    UPDATE_PW = 27,
    UPDATE_USER_TIME = 28,
    MODIFY_NAME = 29,
    GET_FINGER_PW_USAGE = 30,
    ENTER_OTA_UPDATE = 31,
    SEND_OTA_PACKAGE = 32,
    GET_LOCK_PARAM = 33,
    SET_LOCK_PARAM = 34,
    SHUT_DOWN_BLE = 36
}
export declare enum ESLAnkerBleConstant {
    a = -95,
    b = -94,
    c = -93,
    d = -92,
    e = -91,
    f = -90,
    g = -89,
    h = -88,
    i = -87,
    j = -86
}
export declare enum P2PConnectionType {
    ONLY_LOCAL = 1,
    QUICKEST = 2
}
export declare enum IndoorSoloSmartdropCommandType {
    CMD_ANSWERING_RING_RECORD = 1027,
    CMD_AUDIO_RECORD = 1029,
    CMD_BRIGHTNESS = 1021,
    CMD_CHIME_BIND = 1007,
    CMD_CHIME_OPEN = 1006,
    CMD_DELETE_HISTORY_FILE = 1011,
    CMD_DELETE_METERING_ZONE = 1014,
    CMD_ENABLE_HDR = 1019,
    CMD_END_SPEAK = 1002,
    CMD_FIXED_RESOLUTION = 1018,
    CMD_LED_NIGHT_OPEN = 1026,
    CMD_MOTION_ADVANCE_OPTION_DEFAULT = 1028,
    CMD_MOTION_DETECTION_PACKAGE = 1016,
    CMD_MOTION_DETECTION_ZONE = 1009,
    CMD_MOTION_DETECTION_ZONE_DELETE = 1008,
    CMD_MOTION_UN_DETECTION_ZONE = 1024,
    CMD_MOTION_UN_DETECTION_ZONE_DELETE = 1025,
    CMD_QUERY_DEVICE_VOLTAGE = 1015,
    CMD_QUICK_RESPONSE = 1004,
    CMD_SEND_VIDEO_BITRATE = 1017,
    CMD_SET_METERING_ZONE = 1013,
    CMD_SET_RINGTONE_VOLUME = 1012,
    CMD_START_LIVE = 1000,
    CMD_START_SPEAK = 1001,
    CMD_STREAM_INFO = 1005,
    CMD_UPDATE_QUICK_RESPONSE = 1010,
    CMD_VIDEO_DISTORTIONCORRECTION = 1022,
    CMD_VIDEO_QUALITY = 1020,
    CMD_VIDEO_RECORD_QUALITY = 1023,
    CMD_ZOOM_REGION = 1003
}
export declare enum SmartSafeCommandCode {
    BIND_CMD = 1,
    VERIFY_IDENTITY = 2,
    DEFAULT = 3,
    ACTIVATE_DEVICE = 4,
    ADD_PASSWORD = 5,
    QUERY_IS_SET_PASSWORD = 6,
    ADD_FINGERPRINT = 7,
    DELETE_FINGERPRINT = 8,
    QUERY_FINGERPRINT_LIST = 9,
    ENTER_OTA_UPDATE = 10,
    SEND_OTA_PACKAGE = 11,
    QUERY_LOCK_STATUS = 12,
    UNLOCK = 13,
    QUERY_BATTERY = 14,
    SET_LOCK_ALARM = 15,
    SET_CRACK_PROTECT = 16,
    UNLOAD_BATTERY = 17,
    QUERY_FW_CODE = 18,
    SCAN_WIFI = 19,
    QUERY_WIFI_LIST = 20,
    CONNECT_WIFI = 21,
    QUERY_CRACK_PROTECT = 22,
    QUERY_LOCK_ALARM = 23,
    QUERY_SCRAMBLE_PASSWORD = 24,
    SET_SCRAMBLE_PASSWORD = 25,
    QUERY_DUAL_UNLOCK = 26,
    SET_DUAL_UNLOCK = 27,
    UNLOCK_EVENTS = 28,
    CANCEL_FINGERPRINT = 29,
    ACTIVE_WIFI = 30,
    SET_VOLUME = 31,
    QUERY_VOLUME = 32,
    SET_LIGHT = 33,
    QUERY_LIGHT = 34,
    SET_SHAKE = 35,
    QUERY_SHAKE = 36,
    UNBIND = 37,
    UPDATE_FINGERPRINT = 38,
    UPDATE_NAME = 39,
    SET_PUSH = 40,
    QUERY_PUSH = 41,
    SET_VOLUME_ALERT = 42,
    QUERY_VOLUME_ALERT = 43,
    QUERY_PASSWORD = 44,
    SET_UNLOCK_MODE = 45,
    QUERY_UNLOCK_MODE = 46,
    SET_VERIFY_PIN = 47,
    UNLOCK_EVENTS2 = 48,
    UNLOCK_EVENTS3 = 49,
    SET_POWERSAVE = 50,
    QUERY_POWERSAVE = 51,
    SEND_WIFI_OTA = 52,
    QUERY_IS_SET_PANIC_FINGERPRINT = 53
}
export declare enum SmartSafeAlarm911Event {
    CANCEL_ALARM = 0,
    ALARM = 1,
    ALARM_SUCCESS = 2,
    ALARM_NOT_OPEN = 3,
    ALARM_OPEN_FAILED = 4
}
export declare enum SmartSafeShakeAlarmEvent {
    CANCEL_ALARM = 0,
    ALARM = 1
}
export declare enum SmartSafeBatteryTemperatureEvent {
    NORMAL = 0,
    LOW = 1,
    HIGH = 2
}
export declare enum SmartSafeBatteryStatusEvent {
    NOT_CHARGING = 0,
    CHARGING = 1
}
export declare enum DatabaseReturnCode {
    ERROR_DB_NOT_READY = -1100,
    SUCCESSFUL = 0
}
export declare enum P2PStorageType {
    NONE = 0,
    EMMC = 1,
    HD = 2,
    SDCARD = 3,
    SENSOR = 4,
    ALARM = 5
}
export declare enum FilterStorageType {
    NONE = 0,
    LOCAL = 1,
    CLOUD = 2
}
export declare enum FilterEventType {
    ALL = 0,
    VIDEO = 1,
    ALERT = 2
}
export declare enum FeatureTag {
    USER = 0,
    STRANGER = 1,
    SELF_LEARNING_NO_CONFIRM = 2,
    SELF_LEARNING_CONFIRM = 3,
    SELF_LEARNING_ERROR_CONFIRM = 4
}
export declare enum FilterDetectType {
    NOT_SUPPORT = 0,
    PERSON_FACE = 1,
    PERSON_BODY = 2,
    VEHICLE = 4,
    PET = 8,
    SOUND = 128,
    CRYING = 256,
    PACKAGE = 512,
    PACKAGE_PICK_UP = 512,
    PACKAGE_DELIVERED = 1024,
    CROSS_DELIVERED = 2048
}
export declare enum CalibrateGarageType {
    ROLLER_DOOR = 1,
    SECTIONAL_DOOR = 2,
    TILT_DOOR = 3
}
export interface LockV12P2PCommand {
    aesKey: string;
    bleCommand: number;
    payload: LockV12P2PCommandType;
}
export interface SmartLockP2PCommand {
    bleCommand: number;
    payload: SmartLockP2PCommandType;
}
export declare enum EncryptionType {
    NONE = 0,
    LEVEL_1 = 1,
    LEVEL_2 = 2
}
export declare enum InternalP2PCommandType {
    WithIntString = 0,
    WithInt = 1,
    WithStringPayload = 2,
    WithString = 3,
    WithoutData = 4
}
export declare enum TrackerCommandType {
    COMMAND_ANTILOST = 1001,
    COMMAND_AUDIO_SETTING = 999,
    COMMAND_BATTERY = 1003,
    COMMAND_LOCATION = 1002,
    COMMAND_LOST_MODE = 998,
    COMMAND_NEW_LOCATION = 1008,
    COMMAND_NOTIFICATION = 1004,
    COMMAND_OPEN_ANTI_TOUCH = 1010,
    COMMAND_TYPE_FINDMYPHONE = 1000,
    DISTURB_LOCATION_LIST = 1007,
    LOCATION_ADDRESS = 1006,
    LOCATION_NEW_ADDRESS = 1009,
    TYPE_ICON_INDEX = 1005
}
export declare enum SmartLockCommand {
    CALIBRATE_LOCK = 6017,
    QUERY_STATUS_IN_LOCK = 6012,
    ON_OFF_LOCK = 6018,
    ADD_PW = 6002,
    UPDATE_USER_TIME = 146,
    UPDATE_PW = 6014,
    QUERY_PW = 6009,
    ADD_FINGER = 6003,
    CANCEL_ADD_FINGER = 115,
    DELETE_FINGER = 6006,
    UPDATE_FINGER_NAME = 119,
    QUERY_ALL_USERS = 6007,
    DELETE_USER = 6004,
    GET_FINGER_PW_USAGE = 6022,
    WIFI_SCAN = 104,
    WIFI_LIST = 105,
    WIFI_CONNECT = 106,
    ACTIVATE_DEVICE = 107,
    SET_LOCK_PARAM = 6015,
    GET_LOCK_PARAM = 6016,
    GET_LOCK_EVENT = 122,
    PULL_BLE = 6024,
    NOTIFY = 142,
    CONNECT = 138,
    DISCONNECT = 141,
    CAPACITY_NEGOTIATION = 139,
    SET_CAPACITY = 140,
    VERIFY_IDENTIFY = 6000,
    BIND = 101,
    UNBIND = 124,
    HEARTBEAT = 6001,
    RESET = 6019,
    BIND_SUCCESS = 102
}
export declare enum SmartLockFunctionType {
    TYPE_1 = 1,
    TYPE_2 = 2
}
export declare enum SmartLockBleCommandFunctionType1 {
    CONNECT = 1,
    DISCONNECT = 2,
    CAPACITY_NEGOTIATION = 3,
    SET_CAPACITY = 5,
    VERIFY_IDENTIFY = 34,
    BIND = 35,
    UNBIND = 36,
    HEARTBEAT = 38,
    GET_DEVICE_INFO = 41,
    GET_OTA_STATUS = 44,
    OTA_OPERATION = 45,
    OTA_DATA_SENDING = 46,
    RESET = 47,
    BIND_SUCCESS = 48
}
export declare enum SmartLockBleCommandFunctionType2 {
    CALIBRATE_LOCK = 33,
    QUERY_STATUS_IN_LOCK = 34,
    ON_OFF_LOCK = 35,
    ADD_PW = 36,
    UPDATE_USER_TIME = 37,
    UPDATE_PW = 38,
    QUERY_PW = 39,
    ADD_FINGER = 40,
    CANCEL_ADD_FINGER = 41,
    DELETE_FINGER = 42,
    UPDATE_FINGER_NAME = 43,
    QUERY_ALL_USERS = 44,
    DELETE_USER = 45,
    GET_FINGER_PW_USAGE = 46,
    WIFI_SCAN = 48,
    WIFI_LIST = 49,
    WIFI_CONNECT = 50,
    ACTIVATE_DEVICE = 51,
    SET_LOCK_PARAM = 52,
    GET_LOCK_PARAM = 53,
    GET_LOCK_EVENT = 56,
    PULL_BLE = 61,
    NOTIFY = 74
}
