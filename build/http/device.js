"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnknownDevice = exports.SmartSafe = exports.Keypad = exports.Lock = exports.MotionSensor = exports.EntrySensor = exports.Sensor = exports.GarageCamera = exports.WallLightCam = exports.FloodlightCamera = exports.BatteryDoorbellCamera = exports.WiredDoorbellCamera = exports.DoorbellCamera = exports.IndoorCamera = exports.SoloCamera = exports.Camera = exports.Device = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const types_1 = require("./types");
const parameter_1 = require("./parameter");
const types_2 = require("../p2p/types");
const utils_1 = require("./utils");
const utils_2 = require("../p2p/utils");
const types_3 = require("../push/types");
const utils_3 = require("../utils");
const error_1 = require("./error");
class Device extends tiny_typed_emitter_1.TypedEmitter {
    constructor(api, device) {
        super();
        this.eventTimeouts = new Map();
        this.properties = {};
        this.rawProperties = {};
        this.ready = false;
        this.api = api;
        this.rawDevice = device;
        this.log = api.getLog();
    }
    initializeState() {
        this.update(this.rawDevice);
        this.ready = true;
        setImmediate(() => {
            this.emit("ready", this);
        });
    }
    initialize() {
        this.initializeState();
    }
    getRawDevice() {
        return this.rawDevice;
    }
    update(device, cloudOnlyProperties = false) {
        this.rawDevice = device;
        const metadata = this.getPropertiesMetadata(true);
        for (const property of Object.values(metadata)) {
            if (this.rawDevice[property.key] !== undefined && typeof property.key === "string") {
                this.updateProperty(property.name, property.key === "cover_path" ? (0, utils_1.getImagePath)(this.rawDevice[property.key]) : this.rawDevice[property.key]);
            }
            else if (this.properties[property.name] === undefined && property.default !== undefined && !this.ready) {
                this.updateProperty(property.name, property.default);
            }
        }
        if (!cloudOnlyProperties && this.rawDevice.params) {
            this.rawDevice.params.forEach(param => {
                this.updateRawProperty(param.param_type, param.param_value);
            });
        }
        this.log.debug("Normalized Properties", { deviceSN: this.getSerial(), properties: this.properties });
    }
    updateProperty(name, value, force = false) {
        if ((this.properties[name] !== undefined && this.properties[name] !== value)
            || this.properties[name] === undefined || force) {
            const oldValue = this.properties[name];
            this.properties[name] = value;
            this.emit("property changed", this, name, value, this.ready);
            try {
                this.handlePropertyChange(this.getPropertyMetadata(name, true), oldValue, this.properties[name]);
            }
            catch (error) {
                if (error instanceof error_1.InvalidPropertyError) {
                    this.log.error(`Invalid Property ${name} error`, error);
                }
                else {
                    this.log.error(`Property ${name} error`, error);
                }
            }
            return true;
        }
        return false;
    }
    updateRawProperties(values) {
        Object.keys(values).forEach(paramtype => {
            const param_type = Number.parseInt(paramtype);
            this.updateRawProperty(param_type, values[param_type]);
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handlePropertyChange(metadata, oldValue, newValue) {
        try {
            if ((metadata.key === types_1.ParamType.DETECT_MOTION_SENSITIVE || metadata.key === types_1.ParamType.DETECT_MODE) && this.isWiredDoorbell()) {
                //TODO: Not perfectly solved, can in certain cases briefly trigger a double event where the last event is the correct one
                const rawSensitivity = this.getRawProperty(types_1.ParamType.DETECT_MOTION_SENSITIVE);
                const rawMode = this.getRawProperty(types_1.ParamType.DETECT_MODE);
                if (rawSensitivity !== undefined && rawMode !== undefined && this.hasProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity)) {
                    const sensitivity = Number.parseInt(rawSensitivity);
                    const mode = Number.parseInt(rawMode);
                    if (mode === 3 && sensitivity === 2) {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, 1);
                    }
                    else if (mode === 1 && sensitivity === 1) {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, 2);
                    }
                    else if (mode === 1 && sensitivity === 2) {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, 3);
                    }
                    else if (mode === 1 && sensitivity === 3) {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, 4);
                    }
                    else if (mode === 2 && sensitivity === 1) {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetectionSensitivity, 5);
                    }
                }
            }
            else if (metadata.name === types_1.PropertyName.DeviceWifiRSSI && this.hasProperty(types_1.PropertyName.DeviceWifiSignalLevel)) {
                this.updateProperty(types_1.PropertyName.DeviceWifiSignalLevel, (0, utils_1.calculateWifiSignalLevel)(this, newValue));
            }
            else if (metadata.name === types_1.PropertyName.DeviceCellularRSSI && this.hasProperty(types_1.PropertyName.DeviceCellularSignalLevel)) {
                this.updateProperty(types_1.PropertyName.DeviceCellularSignalLevel, (0, utils_1.calculateCellularSignalLevel)(newValue));
            }
        }
        catch (error) {
            this.log.error(`Device handlePropertyChange error`, error, { metadata: metadata, oldValue: oldValue, newValue: newValue });
        }
    }
    updateRawProperty(type, value) {
        const parsedValue = parameter_1.ParameterHelper.readValue(type, value, this.log);
        if ((this.rawProperties[type] !== undefined && this.rawProperties[type] !== parsedValue)
            || this.rawProperties[type] === undefined) {
            this.rawProperties[type] = parsedValue;
            if (this.ready)
                this.emit("raw property changed", this, type, this.rawProperties[type]);
            const metadata = this.getPropertiesMetadata(true);
            for (const property of Object.values(metadata)) {
                if (property.key === type) {
                    try {
                        this.updateProperty(property.name, this.convertRawPropertyValue(property, this.rawProperties[type]));
                    }
                    catch (error) {
                        if (error instanceof error_1.PropertyNotSupportedError) {
                            this.log.debug("Property not supported error", error);
                        }
                        else {
                            this.log.error("Property error", error);
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }
    convertRawPropertyValue(property, value) {
        try {
            if (property.key === types_1.ParamType.PRIVATE_MODE || property.key === types_1.ParamType.OPEN_DEVICE || property.key === types_2.CommandType.CMD_DEVS_SWITCH) {
                if (this.isIndoorCamera() || (this.isWiredDoorbell() && !this.isWiredDoorbellT8200X()) || this.getDeviceType() === types_1.DeviceType.FLOODLIGHT_CAMERA_8422 || this.getDeviceType() === types_1.DeviceType.FLOODLIGHT_CAMERA_8424) {
                    return value !== undefined ? (value === "true" ? true : false) : false;
                }
                return value !== undefined ? (value === "0" ? true : false) : false;
            }
            else if (property.key === types_2.CommandType.CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceNotificationRing: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined ? (Number.parseInt(value.notification_ring_onoff) === 1 ? true : false) : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE DeviceNotificationRing Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceNotificationMotion: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined ? (Number.parseInt(value.notification_motion_onoff) === 1 ? true : false) : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE DeviceNotificationMotion Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceNotificationType: {
                        const numericProperty = property;
                        try {
                            return value !== undefined ? Number.parseInt(value.notification_style) : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        }
                        catch (error) {
                            this.log.error("Convert CMD_BAT_DOORBELL_SET_NOTIFICATION_MODE DeviceNotificationType Error:", { property: property, value: value, error: error });
                            return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                    }
                }
            }
            else if (property.key === types_1.ParamType.DOORBELL_NOTIFICATION_OPEN) {
                try {
                    switch (property.name) {
                        case types_1.PropertyName.DeviceNotificationRing:
                            return value !== undefined ? (Number.parseInt(value) === 3 || Number.parseInt(value) === 1 ? true : false) : false;
                        case types_1.PropertyName.DeviceNotificationMotion:
                            return value !== undefined ? (Number.parseInt(value) === 3 || Number.parseInt(value) === 2 ? true : false) : false;
                    }
                }
                catch (error) {
                    this.log.error("Convert DOORBELL_NOTIFICATION_OPEN Error:", { property: property, value: value, error: error });
                    return false;
                }
            }
            else if (property.key === types_2.CommandType.CMD_SET_PIRSENSITIVITY) {
                const numericProperty = property;
                try {
                    if (this.getDeviceType() === types_1.DeviceType.CAMERA || this.getDeviceType() === types_1.DeviceType.CAMERA_E) {
                        const convertedValue = ((200 - Number.parseInt(value)) / 2) + 1;
                        return convertedValue;
                    }
                    else if (this.isCamera2Product()) {
                        let convertedValue;
                        switch (Number.parseInt(value)) {
                            case 192:
                                convertedValue = 1;
                                break;
                            case 118:
                                convertedValue = 2;
                                break;
                            case 72:
                                convertedValue = 3;
                                break;
                            case 46:
                                convertedValue = 4;
                                break;
                            case 30:
                                convertedValue = 5;
                                break;
                            case 20:
                                convertedValue = 6;
                                break;
                            case 14:
                                convertedValue = 7;
                                break;
                            default:
                                convertedValue = 4;
                                break;
                        }
                        return convertedValue;
                    }
                    else {
                        return value !== undefined ? Number.parseInt(value) : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                    }
                }
                catch (error) {
                    this.log.error("Convert CMD_SET_PIRSENSITIVITY Error:", { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.key === types_2.CommandType.CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE_STARTTIME || property.key === types_2.CommandType.CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE_ENDTIME) {
                const tmpBuffer = Buffer.from(value, "hex");
                return `${tmpBuffer.slice(0, 1).readInt8().toString().padStart(2, "0")}:${tmpBuffer.slice(1).readInt8().toString().padStart(2, "0")}`;
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DETECTION_SENSITIVITY) {
                const numericProperty = property;
                try {
                    switch (property.name) {
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityMode:
                            return value !== undefined && value.model !== undefined ? value.model : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityStandard:
                            return value !== undefined && value.model === 0 ? (0, utils_1.getDistances)(value.block_list)[0] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[0] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[1] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[2] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[3] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[4] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[5] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[6] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                            return value !== undefined && value.model === 1 ? (0, utils_1.getDistances)(value.block_list)[7] : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                    }
                }
                catch (error) {
                    this.log.error(`Convert CMD_DOORBELL_DUAL_RADAR_WD_DETECTION_SENSITIVITY ${property.name} Error:`, { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceLoiteringCustomResponseTimeFrom: {
                        const stringProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].start_hour !== undefined && value.setting[0].start_min !== undefined) ? `${value.setting[0].start_hour.padStart(2, "0")}:${value.setting[0].start_min.padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponseTimeFrom Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                    case types_1.PropertyName.DeviceLoiteringCustomResponseTimeTo: {
                        const stringProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].end_hour !== undefined && value.setting[0].end_min !== undefined) ? `${value.setting[0].end_hour.padStart(2, "0")}:${value.setting[0].end_min.padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponseTimeTo Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                    case types_1.PropertyName.DeviceLoiteringCustomResponsePhoneNotification: {
                        const booleanProperty = property;
                        try {
                            return value.setting[0].push_notify === 1 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponsePhoneNotification Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification: {
                        const booleanProperty = property;
                        try {
                            return value.setting[0].homebase_alert === 1 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponseHomeBaseNotification Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse: {
                        const booleanProperty = property;
                        try {
                            return value.setting[0].auto_voice_resp === 1 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponseAutoVoiceResponse Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice: {
                        const numericProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].auto_voice_id !== undefined) ? value.setting[0].auto_voice_id : numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_AUTO_RESPONSE DeviceLoiteringCustomResponseAutoVoiceResponseVoice Error:", { property: property, value: value, error: error });
                            return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                    }
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_DELIVERY_GUARD_SWITCH) {
                const booleanProperty = property;
                try {
                    return value !== undefined && value.ai_bottom_switch !== undefined ? value.ai_bottom_switch === 1024 : (booleanProperty.default !== undefined ? booleanProperty.default : false);
                }
                catch (error) {
                    this.log.error("Convert CMD_DOORBELL_DUAL_DELIVERY_GUARD_SWITCH Error:", { property: property, value: value, error: error });
                    return booleanProperty.default !== undefined ? booleanProperty.default : false;
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_PACKAGE_STRAND_TIME) {
                const stringProperty = property;
                try {
                    return (value.start_h !== undefined && value.start_m !== undefined) ? `${value.start_h.toString().padStart(2, "0")}:${value.start_m.toString().padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                }
                catch (error) {
                    this.log.error("Convert CMD_DOORBELL_DUAL_PACKAGE_STRAND_TIME Error:", { property: property, value: value, error: error });
                    return stringProperty.default !== undefined ? stringProperty.default : "";
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceRingAutoResponse: {
                        const booleanProperty = property;
                        try {
                            return value.setting[0].active === 1 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE DeviceRingAutoResponse Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceRingAutoResponseVoiceResponse: {
                        const booleanProperty = property;
                        try {
                            return value.setting[0].active === 1 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE DeviceRingAutoResponseVoiceResponse Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceRingAutoResponseTimeFrom: {
                        const stringProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].start_hour !== undefined && value.setting[0].start_min !== undefined) ? `${value.setting[0].start_hour.padStart(2, "0")}:${value.setting[0].start_min.padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE DeviceRingAutoResponseTimeFrom Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                    case types_1.PropertyName.DeviceRingAutoResponseTimeTo: {
                        const stringProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].end_hour !== undefined && value.setting[0].end_min !== undefined) ? `${value.setting[0].end_hour.padStart(2, "0")}:${value.setting[0].end_min.padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE DeviceRingAutoResponseTimeTo Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                    case types_1.PropertyName.DeviceRingAutoResponseVoiceResponseVoice: {
                        const numericProperty = property;
                        try {
                            return (value.setting !== undefined && value.setting.length > 0 !== undefined && value.setting[0].auto_voice_id !== undefined) ? value.setting[0].auto_voice_id : numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_RING_AUTO_RESPONSE DeviceRingAutoResponseVoiceResponseVoice Error:", { property: property, value: value, error: error });
                            return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                    }
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom: {
                        const stringProperty = property;
                        try {
                            return (value.start_h !== undefined && value.start_m !== undefined) ? `${value.start_h.toString().padStart(2, "0")}:${value.start_m.toString().padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME DeviceDeliveryGuardPackageGuardingActivatedTimeFrom Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                    case types_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo: {
                        const stringProperty = property;
                        try {
                            return (value.end_h !== undefined && value.end_m !== undefined) ? `${value.end_h.toString().padStart(2, "0")}:${value.end_m.toString().padStart(2, "0")}` : stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                        catch (error) {
                            this.log.error("Convert CMD_DOORBELL_DUAL_PACKAGE_GUARD_TIME DeviceDeliveryGuardPackageGuardingActivatedTimeTo Error:", { property: property, value: value, error: error });
                            return stringProperty.default !== undefined ? stringProperty.default : "";
                        }
                    }
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_DISTANCE) {
                const numericProperty = property;
                try {
                    return value !== undefined && value.radar_wd_distance !== undefined ? value.radar_wd_distance : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                }
                catch (error) {
                    this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_DISTANCE Error:", { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_RADAR_WD_TIME) {
                const numericProperty = property;
                try {
                    return value !== undefined && value.radar_wd_time !== undefined ? value.radar_wd_time : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                }
                catch (error) {
                    this.log.error("Convert CMD_DOORBELL_DUAL_RADAR_WD_TIME Error:", { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.key === types_2.CommandType.CMD_DOORBELL_DUAL_PACKAGE_GUARD_VOICE) {
                const numericProperty = property;
                try {
                    return value !== undefined && value.auto_voice_id !== undefined ? value.auto_voice_id : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                }
                catch (error) {
                    this.log.error("Convert CMD_DOORBELL_DUAL_PACKAGE_GUARD_VOICE Error:", { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.key === types_2.CommandType.CMD_SET_SNOOZE_MODE) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceSnooze: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined && value.snooze_time !== undefined && value.snooze_time !== "" && Number.parseInt(value.snooze_time) !== 0 ? true : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnooze Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceSnoozeTime: {
                        const numericProperty = property;
                        try {
                            return value !== undefined && value.snooze_time !== undefined && value.snooze_time !== "" ? Number.parseInt(value.snooze_time) : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnoozeTime Error:", { property: property, value: value, error: error });
                            return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                    }
                    case types_1.PropertyName.DeviceSnoozeStartTime: {
                        const numericProperty = property;
                        try {
                            return value !== undefined && value.startTime !== undefined ? Number.parseInt(value.startTime) : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnoozeTime Error:", { property: property, value: value, error: error });
                            return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                        }
                    }
                    case types_1.PropertyName.DeviceSnoozeHomebase: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined && value.homebase_onoff !== undefined ? (value.homebase_onoff === 1 ? true : false) : (booleanProperty.default !== undefined ? booleanProperty.default : false);
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnoozeHomebase Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceSnoozeMotion: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined && value.motion_notify_onoff !== undefined ? (value.motion_notify_onoff === 1 ? true : false) : (booleanProperty.default !== undefined ? booleanProperty.default : false);
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnoozeMotion Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                    case types_1.PropertyName.DeviceSnoozeChime: {
                        const booleanProperty = property;
                        try {
                            return value !== undefined && value.chime_onoff !== undefined ? (value.chime_onoff === 1 ? true : false) : (booleanProperty.default !== undefined ? booleanProperty.default : false);
                        }
                        catch (error) {
                            this.log.error("Convert CMD_SET_SNOOZE_MODE DeviceSnoozeChime Error:", { property: property, value: value, error: error });
                            return booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    }
                }
            }
            else if ((property.name === types_1.PropertyName.DeviceMotionDetectionTypeHuman ||
                property.name === types_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition ||
                property.name === types_1.PropertyName.DeviceMotionDetectionTypePet ||
                property.name === types_1.PropertyName.DeviceMotionDetectionTypeVehicle ||
                property.name === types_1.PropertyName.DeviceMotionDetectionTypeAllOtherMotions) && this.getStationSerial().startsWith("T8030")) {
                const booleanProperty = property;
                try {
                    return (0, utils_1.isHB3DetectionModeEnabled)(Number.parseInt(value), property.name === types_1.PropertyName.DeviceMotionDetectionTypeHuman ? types_1.HB3DetectionTypes.HUMAN_DETECTION : property.name === types_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition ? types_1.HB3DetectionTypes.HUMAN_RECOGNITION : property.name === types_1.PropertyName.DeviceMotionDetectionTypePet ? types_1.HB3DetectionTypes.PET_DETECTION : property.name === types_1.PropertyName.DeviceMotionDetectionTypeVehicle ? types_1.HB3DetectionTypes.VEHICLE_DETECTION : types_1.HB3DetectionTypes.ALL_OTHER_MOTION);
                }
                catch (error) {
                    this.log.error("Convert HB3 motion detection type Error:", { property: property, value: value, error: error });
                    return booleanProperty.default !== undefined ? booleanProperty.default : false;
                }
            }
            else if (property.key === types_2.CommandType.CELLULAR_INFO) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceCellularSignal: {
                        const stringProperty = property;
                        return value !== undefined && value.Signal !== undefined ? String(value.Signal) : (stringProperty.default !== undefined ? stringProperty.default : "");
                    }
                    case types_1.PropertyName.DeviceCellularBand: {
                        const stringProperty = property;
                        return value !== undefined && value.band !== undefined ? String(value.band) : (stringProperty.default !== undefined ? stringProperty.default : "");
                    }
                    case types_1.PropertyName.DeviceCellularIMEI: {
                        const stringProperty = property;
                        return value !== undefined && value.imei !== undefined ? String(value.imei) : (stringProperty.default !== undefined ? stringProperty.default : "");
                    }
                    case types_1.PropertyName.DeviceCellularICCID: {
                        const stringProperty = property;
                        return value !== undefined && value.iccid !== undefined ? String(value.iccid) : (stringProperty.default !== undefined ? stringProperty.default : "");
                    }
                }
            }
            else if (property.type === "number") {
                const numericProperty = property;
                try {
                    return value !== undefined ? Number.parseInt(value) : (numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0));
                }
                catch (error) {
                    this.log.warn("PropertyMetadataNumeric Convert Error:", { property: property, value: value, error: error });
                    return numericProperty.default !== undefined ? numericProperty.default : (numericProperty.min !== undefined ? numericProperty.min : 0);
                }
            }
            else if (property.type === "boolean") {
                const booleanProperty = property;
                try {
                    return value !== undefined ? (value === "1" || value.toLowerCase() === "true" ? true : false) : (booleanProperty.default !== undefined ? booleanProperty.default : false);
                }
                catch (error) {
                    this.log.warn("PropertyMetadataBoolean Convert Error:", { property: property, value: value, error: error });
                    return booleanProperty.default !== undefined ? booleanProperty.default : false;
                }
            }
            else if (property.type === "string") {
                const stringProperty = property;
                return value !== undefined ? value : (stringProperty.default !== undefined ? stringProperty.default : "");
            }
            else if (property.type === "object") {
                const objectProperty = property;
                return value !== undefined ? value : (objectProperty.default !== undefined ? objectProperty.default : undefined);
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return value;
    }
    getPropertyMetadata(name, hidden = false) {
        const property = this.getPropertiesMetadata(hidden)[name];
        if (property !== undefined)
            return property;
        throw new error_1.InvalidPropertyError(`Property ${name} invalid`);
    }
    getPropertyValue(name) {
        return this.properties[name];
    }
    hasPropertyValue(name) {
        return this.getPropertyValue(name) !== undefined;
    }
    getRawProperty(type) {
        return this.rawProperties[type];
    }
    getRawProperties() {
        return this.rawProperties;
    }
    getProperties() {
        const result = {};
        for (const property of Object.keys(this.properties)) {
            if (!property.startsWith("hidden-"))
                result[property] = this.properties[property];
        }
        return result;
    }
    getPropertiesMetadata(hidden = false) {
        let metadata = {
            ...types_1.DeviceProperties[this.getDeviceType()]
        };
        if (this.isFloodLightT8420X()) {
            metadata = {
                ...types_1.FloodlightT8420XDeviceProperties
            };
        }
        else if (this.isWiredDoorbellT8200X()) {
            metadata = {
                ...types_1.WiredDoorbellT8200XDeviceProperties
            };
        }
        if (this.getStationSerial().startsWith("T8030") && metadata[types_1.PropertyName.DeviceMotionDetectionType] !== undefined && this.isCamera()) {
            const newMetadata = {
                ...metadata
            };
            delete newMetadata[types_1.PropertyName.DeviceMotionDetectionType];
            delete newMetadata[types_1.PropertyName.DeviceLastChargingDays];
            delete newMetadata[types_1.PropertyName.DeviceLastChargingFalseEvents];
            delete newMetadata[types_1.PropertyName.DeviceLastChargingRecordedEvents];
            delete newMetadata[types_1.PropertyName.DeviceLastChargingTotalEvents];
            delete newMetadata[types_1.PropertyName.DeviceBatteryUsageLastWeek];
            newMetadata[types_1.PropertyName.DeviceMotionDetectionTypeHuman] = types_1.DeviceMotionHB3DetectionTypeHumanProperty;
            newMetadata[types_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition] = types_1.DeviceMotionHB3DetectionTypeHumanRecognitionProperty;
            newMetadata[types_1.PropertyName.DeviceMotionDetectionTypePet] = types_1.DeviceMotionHB3DetectionTypePetProperty;
            newMetadata[types_1.PropertyName.DeviceMotionDetectionTypeVehicle] = types_1.DeviceMotionHB3DetectionTypeVehicleProperty;
            newMetadata[types_1.PropertyName.DeviceMotionDetectionTypeAllOtherMotions] = types_1.DeviceMotionHB3DetectionTypeAllOhterMotionsProperty;
            newMetadata[types_1.PropertyName.DevicePersonDetected] = types_1.DevicePersonDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceMotionDetected] = types_1.DeviceMotionDetectedProperty;
            newMetadata[types_1.PropertyName.DevicePetDetected] = types_1.DevicePetDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceSoundDetected] = types_1.DeviceSoundDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceCryingDetected] = types_1.DeviceCryingDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceIdentityPersonDetected] = types_1.DeviceIdentityPersonDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceStrangerPersonDetected] = types_1.DeviceStrangerPersonDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceVehicleDetected] = types_1.DeviceVehicleDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceDogDetected] = types_1.DeviceDogDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceDogLickDetected] = types_1.DeviceDogLickDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceDogPoopDetected] = types_1.DeviceDogPoopDetectedProperty;
            newMetadata[types_1.PropertyName.DeviceDetectionStatisticsWorkingDays] = types_1.DeviceDetectionStatisticsWorkingDaysProperty;
            newMetadata[types_1.PropertyName.DeviceDetectionStatisticsDetectedEvents] = types_1.DeviceDetectionStatisticsDetectedEventsProperty;
            newMetadata[types_1.PropertyName.DeviceDetectionStatisticsRecordedEvents] = types_1.DeviceDetectionStatisticsRecordedEventsProperty;
            //TODO: Check with future devices if this property overriding is correct (for example with indoor cameras etc.)
            newMetadata[types_1.PropertyName.DeviceEnabled] = types_1.DeviceEnabledSoloProperty;
            metadata = newMetadata;
        }
        else if (Object.keys(metadata).length === 0) {
            metadata = {
                ...types_1.GenericDeviceProperties
            };
        }
        if (!hidden) {
            for (const property of Object.keys(metadata)) {
                if (property.startsWith("hidden-"))
                    delete metadata[property];
            }
        }
        return metadata;
    }
    hasProperty(name, hidden = false) {
        return this.getPropertiesMetadata(hidden)[name] !== undefined;
    }
    getCommands() {
        const commands = types_1.DeviceCommands[this.getDeviceType()];
        if (commands === undefined)
            return [];
        return commands;
    }
    hasCommand(name) {
        return this.getCommands().includes(name);
    }
    processPushNotification(_message, _eventDurationSeconds) {
        // Nothing to do
    }
    setCustomPropertyValue(name, value) {
        const metadata = this.getPropertyMetadata(name);
        if (typeof metadata.key === "string" && metadata.key.startsWith("custom_")) {
            this.updateProperty(name, value);
        }
    }
    destroy() {
        this.eventTimeouts.forEach((timeout) => {
            clearTimeout(timeout);
        });
        this.eventTimeouts.clear();
    }
    clearEventTimeout(eventType) {
        const timeout = this.eventTimeouts.get(eventType);
        if (timeout !== undefined) {
            clearTimeout(timeout);
            this.eventTimeouts.delete(eventType);
        }
    }
    static isCamera(type) {
        if (type == types_1.DeviceType.CAMERA ||
            type == types_1.DeviceType.CAMERA2 ||
            type == types_1.DeviceType.CAMERA_E ||
            type == types_1.DeviceType.CAMERA2C ||
            type == types_1.DeviceType.INDOOR_CAMERA ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            type == types_1.DeviceType.FLOODLIGHT ||
            type == types_1.DeviceType.DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.BATTERY_DOORBELL_PLUS ||
            type == types_1.DeviceType.DOORBELL_SOLO ||
            type == types_1.DeviceType.CAMERA2C_PRO ||
            type == types_1.DeviceType.CAMERA2_PRO ||
            type == types_1.DeviceType.CAMERA3 ||
            type == types_1.DeviceType.CAMERA3C ||
            type == types_1.DeviceType.INDOOR_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA ||
            type == types_1.DeviceType.SOLO_CAMERA_PRO ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K ||
            type == types_1.DeviceType.INDOOR_COST_DOWN_CAMERA ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8422 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8423 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8424 ||
            type == types_1.DeviceType.WALL_LIGHT_CAM ||
            type == types_1.DeviceType.WALL_LIGHT_CAM_81A0 ||
            type == types_1.DeviceType.CAMERA_GARAGE_T8453_COMMON ||
            type == types_1.DeviceType.CAMERA_GARAGE_T8453 ||
            type == types_1.DeviceType.CAMERA_GARAGE_T8452)
            return true;
        return false;
    }
    static hasBattery(type) {
        if (type == types_1.DeviceType.CAMERA ||
            type == types_1.DeviceType.CAMERA2 ||
            type == types_1.DeviceType.CAMERA_E ||
            type == types_1.DeviceType.CAMERA2C ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.BATTERY_DOORBELL_PLUS ||
            type == types_1.DeviceType.CAMERA2C_PRO ||
            type == types_1.DeviceType.CAMERA2_PRO ||
            type == types_1.DeviceType.CAMERA3 ||
            type == types_1.DeviceType.CAMERA3C ||
            type == types_1.DeviceType.SOLO_CAMERA ||
            type == types_1.DeviceType.SOLO_CAMERA_PRO ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K ||
            type == types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR ||
            type == types_1.DeviceType.LOCK_WIFI ||
            type == types_1.DeviceType.LOCK_WIFI_NO_FINGER ||
            type == types_1.DeviceType.LOCK_8503 ||
            type == types_1.DeviceType.LOCK_8504 ||
            type == types_1.DeviceType.LOCK_8530 ||
            type == types_1.DeviceType.LOCK_8592 ||
            type == types_1.DeviceType.LOCK_85A3 ||
            type == types_1.DeviceType.SMART_SAFE_7400 ||
            type == types_1.DeviceType.SMART_SAFE_7401 ||
            type == types_1.DeviceType.SMART_SAFE_7402 ||
            type == types_1.DeviceType.SMART_SAFE_7403 ||
            type == types_1.DeviceType.CAMERA_FG ||
            type == types_1.DeviceType.WALL_LIGHT_CAM_81A0)
            //TODO: Add other battery devices
            return true;
        return false;
    }
    static isStation(type) {
        if (type == types_1.DeviceType.STATION)
            return true;
        return false;
    }
    static isSensor(type) {
        if (type == types_1.DeviceType.SENSOR ||
            type == types_1.DeviceType.MOTION_SENSOR)
            return true;
        return false;
    }
    static isKeyPad(type) {
        return types_1.DeviceType.KEYPAD == type;
    }
    static isDoorbell(type) {
        if (type == types_1.DeviceType.DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.BATTERY_DOORBELL_PLUS ||
            type == types_1.DeviceType.DOORBELL_SOLO)
            return true;
        return false;
    }
    static isWiredDoorbell(type) {
        if (type == types_1.DeviceType.DOORBELL)
            return true;
        return false;
    }
    static isWiredDoorbellT8200X(type, serialnumber) {
        if (type == types_1.DeviceType.DOORBELL && serialnumber.startsWith("T8200") && serialnumber.length > 7 && serialnumber.charAt(6) === "6")
            return true;
        return false;
    }
    static isWiredDoorbellDual(type) {
        if (type == types_1.DeviceType.DOORBELL_SOLO)
            return true;
        return false;
    }
    static isIndoorCamera(type) {
        if (type == types_1.DeviceType.INDOOR_CAMERA ||
            type == types_1.DeviceType.INDOOR_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT ||
            type == types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K ||
            type == types_1.DeviceType.INDOOR_COST_DOWN_CAMERA)
            return true;
        return false;
    }
    static isPanAndTiltCamera(type) {
        if (type == types_1.DeviceType.INDOOR_PT_CAMERA ||
            type == types_1.DeviceType.INDOOR_PT_CAMERA_1080 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8423 ||
            type == types_1.DeviceType.INDOOR_COST_DOWN_CAMERA)
            return true;
        return false;
    }
    static isFloodLight(type) {
        if (type == types_1.DeviceType.FLOODLIGHT ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8422 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8423 ||
            type == types_1.DeviceType.FLOODLIGHT_CAMERA_8424)
            return true;
        return false;
    }
    static isFloodLightT8420X(type, serialnumber) {
        if (type == types_1.DeviceType.FLOODLIGHT && serialnumber.startsWith("T8420") && serialnumber.length > 7 && serialnumber.charAt(6) === "6")
            return true;
        return false;
    }
    static isWallLightCam(type) {
        if (type == types_1.DeviceType.WALL_LIGHT_CAM || type == types_1.DeviceType.WALL_LIGHT_CAM_81A0)
            return true;
        return false;
    }
    static isLock(type) {
        return Device.isLockBle(type) ||
            Device.isLockWifi(type) ||
            Device.isLockBleNoFinger(type) ||
            Device.isLockWifiNoFinger(type) ||
            Device.isLockWifiR10(type) ||
            Device.isLockWifiR20(type) ||
            Device.isLockWifiVideo(type);
    }
    static isLockKeypad(type) {
        return Device.isLockWifiR10Keypad(type);
    }
    static isLockBle(type) {
        return types_1.DeviceType.LOCK_BLE == type;
    }
    static isLockBleNoFinger(type) {
        return types_1.DeviceType.LOCK_BLE_NO_FINGER == type;
    }
    static isLockWifi(type) {
        return types_1.DeviceType.LOCK_WIFI == type;
    }
    static isLockWifiNoFinger(type) {
        return types_1.DeviceType.LOCK_WIFI_NO_FINGER == type;
    }
    static isLockWifiR10(type) {
        return types_1.DeviceType.LOCK_8503 == type;
    }
    static isLockWifiR20(type) {
        return types_1.DeviceType.LOCK_8504 == type /*|| DeviceType.LOCK_8592 == type*/;
    }
    static isLockWifiVideo(type) {
        return types_1.DeviceType.LOCK_8530 == type;
    }
    static isLockWifiR10Keypad(type) {
        return types_1.DeviceType.LOCK_85A3 == type;
    }
    static isBatteryDoorbell1(type) {
        return types_1.DeviceType.BATTERY_DOORBELL == type;
    }
    static isBatteryDoorbell2(type) {
        return types_1.DeviceType.BATTERY_DOORBELL_2 == type;
    }
    static isBatteryDoorbellDual(type) {
        return types_1.DeviceType.BATTERY_DOORBELL_PLUS == type;
    }
    static isDoorbellDual(type) {
        return types_1.DeviceType.DOORBELL_SOLO == type;
    }
    static isBatteryDoorbell(type) {
        if (type == types_1.DeviceType.BATTERY_DOORBELL ||
            type == types_1.DeviceType.BATTERY_DOORBELL_2 ||
            type == types_1.DeviceType.BATTERY_DOORBELL_PLUS)
            return true;
        return false;
    }
    static isSoloCamera(type) {
        return types_1.DeviceType.SOLO_CAMERA == type;
    }
    static isSoloCameraPro(type) {
        return types_1.DeviceType.SOLO_CAMERA_PRO == type;
    }
    static isSoloCameraSpotlight1080(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_1080 == type;
    }
    static isSoloCameraSpotlight2k(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_2K == type;
    }
    static isSoloCameraSpotlightSolar(type) {
        return types_1.DeviceType.SOLO_CAMERA_SPOTLIGHT_SOLAR == type;
    }
    static isSoloCameras(type) {
        return Device.isSoloCamera(type) ||
            Device.isSoloCameraPro(type) ||
            Device.isSoloCameraSpotlight1080(type) ||
            Device.isSoloCameraSpotlight2k(type) ||
            Device.isSoloCameraSpotlightSolar(type);
    }
    static isStarlight4GLTE(type) {
        return types_1.DeviceType.CAMERA_FG == type;
    }
    static isIndoorOutdoorCamera1080p(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P == type;
    }
    static isIndoorOutdoorCamera1080pNoLight(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_1080P_NO_LIGHT == type;
    }
    static isIndoorOutdoorCamera2k(type) {
        return types_1.DeviceType.INDOOR_OUTDOOR_CAMERA_2K == type;
    }
    static isIndoorCamMini(type) {
        return types_1.DeviceType.INDOOR_COST_DOWN_CAMERA == type;
    }
    static isCamera2(type) {
        //T8114
        return types_1.DeviceType.CAMERA2 == type;
    }
    static isCamera2C(type) {
        //T8113
        return types_1.DeviceType.CAMERA2C == type;
    }
    static isCamera2Pro(type) {
        //T8140
        return types_1.DeviceType.CAMERA2_PRO == type;
    }
    static isCamera2CPro(type) {
        //T8142
        return types_1.DeviceType.CAMERA2C_PRO == type;
    }
    static isCamera2Product(type) {
        return Device.isCamera2(type) || Device.isCamera2C(type) || Device.isCamera2Pro(type) || Device.isCamera2CPro(type);
    }
    static isCamera3(type) {
        return types_1.DeviceType.CAMERA3 == type;
    }
    static isCamera3C(type) {
        return types_1.DeviceType.CAMERA3C == type;
    }
    static isCamera3Product(type) {
        return Device.isCamera3(type) || Device.isCamera3C(type);
    }
    static isEntrySensor(type) {
        //T8900
        return types_1.DeviceType.SENSOR == type;
    }
    static isMotionSensor(type) {
        return types_1.DeviceType.MOTION_SENSOR == type;
    }
    static isSmartDrop(type) {
        return types_1.DeviceType.SMART_DROP == type;
    }
    static isSmartSafe(type) {
        if (type == types_1.DeviceType.SMART_SAFE_7400 ||
            type == types_1.DeviceType.SMART_SAFE_7401 ||
            type == types_1.DeviceType.SMART_SAFE_7402 ||
            type == types_1.DeviceType.SMART_SAFE_7403)
            return true;
        return false;
    }
    static isGarageCamera(type) {
        if (type == types_1.DeviceType.CAMERA_GARAGE_T8452 ||
            type == types_1.DeviceType.CAMERA_GARAGE_T8453 ||
            type == types_1.DeviceType.CAMERA_GARAGE_T8453_COMMON)
            return true;
        return false;
    }
    static isIntegratedDeviceBySn(sn) {
        return sn.startsWith("T8420") ||
            sn.startsWith("T820") ||
            sn.startsWith("T8410") ||
            sn.startsWith("T8400") ||
            sn.startsWith("T8401") ||
            sn.startsWith("T8411") ||
            sn.startsWith("T8414") ||
            sn.startsWith("T8130") ||
            sn.startsWith("T8131") ||
            sn.startsWith("T8422") ||
            sn.startsWith("T8423") ||
            sn.startsWith("T8424") ||
            sn.startsWith("T8440") ||
            sn.startsWith("T8441") ||
            sn.startsWith("T8442");
    }
    static isSoloCameraBySn(sn) {
        return sn.startsWith("T8130") ||
            sn.startsWith("T8131") ||
            sn.startsWith("T8122") ||
            sn.startsWith("T8123") ||
            sn.startsWith("T8124");
    }
    isCamera() {
        return Device.isCamera(this.rawDevice.device_type);
    }
    isFloodLight() {
        return Device.isFloodLight(this.rawDevice.device_type);
    }
    isFloodLightT8420X() {
        return Device.isFloodLightT8420X(this.rawDevice.device_type, this.rawDevice.device_sn);
    }
    isWallLightCam() {
        return Device.isWallLightCam(this.rawDevice.device_type);
    }
    isDoorbell() {
        return Device.isDoorbell(this.rawDevice.device_type);
    }
    isWiredDoorbell() {
        return Device.isWiredDoorbell(this.rawDevice.device_type);
    }
    isWiredDoorbellT8200X() {
        return Device.isWiredDoorbellT8200X(this.rawDevice.device_type, this.rawDevice.device_sn);
    }
    isWiredDoorbellDual() {
        return Device.isWiredDoorbellDual(this.rawDevice.device_type);
    }
    isLock() {
        return Device.isLock(this.rawDevice.device_type);
    }
    isLockKeypad() {
        return Device.isLockKeypad(this.rawDevice.device_type);
    }
    isLockBle() {
        return Device.isLockBle(this.rawDevice.device_type);
    }
    isLockBleNoFinger() {
        return Device.isLockBleNoFinger(this.rawDevice.device_type);
    }
    isLockWifi() {
        return Device.isLockWifi(this.rawDevice.device_type);
    }
    isLockWifiNoFinger() {
        return Device.isLockWifiNoFinger(this.rawDevice.device_type);
    }
    isLockWifiR10() {
        return Device.isLockWifiR10(this.rawDevice.device_type);
    }
    isLockWifiR20() {
        return Device.isLockWifiR20(this.rawDevice.device_type);
    }
    isLockWifiVideo() {
        return Device.isLockWifiVideo(this.rawDevice.device_type);
    }
    isLockWifiR10Keypad() {
        return Device.isLockWifiR10Keypad(this.rawDevice.device_type);
    }
    isBatteryDoorbell1() {
        return Device.isBatteryDoorbell1(this.rawDevice.device_type);
    }
    isBatteryDoorbell2() {
        return Device.isBatteryDoorbell2(this.rawDevice.device_type);
    }
    isBatteryDoorbellDual() {
        return Device.isBatteryDoorbellDual(this.rawDevice.device_type);
    }
    isDoorbellDual() {
        return Device.isDoorbellDual(this.rawDevice.device_type);
    }
    isBatteryDoorbell() {
        return Device.isBatteryDoorbell(this.rawDevice.device_type);
    }
    isSoloCamera() {
        return Device.isSoloCamera(this.rawDevice.device_type);
    }
    isSoloCameraPro() {
        return Device.isSoloCameraPro(this.rawDevice.device_type);
    }
    isSoloCameraSpotlight1080() {
        return Device.isSoloCameraSpotlight1080(this.rawDevice.device_type);
    }
    isSoloCameraSpotlight2k() {
        return Device.isSoloCameraSpotlight2k(this.rawDevice.device_type);
    }
    isSoloCameraSpotlightSolar() {
        return Device.isSoloCameraSpotlightSolar(this.rawDevice.device_type);
    }
    isStarlight4GLTE() {
        return Device.isStarlight4GLTE(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera1080p() {
        return Device.isIndoorOutdoorCamera1080p(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera1080pNoLight() {
        return Device.isIndoorOutdoorCamera1080pNoLight(this.rawDevice.device_type);
    }
    isIndoorOutdoorCamera2k() {
        return Device.isIndoorOutdoorCamera2k(this.rawDevice.device_type);
    }
    isIndoorCamMini() {
        return Device.isIndoorCamMini(this.rawDevice.device_type);
    }
    isSoloCameras() {
        return Device.isSoloCameras(this.rawDevice.device_type);
    }
    isCamera2() {
        return Device.isCamera2(this.rawDevice.device_type);
    }
    isCamera2C() {
        return Device.isCamera2C(this.rawDevice.device_type);
    }
    isCamera2Pro() {
        return Device.isCamera2Pro(this.rawDevice.device_type);
    }
    isCamera2CPro() {
        return Device.isCamera2CPro(this.rawDevice.device_type);
    }
    isCamera2Product() {
        return Device.isCamera2Product(this.rawDevice.device_type);
    }
    isCamera3() {
        return Device.isCamera3(this.rawDevice.device_type);
    }
    isCamera3C() {
        return Device.isCamera3C(this.rawDevice.device_type);
    }
    isCamera3Product() {
        return Device.isCamera3Product(this.rawDevice.device_type);
    }
    isEntrySensor() {
        return Device.isEntrySensor(this.rawDevice.device_type);
    }
    isKeyPad() {
        return Device.isKeyPad(this.rawDevice.device_type);
    }
    isMotionSensor() {
        return Device.isMotionSensor(this.rawDevice.device_type);
    }
    isIndoorCamera() {
        return Device.isIndoorCamera(this.rawDevice.device_type);
    }
    isPanAndTiltCamera() {
        return Device.isPanAndTiltCamera(this.rawDevice.device_type);
    }
    isSmartDrop() {
        return Device.isSmartDrop(this.rawDevice.device_type);
    }
    isSmartSafe() {
        return Device.isSmartSafe(this.rawDevice.device_type);
    }
    isGarageCamera() {
        return Device.isGarageCamera(this.rawDevice.device_type);
    }
    isIntegratedDevice() {
        if (this.isLock() || this.isSmartDrop()) {
            return this.rawDevice.device_sn === this.rawDevice.station_sn;
        }
        return this.isWiredDoorbellDual() || this.isFloodLight() || this.isWiredDoorbell() || this.isIndoorCamera() || this.isSoloCameras() || this.isWallLightCam();
    }
    hasBattery() {
        return Device.hasBattery(this.rawDevice.device_type);
    }
    getDeviceKey() {
        return this.rawDevice.station_sn + this.rawDevice.device_channel;
    }
    getDeviceType() {
        return this.rawDevice.device_type;
    }
    getHardwareVersion() {
        return this.rawDevice.main_hw_version;
    }
    getSoftwareVersion() {
        return this.rawDevice.main_sw_version;
    }
    getModel() {
        return this.rawDevice.device_model;
    }
    getName() {
        return this.rawDevice.device_name;
    }
    getSerial() {
        return this.rawDevice.device_sn;
    }
    getStationSerial() {
        return this.rawDevice.station_sn;
    }
    async setParameters(params) {
        return this.api.setParameters(this.rawDevice.station_sn, this.rawDevice.device_sn, params);
    }
    getChannel() {
        return this.rawDevice.device_channel;
    }
    getStateID(state, level = 2) {
        switch (level) {
            case 0:
                return `${this.getStationSerial()}.${this.getStateChannel()}`;
            case 1:
                return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}`;
            default:
                if (state)
                    return `${this.getStationSerial()}.${this.getStateChannel()}.${this.getSerial()}.${state}`;
                throw new Error("No state value passed.");
        }
    }
    getStateChannel() {
        return "devices";
    }
    getWifiRssi() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiRSSI);
    }
    getStoragePath(filename) {
        return (0, utils_1.getAbsoluteFilePath)(this.rawDevice.device_type, this.rawDevice.device_channel, filename);
    }
    isEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceEnabled);
    }
}
exports.Device = Device;
class Camera extends Device {
    constructor(api, device) {
        super(api, device);
        this._isStreaming = false;
        this.properties[types_1.PropertyName.DeviceMotionDetected] = false;
        this.properties[types_1.PropertyName.DevicePersonDetected] = false;
        this.properties[types_1.PropertyName.DevicePersonName] = "";
    }
    static async getInstance(api, device) {
        return new Camera(api, device);
    }
    getStateChannel() {
        return "cameras";
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD:
                    return value !== undefined ? (value === "0" ? true : false) : false;
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    getLastCameraImageURL() {
        return this.getPropertyValue(types_1.PropertyName.DevicePictureUrl);
    }
    getMACAddress() {
        return this.rawDevice.wifi_mac;
    }
    async startDetection() {
        // Start camera detection.
        await this.setParameters([{ paramType: types_1.ParamType.DETECT_SWITCH, paramValue: 1 }]).catch(error => {
            this.log.error("Error:", error);
        });
    }
    async startStream() {
        // Start the camera stream and return the RTSP URL.
        try {
            const response = await this.api.request({
                method: "post",
                endpoint: "v2/web/equipment/start_stream",
                data: {
                    device_sn: this.rawDevice.device_sn,
                    station_sn: this.rawDevice.station_sn,
                    proto: 2
                }
            }).catch(error => {
                this.log.error("Error:", error);
                return error;
            });
            this.log.debug("Response:", response.data);
            if (response.status == 200) {
                const result = response.data;
                if (result.code == 0) {
                    const dataresult = this.api.decryptAPIData(result.data);
                    this._isStreaming = true;
                    this.log.info(`Livestream of camera ${this.rawDevice.device_sn} started`);
                    //rtmp://p2p-vir-7.eufylife.com/hls/REDACTED==?time=1649675937&token=REDACTED
                    return `rtmp://${dataresult.domain}/hls/${dataresult.stream_name}==?time=${dataresult.time}&token=${dataresult.token}`;
                }
                else {
                    this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                }
            }
            else {
                this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
            }
        }
        catch (error) {
            this.log.error("Generic Error:", error);
        }
        return "";
    }
    async stopDetection() {
        // Stop camera detection.
        await this.setParameters([{ paramType: types_1.ParamType.DETECT_SWITCH, paramValue: 0 }]);
    }
    async stopStream() {
        // Stop the camera stream.
        try {
            const response = await this.api.request({
                method: "post",
                endpoint: "v2/web/equipment/stop_stream",
                data: {
                    device_sn: this.rawDevice.device_sn,
                    station_sn: this.rawDevice.station_sn,
                    proto: 2
                }
            }).catch(error => {
                this.log.error("Error:", error);
                return error;
            });
            this.log.debug("Response:", response.data);
            if (response.status == 200) {
                const result = response.data;
                if (result.code == 0) {
                    this._isStreaming = false;
                    this.log.info(`Livestream of camera ${this.rawDevice.device_sn} stopped`);
                }
                else {
                    this.log.error("Response code not ok", { code: result.code, msg: result.msg });
                }
            }
            else {
                this.log.error("Status return code not 200", { status: response.status, statusText: response.statusText });
            }
        }
        catch (error) {
            this.log.error("Generic Error:", error);
        }
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    isStreaming() {
        return this._isStreaming;
    }
    async close() {
        //TODO: Stop other things if implemented such as detection feature
        if (this._isStreaming)
            await this.stopStream().catch();
    }
    getLastChargingDays() {
        return this.rawDevice.charging_days;
    }
    getLastChargingFalseEvents() {
        return this.rawDevice.charging_missing;
    }
    getLastChargingRecordedEvents() {
        return this.rawDevice.charging_reserve;
    }
    getLastChargingTotalEvents() {
        return this.rawDevice.charing_total;
    }
    getBatteryValue() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBattery);
    }
    getBatteryTemperature() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryTemp);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isAutoNightVisionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAutoNightvision);
    }
    isRTSPStreamEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceRTSPStream);
    }
    isAntiTheftDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAntitheftDetection);
    }
    getWatermark() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWatermark);
    }
    isMotionDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected);
    }
    isPersonDetected() {
        return this.getPropertyValue(types_1.PropertyName.DevicePersonDetected);
    }
    getDetectedPerson() {
        return this.getPropertyValue(types_1.PropertyName.DevicePersonName);
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DevicePersonDetected ||
            metadata.name === types_1.PropertyName.DeviceIdentityPersonDetected ||
            metadata.name === types_1.PropertyName.DeviceStrangerPersonDetected) {
            this.emit("person detected", this, newValue, this.getPropertyValue(types_1.PropertyName.DevicePersonName));
            if (metadata.name === types_1.PropertyName.DeviceStrangerPersonDetected)
                this.emit("stranger person detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceMotionDetected) {
            this.emit("motion detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceCryingDetected) {
            this.emit("crying detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceDogDetected) {
            this.emit("dog detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceDogLickDetected) {
            this.emit("dog lick detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceDogPoopDetected) {
            this.emit("dog poop detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DevicePetDetected) {
            this.emit("pet detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceSoundDetected) {
            this.emit("sound detected", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceVehicleDetected) {
            this.emit("vehicle detected", this, newValue);
        }
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === types_3.CusPushEvent.SECURITY && message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                            }
                        }).catch((error) => {
                            this.log.debug(`CusPushEvent.SECURITY - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    if (message.fetch_id !== undefined) {
                        // Person or someone identified
                        this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                        this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                        this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                        this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                            this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                            this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                        }, eventDurationSeconds * 1000));
                    }
                    else {
                        // Motion detected
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                        this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                        this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                            this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                        }, eventDurationSeconds * 1000));
                    }
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.SECURITY - Device: ${message.device_sn} Error:`, error);
                }
            }
            else if (message.msg_type === types_1.DeviceType.HB3) {
                if (message.device_sn === this.getSerial()) {
                    try {
                        if (!(0, utils_3.isEmpty)(message.pic_url)) {
                            (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                                if (image.data.length > 0) {
                                    this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                                }
                            }).catch((error) => {
                                this.log.debug(`HB3PairedDevicePushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                            });
                        }
                        switch (message.event_type) {
                            case types_3.HB3PairedDevicePushEvent.MOTION_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.FACE_DETECTION:
                                this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                    this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.CRYING_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceCryingDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.CryingDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.CryingDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceCryingDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.CryingDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.DOG_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceDogDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.DogDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.DogDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceDogDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.DogDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.DOG_LICK_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceDogLickDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.DogLickDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.DogLickDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceDogLickDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.DogLickDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.DOG_POOP_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceDogPoopDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.DogPoopDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.DogPoopDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceDogPoopDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.DogPoopDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.PET_DETECTION:
                                this.updateProperty(types_1.PropertyName.DevicePetDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.PetDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.PetDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DevicePetDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.PetDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.SOUND_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceSoundDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.SoundDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.SoundDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceSoundDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.SoundDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.VEHICLE_DETECTION:
                                this.updateProperty(types_1.PropertyName.DeviceVehicleDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.VehicleDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.VehicleDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DeviceVehicleDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.VehicleDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.IDENTITY_PERSON_DETECTION:
                                this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                                this.updateProperty(types_1.PropertyName.DeviceIdentityPersonDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.IdentityPersonDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.IdentityPersonDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                    this.updateProperty(types_1.PropertyName.DeviceIdentityPersonDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.IdentityPersonDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            case types_3.HB3PairedDevicePushEvent.STRANGER_PERSON_DETECTION:
                                this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                                this.updateProperty(types_1.PropertyName.DeviceStrangerPersonDetected, true);
                                this.clearEventTimeout(types_1.DeviceEvent.StrangerPersonDetected);
                                this.eventTimeouts.set(types_1.DeviceEvent.StrangerPersonDetected, setTimeout(async () => {
                                    this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                    this.updateProperty(types_1.PropertyName.DeviceStrangerPersonDetected, false);
                                    this.eventTimeouts.delete(types_1.DeviceEvent.StrangerPersonDetected);
                                }, eventDurationSeconds * 1000));
                                break;
                            default:
                                this.log.debug("Unhandled homebase3 camera push event", message);
                                break;
                        }
                    }
                    catch (error) {
                        this.log.debug(`HB3PairedDevicePushEvent - Device: ${message.device_sn} Error:`, error);
                    }
                }
            }
        }
    }
}
exports.Camera = Camera;
class SoloCamera extends Camera {
    static async getInstance(api, device) {
        return new SoloCamera(api, device);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined && message.msg_type !== types_1.DeviceType.HB3) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                            }
                        }).catch((error) => {
                            this.log.debug(`SoloPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled solo camera push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`SoloPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.SoloCamera = SoloCamera;
class IndoorCamera extends Camera {
    constructor(api, device) {
        super(api, device);
        this.properties[types_1.PropertyName.DevicePetDetected] = false;
        this.properties[types_1.PropertyName.DeviceSoundDetected] = false;
        this.properties[types_1.PropertyName.DeviceCryingDetected] = false;
    }
    static async getInstance(api, device) {
        return new IndoorCamera(api, device);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    isPetDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DevicePetDetection);
    }
    isSoundDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSoundDetection);
    }
    isPetDetected() {
        return this.getPropertyValue(types_1.PropertyName.DevicePetDetected);
    }
    isSoundDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSoundDetected);
    }
    isCryingDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceCryingDetected);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined && message.msg_type !== types_1.DeviceType.HB3) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                            }
                        }).catch((error) => {
                            this.log.debug(`IndoorPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.CRYING_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceCryingDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.CryingDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.CryingDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceCryingDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.CryingDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.SOUND_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceSoundDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.SoundDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.SoundDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceSoundDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.SoundDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.PET_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePetDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PetDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PetDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePetDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PetDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled indoor camera push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`IndoorPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
    destroy() {
        super.destroy();
    }
}
exports.IndoorCamera = IndoorCamera;
class DoorbellCamera extends Camera {
    constructor(api, device, voices) {
        super(api, device);
        this.voices = voices;
        this.properties[types_1.PropertyName.DeviceRinging] = false;
    }
    static async getInstance(api, device) {
        const voices = await api.getVoices(device.device_sn);
        return new DoorbellCamera(api, device, voices);
    }
    loadMetadataVoiceStates(propertyName, metadata) {
        if (metadata[propertyName] !== undefined) {
            const states = {};
            for (const voice of Object.values(this.voices)) {
                states[voice.voice_id] = voice.desc;
            }
            metadata[propertyName].states = states;
        }
        return metadata;
    }
    getVoiceName(id) {
        if (this.voices[id] !== undefined)
            return this.voices[id].desc;
        return "";
    }
    getVoices() {
        return this.voices;
    }
    getPropertiesMetadata(hidden = false) {
        let metadata = super.getPropertiesMetadata(hidden);
        metadata = this.loadMetadataVoiceStates(types_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice, metadata);
        metadata = this.loadMetadataVoiceStates(types_1.PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice, metadata);
        metadata = this.loadMetadataVoiceStates(types_1.PropertyName.DeviceRingAutoResponseVoiceResponseVoice, metadata);
        return metadata;
    }
    isRinging() {
        return this.getPropertyValue(types_1.PropertyName.DeviceRinging);
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DeviceRinging) {
            this.emit("rings", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DevicePackageDelivered) {
            this.emit("package delivered", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DevicePackageStranded) {
            this.emit("package stranded", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DevicePackageTaken) {
            this.emit("package taken", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceSomeoneLoitering) {
            this.emit("someone loitering", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceRadarMotionDetected) {
            this.emit("radar motion detected", this, newValue);
        }
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined && message.msg_type !== types_1.DeviceType.HB3) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                            }
                        }).catch((error) => {
                            this.log.debug(`DoorbellPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.DoorbellPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.FACE_DETECTION:
                        case types_3.DoorbellPushEvent.FAMILY_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.PRESS_DOORBELL:
                            this.updateProperty(types_1.PropertyName.DeviceRinging, true);
                            this.clearEventTimeout(types_1.DeviceEvent.Ringing);
                            this.eventTimeouts.set(types_1.DeviceEvent.Ringing, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceRinging, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.Ringing);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.PACKAGE_DELIVERED:
                            this.updateProperty(types_1.PropertyName.DevicePackageDelivered, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PackageDelivered);
                            this.eventTimeouts.set(types_1.DeviceEvent.PackageDelivered, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePackageDelivered, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PackageDelivered);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.PACKAGE_STRANDED:
                            this.updateProperty(types_1.PropertyName.DevicePackageStranded, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PackageStranded);
                            this.eventTimeouts.set(types_1.DeviceEvent.PackageStranded, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePackageStranded, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PackageStranded);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.PACKAGE_TAKEN:
                            this.updateProperty(types_1.PropertyName.DevicePackageTaken, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PackageTaken);
                            this.eventTimeouts.set(types_1.DeviceEvent.PackageTaken, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePackageTaken, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PackageTaken);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.SOMEONE_LOITERING:
                            this.updateProperty(types_1.PropertyName.DeviceSomeoneLoitering, true);
                            this.clearEventTimeout(types_1.DeviceEvent.SomeoneLoitering);
                            this.eventTimeouts.set(types_1.DeviceEvent.SomeoneLoitering, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceSomeoneLoitering, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.SomeoneLoitering);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.DoorbellPushEvent.RADAR_MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceRadarMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.RadarMotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.RadarMotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceRadarMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.RadarMotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled doorbell push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`DoorbellPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.DoorbellCamera = DoorbellCamera;
class WiredDoorbellCamera extends DoorbellCamera {
    static async getInstance(api, device) {
        const voices = await api.getVoices(device.device_sn);
        return new WiredDoorbellCamera(api, device, voices);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isAutoNightVisionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceAutoNightvision);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
}
exports.WiredDoorbellCamera = WiredDoorbellCamera;
class BatteryDoorbellCamera extends DoorbellCamera {
    static async getInstance(api, device) {
        const voices = await api.getVoices(device.device_sn);
        return new BatteryDoorbellCamera(api, device, voices);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
}
exports.BatteryDoorbellCamera = BatteryDoorbellCamera;
class FloodlightCamera extends Camera {
    static async getInstance(api, device) {
        return new FloodlightCamera(api, device);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_DEV_RECORD_AUTOSTOP:
                    if (this.getDeviceType() === types_1.DeviceType.FLOODLIGHT_CAMERA_8423 || this.getDeviceType() === types_1.DeviceType.FLOODLIGHT)
                        return value !== undefined ? (value === "0" ? true : false) : false;
                    break;
                case types_2.CommandType.CMD_FLOODLIGHT_SET_AUTO_CALIBRATION:
                    if (this.getDeviceType() === types_1.DeviceType.FLOODLIGHT_CAMERA_8423)
                        return value !== undefined ? (value === "0" ? true : false) : false;
                    break;
                case types_2.CommandType.CMD_RECORD_AUDIO_SWITCH:
                    return value !== undefined ? (value === "0" ? true : false) : false;
                case types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD:
                    if (this.getDeviceType() === types_1.DeviceType.FLOODLIGHT_CAMERA_8423)
                        return value !== undefined ? (value === "1" ? true : false) : false;
                    return value !== undefined ? (value === "0" ? true : false) : false;
                case types_2.CommandType.CMD_SET_PIRSENSITIVITY:
                    switch (Number.parseInt(value)) {
                        case types_1.FloodlightMotionTriggeredDistance.MIN:
                            return 1;
                        case types_1.FloodlightMotionTriggeredDistance.LOW:
                            return 2;
                        case types_1.FloodlightMotionTriggeredDistance.MEDIUM:
                            return 3;
                        case types_1.FloodlightMotionTriggeredDistance.HIGH:
                            return 4;
                        case types_1.FloodlightMotionTriggeredDistance.MAX:
                            return 5;
                        default:
                            return 5;
                    }
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined && message.msg_type !== types_1.DeviceType.HB3) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image, true);
                            }
                        }).catch((error) => {
                            this.log.debug(`FloodlightPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled floodlight push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`FloodlightPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.FloodlightCamera = FloodlightCamera;
class WallLightCam extends Camera {
    static async getInstance(api, device) {
        return new WallLightCam(api, device);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_DEV_RECORD_AUTOSTOP:
                    return value !== undefined ? (value === "0" ? true : false) : false;
                case types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD:
                    return value !== undefined ? (value === "1" ? true : false) : false;
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image);
                            }
                        }).catch((error) => {
                            this.log.debug(`WallLightCamPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.IndoorPushEvent.MOTION_DETECTION:
                            this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        case types_3.IndoorPushEvent.FACE_DETECTION:
                            this.updateProperty(types_1.PropertyName.DevicePersonName, !(0, utils_3.isEmpty)(message.person_name) ? message.person_name : "Unknown");
                            this.updateProperty(types_1.PropertyName.DevicePersonDetected, true);
                            this.clearEventTimeout(types_1.DeviceEvent.PersonDetected);
                            this.eventTimeouts.set(types_1.DeviceEvent.PersonDetected, setTimeout(async () => {
                                this.updateProperty(types_1.PropertyName.DevicePersonName, "");
                                this.updateProperty(types_1.PropertyName.DevicePersonDetected, false);
                                this.eventTimeouts.delete(types_1.DeviceEvent.PersonDetected);
                            }, eventDurationSeconds * 1000));
                            break;
                        default:
                            this.log.debug("Unhandled WallLightCam push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`WallLightCamPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.WallLightCam = WallLightCam;
class GarageCamera extends Camera {
    static async getInstance(api, device) {
        return new GarageCamera(api, device);
    }
    isLedEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceStatusLed);
    }
    isMotionDetectionEnabled() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetection);
    }
    convertRawPropertyValue(property, value) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20, _21, _22, _23, _24, _25, _26, _27, _28, _29, _30, _31, _32, _33, _34, _35, _36, _37, _38, _39;
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_SET_AUDIO_MUTE_RECORD:
                    return value !== undefined ? (value === "1" ? true : false) : false;
                case types_2.CommandType.CMD_CAMERA_GARAGE_DOOR_STATUS:
                    if (value != undefined) {
                        const status = Number.parseInt(value);
                        if (status >= 0) {
                            if (property.name === types_1.PropertyName.DeviceDoor1Open) {
                                return (status & types_1.GarageDoorState.A_OPENED) === types_1.GarageDoorState.A_OPENED;
                            }
                            else if (property.name === types_1.PropertyName.DeviceDoor2Open) {
                                return (status & types_1.GarageDoorState.B_OPENED) === types_1.GarageDoorState.B_OPENED;
                            }
                        }
                    }
                    return false;
                case types_2.CommandType.CMD_CAMERA_GARAGE_DOOR_SENSORS:
                    if (value != undefined) {
                        const sensorsData = value;
                        if (property.name === types_1.PropertyName.DeviceDoorSensor1BatteryLevel) {
                            if (((_b = (_a = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _a === void 0 ? void 0 : _a.door_1) === null || _b === void 0 ? void 0 : _b.power) !== undefined && ((_d = (_c = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _c === void 0 ? void 0 : _c.door_1) === null || _d === void 0 ? void 0 : _d.power) > 1) {
                                this.updateProperty(types_1.PropertyName.DeviceDoorSensor1LowBattery, false);
                            }
                            return ((_f = (_e = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _e === void 0 ? void 0 : _e.door_1) === null || _f === void 0 ? void 0 : _f.power) !== undefined ? (_h = (_g = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _g === void 0 ? void 0 : _g.door_1) === null || _h === void 0 ? void 0 : _h.power : 0;
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2BatteryLevel) {
                            if (((_k = (_j = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _j === void 0 ? void 0 : _j.door_2) === null || _k === void 0 ? void 0 : _k.power) !== undefined && ((_m = (_l = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _l === void 0 ? void 0 : _l.door_2) === null || _m === void 0 ? void 0 : _m.power) > 1) {
                                this.updateProperty(types_1.PropertyName.DeviceDoorSensor1LowBattery, false);
                            }
                            return ((_p = (_o = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _o === void 0 ? void 0 : _o.door_2) === null || _p === void 0 ? void 0 : _p.power) !== undefined ? (_r = (_q = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _q === void 0 ? void 0 : _q.door_2) === null || _r === void 0 ? void 0 : _r.power : 0;
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor1MacAddress) {
                            return ((_t = (_s = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _s === void 0 ? void 0 : _s.door_1) === null || _t === void 0 ? void 0 : _t.mac_address) !== undefined ? (_v = (_u = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _u === void 0 ? void 0 : _u.door_1) === null || _v === void 0 ? void 0 : _v.mac_address : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2MacAddress) {
                            return ((_x = (_w = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _w === void 0 ? void 0 : _w.door_2) === null || _x === void 0 ? void 0 : _x.mac_address) !== undefined ? (_z = (_y = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _y === void 0 ? void 0 : _y.door_2) === null || _z === void 0 ? void 0 : _z.mac_address : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor1Name) {
                            return ((_1 = (_0 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _0 === void 0 ? void 0 : _0.door_1) === null || _1 === void 0 ? void 0 : _1.name) !== undefined ? (_3 = (_2 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _2 === void 0 ? void 0 : _2.door_1) === null || _3 === void 0 ? void 0 : _3.name : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2Name) {
                            return ((_5 = (_4 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _4 === void 0 ? void 0 : _4.door_2) === null || _5 === void 0 ? void 0 : _5.name) !== undefined ? (_7 = (_6 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _6 === void 0 ? void 0 : _6.door_2) === null || _7 === void 0 ? void 0 : _7.name : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor1SerialNumber) {
                            return ((_9 = (_8 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _8 === void 0 ? void 0 : _8.door_1) === null || _9 === void 0 ? void 0 : _9.sn) !== undefined ? (_11 = (_10 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _10 === void 0 ? void 0 : _10.door_1) === null || _11 === void 0 ? void 0 : _11.sn : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2SerialNumber) {
                            return ((_13 = (_12 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _12 === void 0 ? void 0 : _12.door_2) === null || _13 === void 0 ? void 0 : _13.sn) !== undefined ? (_15 = (_14 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _14 === void 0 ? void 0 : _14.door_2) === null || _15 === void 0 ? void 0 : _15.sn : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor1Version) {
                            return ((_17 = (_16 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _16 === void 0 ? void 0 : _16.door_1) === null || _17 === void 0 ? void 0 : _17.version) !== undefined ? (_19 = (_18 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _18 === void 0 ? void 0 : _18.door_1) === null || _19 === void 0 ? void 0 : _19.version : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2Version) {
                            return ((_21 = (_20 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _20 === void 0 ? void 0 : _20.door_2) === null || _21 === void 0 ? void 0 : _21.version) !== undefined ? (_23 = (_22 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _22 === void 0 ? void 0 : _22.door_2) === null || _23 === void 0 ? void 0 : _23.version : "";
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorControlWarning) {
                            return ((_25 = (_24 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _24 === void 0 ? void 0 : _24.door_1) === null || _25 === void 0 ? void 0 : _25.playalarm) !== undefined ? ((_27 = (_26 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _26 === void 0 ? void 0 : _26.door_1) === null || _27 === void 0 ? void 0 : _27.playalarm) === 1 ? true : false : false;
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor1Status) {
                            return ((_29 = (_28 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _28 === void 0 ? void 0 : _28.door_1) === null || _29 === void 0 ? void 0 : _29.power) !== undefined ? ((_31 = (_30 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _30 === void 0 ? void 0 : _30.door_1) === null || _31 === void 0 ? void 0 : _31.power) >= 1 && ((_33 = (_32 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _32 === void 0 ? void 0 : _32.door_1) === null || _33 === void 0 ? void 0 : _33.sn) !== "" ? 1 : 0 : 0;
                        }
                        else if (property.name === types_1.PropertyName.DeviceDoorSensor2Status) {
                            return ((_35 = (_34 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _34 === void 0 ? void 0 : _34.door_2) === null || _35 === void 0 ? void 0 : _35.power) !== undefined ? ((_37 = (_36 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _36 === void 0 ? void 0 : _36.door_2) === null || _37 === void 0 ? void 0 : _37.power) >= 1 && ((_39 = (_38 = sensorsData === null || sensorsData === void 0 ? void 0 : sensorsData.data) === null || _38 === void 0 ? void 0 : _38.door_2) === null || _39 === void 0 ? void 0 : _39.sn) !== "" ? 1 : 0 : 0;
                        }
                    }
                    break;
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.device_sn === this.getSerial()) {
                try {
                    if (!(0, utils_3.isEmpty)(message.pic_url)) {
                        (0, utils_1.getImage)(this.api, this.getSerial(), message.pic_url).then((image) => {
                            if (image.data.length > 0) {
                                this.updateProperty(types_1.PropertyName.DevicePicture, image);
                            }
                        }).catch((error) => {
                            this.log.debug(`GarageDoorPushEvent - Device: ${message.device_sn} - Get picture - Error:`, error);
                        });
                    }
                    switch (message.event_type) {
                        case types_3.GarageDoorPushEvent.CLOSED_DOOR_BY_APP:
                        case types_3.GarageDoorPushEvent.CLOSED_DOOR_WITHOUT_APP:
                        case types_3.GarageDoorPushEvent.TIMEOUT_CLOSED_DOOR:
                            if (message.door_id === 1) {
                                this.updateProperty(types_1.PropertyName.DeviceDoor1Open, false);
                            }
                            else if (message.door_id === 2) {
                                this.updateProperty(types_1.PropertyName.DeviceDoor2Open, false);
                            }
                            break;
                        case types_3.GarageDoorPushEvent.OPEN_DOOR_BY_APP:
                        case types_3.GarageDoorPushEvent.OPEN_DOOR_WITHOUT_APP:
                        case types_3.GarageDoorPushEvent.TIMEOUT_DOOR_OPEN_WARNING:
                        case types_3.GarageDoorPushEvent.TIMEOUT_DOOR_OPEN_WARNING_MINUTES:
                            if (message.door_id === 1) {
                                this.updateProperty(types_1.PropertyName.DeviceDoor1Open, true);
                            }
                            else if (message.door_id === 2) {
                                this.updateProperty(types_1.PropertyName.DeviceDoor2Open, true);
                            }
                            break;
                        case types_3.GarageDoorPushEvent.LOW_BATTERY:
                            //TODO: Check if low battery status resets to false after battery change
                            if (message.door_id === 1) {
                                this.updateProperty(types_1.PropertyName.DeviceDoorSensor1LowBattery, true);
                            }
                            else if (message.door_id === 2) {
                                this.updateProperty(types_1.PropertyName.DeviceDoorSensor2LowBattery, true);
                            }
                            break;
                        default:
                            this.log.debug("Unhandled GarageDoor push event", message);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`GarageDoorPushEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
exports.GarageCamera = GarageCamera;
class Sensor extends Device {
    static async getInstance(api, device) {
        return new Sensor(api, device);
    }
    getStateChannel() {
        return "sensors";
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
}
exports.Sensor = Sensor;
class EntrySensor extends Sensor {
    static async getInstance(api, device) {
        return new EntrySensor(api, device);
    }
    isSensorOpen() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSensorOpen);
    }
    getSensorChangeTime() {
        return this.getPropertyValue(types_1.PropertyName.DeviceSensorChangeTime);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === types_3.CusPushEvent.DOOR_SENSOR && message.device_sn === this.getSerial()) {
                try {
                    if (message.sensor_open !== undefined) {
                        this.updateRawProperty(types_2.CommandType.CMD_ENTRY_SENSOR_STATUS, message.sensor_open ? "1" : "0");
                    }
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.DOOR_SENSOR - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DeviceSensorOpen && metadata.key === types_2.CommandType.CMD_ENTRY_SENSOR_STATUS) {
            this.emit("open", this, newValue);
        }
    }
}
exports.EntrySensor = EntrySensor;
class MotionSensor extends Sensor {
    //TODO: CMD_MOTION_SENSOR_ENABLE_LED = 1607
    //TODO: CMD_MOTION_SENSOR_ENTER_USER_TEST_MODE = 1613
    //TODO: CMD_MOTION_SENSOR_EXIT_USER_TEST_MODE = 1610
    //TODO: CMD_MOTION_SENSOR_SET_CHIRP_TONE = 1611
    //TODO: CMD_MOTION_SENSOR_SET_PIR_SENSITIVITY = 1609
    //TODO: CMD_MOTION_SENSOR_WORK_MODE = 1612
    /*public static isMotionDetected(millis: number): { motion: boolean, cooldown_ms: number} {
        const delta = new Date().getUTCMilliseconds() - millis;
        if (delta < this.MOTION_COOLDOWN_MS) {
            return { motion: true, cooldown_ms: this.MOTION_COOLDOWN_MS - delta};
        }
        return { motion: false, cooldown_ms: 0};
    }

    public isMotionDetected(): { motion: boolean, cooldown_ms: number} {
        return MotionSensor.isMotionDetected(this.getMotionSensorPIREvent());
    }*/
    constructor(api, device) {
        super(api, device);
        this.properties[types_1.PropertyName.DeviceMotionDetected] = false;
    }
    static async getInstance(api, device) {
        return new MotionSensor(api, device);
    }
    isMotionDetected() {
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionDetected);
    }
    getMotionSensorPIREvent() {
        //TODO: Implement P2P Control Event over active station connection
        return this.getPropertyValue(types_1.PropertyName.DeviceMotionSensorPIREvent);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DeviceMotionDetected) {
            this.emit("motion detected", this, newValue);
        }
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.type !== undefined && message.event_type !== undefined) {
            if (message.event_type === types_3.CusPushEvent.MOTION_SENSOR_PIR && message.device_sn === this.getSerial()) {
                try {
                    this.updateProperty(types_1.PropertyName.DeviceMotionDetected, true);
                    this.clearEventTimeout(types_1.DeviceEvent.MotionDetected);
                    this.eventTimeouts.set(types_1.DeviceEvent.MotionDetected, setTimeout(async () => {
                        this.updateProperty(types_1.PropertyName.DeviceMotionDetected, false);
                        this.eventTimeouts.delete(types_1.DeviceEvent.MotionDetected);
                    }, eventDurationSeconds * 1000));
                }
                catch (error) {
                    this.log.debug(`CusPushEvent.MOTION_SENSOR_PIR - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
}
MotionSensor.MOTION_COOLDOWN_MS = 120000;
exports.MotionSensor = MotionSensor;
class Lock extends Device {
    static async getInstance(api, device) {
        return new Lock(api, device);
    }
    getStateChannel() {
        return "locks";
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DeviceLocked) {
            this.emit("locked", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceLowBatteryAlert) {
            this.emit("low battery", this, newValue);
        }
        else if ((metadata.key === types_2.CommandType.CMD_DOORLOCK_GET_STATE || metadata.key === types_2.CommandType.CMD_SMARTLOCK_QUERY_STATUS) && ((oldValue !== undefined && ((oldValue === 4 && newValue !== 4) || (oldValue !== 4 && newValue === 4))) || oldValue === undefined)) {
            this.updateProperty(types_1.PropertyName.DeviceLocked, newValue === 4 ? true : false);
        }
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    getBatteryValue() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBattery);
    }
    getWifiRssi() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiRSSI);
    }
    isLocked() {
        const param = this.getLockStatus();
        return param ? (param === 4 ? true : false) : false;
    }
    getLockStatus() {
        return this.getPropertyValue(types_1.PropertyName.DeviceLockStatus);
    }
    // public isBatteryLow(): PropertyValue {
    //     return this.getPropertyValue(PropertyName.DeviceBatteryLow);
    // }
    static encodeESLCmdOnOff(short_user_id, nickname, lock) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, 2]);
        const buf2 = Buffer.allocUnsafe(2);
        buf2.writeUInt16BE(short_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 1, lock === true ? 1 : 0, types_2.ESLAnkerBleConstant.c, 4]);
        const buf4 = Buffer.from((0, utils_2.eslTimestamp)());
        const buf5 = Buffer.from([types_2.ESLAnkerBleConstant.d, nickname.length]);
        const buf6 = Buffer.from(nickname);
        return Buffer.concat([buf1, buf2, buf3, buf4, buf5, buf6]);
    }
    static encodeESLCmdQueryStatus(admin_user_id) {
        const buf1 = Buffer.from([types_2.ESLAnkerBleConstant.a, admin_user_id.length]);
        const buf2 = Buffer.from(admin_user_id);
        const buf3 = Buffer.from([types_2.ESLAnkerBleConstant.b, 4]);
        const buf4 = Buffer.from((0, utils_2.eslTimestamp)());
        return Buffer.concat([buf1, buf2, buf3, buf4]);
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.event_type !== undefined) {
            this.processNotification(message.event_type, message.event_time, message.device_sn, eventDurationSeconds);
        }
    }
    processMQTTNotification(message, eventDurationSeconds) {
        if (message.eventType === types_3.LockPushEvent.STATUS_CHANGE) {
            // Lock state event
            const cmdType = this.isLockBle() || this.isLockBleNoFinger() ? types_2.CommandType.CMD_DOORLOCK_GET_STATE : types_2.CommandType.CMD_SMARTLOCK_QUERY_STATUS;
            this.updateRawProperty(cmdType, message.lockState);
        }
        else if (message.eventType === types_3.LockPushEvent.OTA_STATUS) {
            // OTA Status - ignore event
        }
        else {
            this.processNotification(message.eventType, message.eventTime, this.getSerial(), eventDurationSeconds);
        }
    }
    processNotification(eventType, eventTime, deviceSN, eventDurationSeconds) {
        if (deviceSN === this.getSerial()) {
            try {
                switch (eventType) {
                    case types_3.LockPushEvent.APP_LOCK:
                    case types_3.LockPushEvent.AUTO_LOCK:
                    case types_3.LockPushEvent.FINGER_LOCK:
                    case types_3.LockPushEvent.KEYPAD_LOCK:
                    case types_3.LockPushEvent.MANUAL_LOCK:
                    case types_3.LockPushEvent.PW_LOCK:
                    case types_3.LockPushEvent.TEMPORARY_PW_LOCK:
                        {
                            const cmdType = this.isLockBle() || this.isLockBleNoFinger() ? types_2.CommandType.CMD_DOORLOCK_GET_STATE : types_2.CommandType.CMD_SMARTLOCK_QUERY_STATUS;
                            this.updateRawProperty(cmdType, "4");
                            break;
                        }
                    case types_3.LockPushEvent.APP_UNLOCK:
                    case types_3.LockPushEvent.AUTO_UNLOCK:
                    case types_3.LockPushEvent.FINGERPRINT_UNLOCK:
                    case types_3.LockPushEvent.MANUAL_UNLOCK:
                    case types_3.LockPushEvent.PW_UNLOCK:
                    case types_3.LockPushEvent.TEMPORARY_PW_UNLOCK:
                        {
                            const cmdType = this.isLockBle() || this.isLockBleNoFinger() ? types_2.CommandType.CMD_DOORLOCK_GET_STATE : types_2.CommandType.CMD_SMARTLOCK_QUERY_STATUS;
                            this.updateRawProperty(cmdType, "3");
                            break;
                        }
                    case types_3.LockPushEvent.LOCK_MECHANICAL_ANOMALY:
                    case types_3.LockPushEvent.MECHANICAL_ANOMALY:
                    case types_3.LockPushEvent.VIOLENT_DESTRUCTION:
                    case types_3.LockPushEvent.MULTIPLE_ERRORS:
                        {
                            const cmdType = this.isLockBle() || this.isLockBleNoFinger() ? types_2.CommandType.CMD_DOORLOCK_GET_STATE : types_2.CommandType.CMD_SMARTLOCK_QUERY_STATUS;
                            this.updateRawProperty(cmdType, "5");
                            break;
                        }
                    case types_3.LockPushEvent.LOW_POWER:
                    case types_3.LockPushEvent.VERY_LOW_POWER:
                        this.updateProperty(types_1.PropertyName.DeviceLowBatteryAlert, true);
                        this.clearEventTimeout(types_1.DeviceEvent.LowBattery);
                        this.eventTimeouts.set(types_1.DeviceEvent.LowBattery, setTimeout(async () => {
                            this.updateProperty(types_1.PropertyName.DeviceLowBatteryAlert, false);
                            this.eventTimeouts.delete(types_1.DeviceEvent.LowBattery);
                        }, eventDurationSeconds * 1000));
                        break;
                    // case LockPushEvent.LOW_POWE:
                    //     this.updateRawProperty(CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL, "10");
                    //     break;
                    // case LockPushEvent.VERY_LOW_POWE:
                    //     this.updateRawProperty(CommandType.CMD_SMARTLOCK_QUERY_BATTERY_LEVEL, "5");
                    //     break;
                    default:
                        this.log.debug("Unhandled lock notification event", eventType, eventTime, deviceSN);
                        break;
                }
            }
            catch (error) {
                this.log.debug(`LockEvent - Device: ${deviceSN} Error:`, error);
            }
        }
    }
    /*public static decodeCommand(command: number): void {
        switch (command) {
            case ESLCommand.ON_OFF_LOCK:
            case 8:
                break;

            case ESLCommand.QUERY_STATUS_IN_LOCK:
            case 17:
                break;

            case ESLCommand.NOTIFY:
            case 18:
                break;
            default:
                break;
        }
    }*/
    static getCurrentTimeInSeconds() {
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUint32LE((0, utils_2.getCurrentTimeInSeconds)());
        return buffer;
    }
    static getUInt8Buffer(value) {
        const buffer = Buffer.allocUnsafe(1);
        buffer.writeUInt8(value);
        return buffer;
    }
    static getUint16LEBuffer(value) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUint16LE(value);
        return buffer;
    }
    static getUint16BEBuffer(value) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUint16BE(value);
        return buffer;
    }
    static encodeCmdStatus(user_id) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id, "hex"));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdUnlock(short_user_id, value, username) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(short_user_id, "hex"));
        ssbytes.write(this.getUInt8Buffer(value));
        ssbytes.write(this.getCurrentTimeInSeconds());
        ssbytes.write(Buffer.from(username));
        return ssbytes.getData();
    }
    static encodeCmdCalibrate(user_id) {
        return this.encodeCmdStatus(user_id);
    }
    static encodeCmdAddUser(short_user_id, passcode, username, schedule, user_permission = 4) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(short_user_id, "hex"));
        ssbytes.write(Buffer.from(passcode, "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexDate)(schedule.startDateTime) : "00000000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexDate)(schedule.endDateTime) : "ffffffff", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.week !== undefined ? (0, utils_1.hexWeek)(schedule) : "ff", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexTime)(schedule.startDateTime) : "0000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexTime)(schedule.endDateTime) : "ffff", "hex"));
        ssbytes.write(this.getUInt8Buffer(user_permission));
        ssbytes.write(Buffer.from(username));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdAddTemporaryUser(schedule, unlimited = false) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexDate)(schedule.startDateTime) : "00000000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexDate)(schedule.endDateTime) : "ffffffff", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexTime)(schedule.startDateTime) : "0000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexTime)(schedule.endDateTime) : "ffff", "hex"));
        ssbytes.write(this.getUInt8Buffer(unlimited === false ? 1 : 2));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdDeleteTemporaryUser(password_id) {
        return this.encodeCmdStatus(password_id);
    }
    static encodeCmdDeleteUser(short_user_id) {
        return this.encodeCmdStatus(short_user_id);
    }
    static encodeCmdVerifyPw(password) {
        return this.encodeCmdStatus(password);
    }
    static encodeCmdQueryLockRecord(index) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16LEBuffer(index));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdQueryUser(short_user_id) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(short_user_id, "hex"));
        ssbytes.write(this.getUInt8Buffer(0)); //TODO: eSLQueryAllUsers.index
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdQueryPassword(password_id) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(password_id, "hex"));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdModifyPassword(password_id, passcode) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(password_id, "hex"));
        ssbytes.write(Buffer.from(passcode, "hex"));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdUpdateSchedule(short_user_id, schedule) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(short_user_id, "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexDate)(schedule.startDateTime) : "00000000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexDate)(schedule.endDateTime) : "ffffffff", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.week !== undefined ? (0, utils_1.hexWeek)(schedule) : "ff", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.startDateTime !== undefined ? (0, utils_1.hexTime)(schedule.startDateTime) : "0000", "hex"));
        ssbytes.write(Buffer.from(schedule !== undefined && schedule.endDateTime !== undefined ? (0, utils_1.hexTime)(schedule.endDateTime) : "ffff", "hex"));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdModifyUsername(username, password_id) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(password_id, "hex"));
        ssbytes.write(Buffer.from(username));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdGetLockParam(user_id) {
        return this.encodeCmdStatus(user_id);
    }
    static encodeCmdSetLockParamAutoLock(enabled, lockTimeSeconds) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_AUTO_LOCK));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getUint16LEBuffer(lockTimeSeconds));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdSetLockParamAutoLockSchedule(enabled, schedule_start, schedule_end) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_AUTO_LOCK_SCHEDULE));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(Buffer.from(Lock.hexTime(schedule_start), "hex"));
        ssbytes.write(Buffer.from(Lock.hexTime(schedule_end), "hex"));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdSetLockParamOneTouchLock(enabled) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_ONE_TOUCH_LOCK));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdSetLockParamWrongTryProtect(enabled, lockdownTime, attempts) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_WRONG_TRY_PROTECT));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getUint16LEBuffer(lockdownTime));
        ssbytes.write(this.getUInt8Buffer(attempts));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdSetLockParamScramblePasscode(enabled) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_SCRAMBLE_PASSCODE));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdSetLockParamSound(value) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(this.getUint16BEBuffer(types_2.CommandType.CMD_SMARTLOCK_LOCK_SOUND));
        ssbytes.write(this.getUInt8Buffer(value));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
}
Lock.VERSION_CODE_LOCKV12 = 18;
Lock.hexTime = function (time) {
    const buf = Buffer.allocUnsafe(2);
    buf.writeUint8(Number.parseInt(time.split(":")[0]));
    buf.writeUint8(Number.parseInt(time.split(":")[1]));
    return buf.readUInt16BE().toString(16).padStart(4, "0");
};
exports.Lock = Lock;
class Keypad extends Device {
    //TODO: CMD_KEYPAD_BATTERY_CHARGER_STATE = 1655
    //TODO: CMD_KEYPAD_BATTERY_TEMP_STATE = 1654
    //TODO: CMD_KEYPAD_GET_PASSWORD = 1657
    //TODO: CMD_KEYPAD_GET_PASSWORD_LIST = 1662
    //TODO: CMD_KEYPAD_IS_PSW_SET = 1670
    //TODO: CMD_KEYPAD_SET_CUSTOM_MAP = 1660
    //TODO: CMD_KEYPAD_SET_PASSWORD = 1650
    static async getInstance(api, device) {
        return new Keypad(api, device);
    }
    getStateChannel() {
        return "keypads";
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    isBatteryLow() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryLow);
    }
    isBatteryCharging() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBatteryIsCharging);
    }
    convertRawPropertyValue(property, value) {
        try {
            switch (property.key) {
                case types_2.CommandType.CMD_KEYPAD_BATTERY_CHARGER_STATE:
                    return value !== undefined ? (value === "0" || value === "2" ? false : true) : false;
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
}
exports.Keypad = Keypad;
class SmartSafe extends Device {
    static async getInstance(api, device) {
        return new SmartSafe(api, device);
    }
    getStateChannel() {
        return "smartsafes";
    }
    static getCurrentTimeInSeconds() {
        const timeInSeconds = (0, utils_2.getCurrentTimeInSeconds)();
        const arr = new Uint8Array(4);
        for (let i = 0; i < 4; i++) {
            arr[i] = ((timeInSeconds >> (i * 8)) & 255);
        }
        return Buffer.from(arr);
    }
    static getUInt8Buffer(value) {
        const buffer = Buffer.allocUnsafe(1);
        buffer.writeUInt8(value);
        return buffer;
    }
    static getUint16LEBuffer(value) {
        const buffer = Buffer.allocUnsafe(2);
        buffer.writeUint16LE(value);
        return buffer;
    }
    static encodeCmdSingleUInt8(user_id, value) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(this.getUInt8Buffer(value));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdWrongTryProtect(user_id, enabled, attempts, lockdownTime) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getUInt8Buffer(attempts));
        ssbytes.write(this.getUInt8Buffer(lockdownTime));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdLeftOpenAlarm(user_id, enabled, duration) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(this.getUInt8Buffer(enabled === true ? 1 : 0));
        ssbytes.write(this.getUint16LEBuffer(duration));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdDualUnlock(user_id, enabled) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, enabled === true ? 1 : 0);
    }
    static encodeCmdScramblePIN(user_id, enabled) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, enabled === true ? 1 : 0);
    }
    static encodeCmdPowerSave(user_id, enabled) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, enabled === true ? 1 : 0);
    }
    static encodeCmdInteriorBrightness(user_id, interiorBrightness, duration) {
        let convertedinteriorBrightness = 0;
        switch (interiorBrightness) {
            case 25:
                convertedinteriorBrightness = 1;
                break;
            case 60:
                convertedinteriorBrightness = 2;
                break;
            case 100:
                convertedinteriorBrightness = 3;
                break;
        }
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(this.getUInt8Buffer(convertedinteriorBrightness));
        ssbytes.write(this.getUInt8Buffer(duration));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdTamperAlarm(user_id, option) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, option);
    }
    static encodeCmdRemoteUnlock(user_id, option) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, option);
    }
    static encodeCmdAlertVolume(user_id, volume) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, volume);
    }
    static encodeCmdPromptVolume(user_id, volume) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, volume);
    }
    static encodeCmdPushNotification(user_id, modes) {
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(this.getUint16LEBuffer(modes));
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    static encodeCmdUnlock(user_id) {
        return SmartSafe.encodeCmdSingleUInt8(user_id, 1);
    }
    static encodeCmdVerifyPIN(user_id, pin) {
        const pinBuffer = Buffer.alloc(8);
        pinBuffer.write(pin);
        const ssbytes = new utils_1.SmartSafeByteWriter();
        ssbytes.write(Buffer.from(user_id));
        ssbytes.write(pinBuffer);
        ssbytes.write(this.getCurrentTimeInSeconds());
        return ssbytes.getData();
    }
    convertRawPropertyValue(property, value) {
        try {
            if (property.key === types_2.CommandType.CMD_SMARTSAFE_REMOTE_OPEN_TYPE) {
                switch (property.name) {
                    case types_1.PropertyName.DeviceRemoteUnlock:
                        {
                            const booleanProperty = property;
                            return value !== undefined ? (value === "0" || value === "1" ? true : false) : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                    case types_1.PropertyName.DeviceRemoteUnlockMasterPIN:
                        {
                            const booleanProperty = property;
                            return value !== undefined ? (value === "0" ? true : false) : booleanProperty.default !== undefined ? booleanProperty.default : false;
                        }
                }
            }
            else if (property.key === types_2.CommandType.CMD_SMARTSAFE_NOTIF) {
                const booleanProperty = property;
                return value !== undefined ? ((Number.parseInt(value) >> SmartSafe.PUSH_NOTIFICATION_POSITION[property.name]) & 1) === 1 : booleanProperty.default !== undefined ? booleanProperty.default : false;
            }
        }
        catch (error) {
            this.log.error("Convert Error:", { property: property, value: value, error: error });
        }
        return super.convertRawPropertyValue(property, value);
    }
    shakeEvent(event, eventDurationSeconds) {
        this.updateProperty(types_1.PropertyName.DeviceShakeAlertEvent, event);
        this.updateProperty(types_1.PropertyName.DeviceShakeAlert, true);
        this.clearEventTimeout(types_1.DeviceEvent.ShakeAlarm);
        this.eventTimeouts.set(types_1.DeviceEvent.ShakeAlarm, setTimeout(async () => {
            this.updateProperty(types_1.PropertyName.DeviceShakeAlert, false);
            this.eventTimeouts.delete(types_1.DeviceEvent.ShakeAlarm);
        }, eventDurationSeconds * 1000));
    }
    alarm911Event(event, eventDurationSeconds) {
        this.updateProperty(types_1.PropertyName.Device911AlertEvent, event);
        this.updateProperty(types_1.PropertyName.Device911Alert, true);
        this.clearEventTimeout(types_1.DeviceEvent.Alarm911);
        this.eventTimeouts.set(types_1.DeviceEvent.Alarm911, setTimeout(async () => {
            this.updateProperty(types_1.PropertyName.Device911Alert, false);
            this.eventTimeouts.delete(types_1.DeviceEvent.Alarm911);
        }, eventDurationSeconds * 1000));
    }
    jammedEvent(eventDurationSeconds) {
        this.updateProperty(types_1.PropertyName.DeviceJammedAlert, true);
        this.clearEventTimeout(types_1.DeviceEvent.Jammed);
        this.eventTimeouts.set(types_1.DeviceEvent.Jammed, setTimeout(async () => {
            this.updateProperty(types_1.PropertyName.DeviceJammedAlert, false);
            this.eventTimeouts.delete(types_1.DeviceEvent.Jammed);
        }, eventDurationSeconds * 1000));
    }
    lowBatteryEvent(eventDurationSeconds) {
        this.updateProperty(types_1.PropertyName.DeviceLowBatteryAlert, true);
        this.clearEventTimeout(types_1.DeviceEvent.LowBattery);
        this.eventTimeouts.set(types_1.DeviceEvent.LowBattery, setTimeout(async () => {
            this.updateProperty(types_1.PropertyName.DeviceLowBatteryAlert, false);
            this.eventTimeouts.delete(types_1.DeviceEvent.LowBattery);
        }, eventDurationSeconds * 1000));
    }
    wrongTryProtectAlarmEvent(eventDurationSeconds) {
        this.updateProperty(types_1.PropertyName.DeviceWrongTryProtectAlert, true);
        this.clearEventTimeout(types_1.DeviceEvent.WrontTryProtectAlarm);
        this.eventTimeouts.set(types_1.DeviceEvent.WrontTryProtectAlarm, setTimeout(async () => {
            this.updateProperty(types_1.PropertyName.DeviceWrongTryProtectAlert, false);
            this.eventTimeouts.delete(types_1.DeviceEvent.WrontTryProtectAlarm);
        }, eventDurationSeconds * 1000));
    }
    processPushNotification(message, eventDurationSeconds) {
        super.processPushNotification(message, eventDurationSeconds);
        if (message.event_type !== undefined) {
            if (message.station_sn === this.getSerial()) {
                try {
                    switch (message.event_type) {
                        //TODO: Finish smart safe push notification handling implementation
                        case types_3.SmartSafeEvent.LOCK_STATUS:
                            {
                                const eventValues = message.event_value;
                                if (eventValues.action === 0) {
                                    this.updateRawProperty(types_2.CommandType.CMD_SMARTSAFE_LOCK_STATUS, "0");
                                    /*
                                        type values:
                                            1: Unlocked by PIN
                                            2: Unlocked by User
                                            3: Unlocked by key
                                            4: Unlocked by App
                                            5: Unlocked by Dual Unlock
                                    */
                                }
                                else if (eventValues.action === 1) {
                                    this.updateRawProperty(types_2.CommandType.CMD_SMARTSAFE_LOCK_STATUS, "1");
                                }
                                else if (eventValues.action === 2) {
                                    this.jammedEvent(eventDurationSeconds);
                                }
                                else if (eventValues.action === 3) {
                                    this.lowBatteryEvent(eventDurationSeconds);
                                }
                                break;
                            }
                        case types_3.SmartSafeEvent.ALARM_911:
                            {
                                const eventValue = message.event_value;
                                this.alarm911Event(eventValue, eventDurationSeconds);
                                break;
                            }
                        case types_3.SmartSafeEvent.SHAKE_ALARM:
                            {
                                const eventValue = message.event_value;
                                this.shakeEvent(eventValue, eventDurationSeconds);
                                break;
                            }
                        case types_3.SmartSafeEvent.LONG_TIME_NOT_CLOSE:
                            {
                                const eventValue = message.event_value;
                                if (eventValue === 1) {
                                    this.updateProperty(types_1.PropertyName.DeviceLongTimeNotCloseAlert, true);
                                    this.clearEventTimeout(types_1.DeviceEvent.LongTimeNotClose);
                                    this.eventTimeouts.set(types_1.DeviceEvent.LongTimeNotClose, setTimeout(async () => {
                                        this.updateProperty(types_1.PropertyName.DeviceLongTimeNotCloseAlert, false);
                                        this.eventTimeouts.delete(types_1.DeviceEvent.LongTimeNotClose);
                                    }, eventDurationSeconds * 1000));
                                }
                                break;
                            }
                        case types_3.SmartSafeEvent.LOW_POWER:
                            {
                                this.lowBatteryEvent(eventDurationSeconds);
                                break;
                            }
                        case types_3.SmartSafeEvent.INPUT_ERR_MAX:
                            {
                                this.wrongTryProtectAlarmEvent(eventDurationSeconds);
                                break;
                            }
                        default:
                            this.log.debug("Unhandled smart safe notification event", message.event_type, message.event_time, message.device_sn);
                            break;
                    }
                }
                catch (error) {
                    this.log.debug(`LockEvent - Device: ${message.device_sn} Error:`, error);
                }
            }
        }
    }
    handlePropertyChange(metadata, oldValue, newValue) {
        super.handlePropertyChange(metadata, oldValue, newValue);
        if (metadata.name === types_1.PropertyName.DeviceLocked && metadata.key === types_2.CommandType.CMD_SMARTSAFE_LOCK_STATUS) {
            this.emit("locked", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceJammedAlert) {
            this.emit("jammed", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceLowBatteryAlert) {
            this.emit("low battery", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.Device911Alert) {
            this.emit("911 alarm", this, newValue, this.getPropertyValue(types_1.PropertyName.Device911AlertEvent));
        }
        else if (metadata.name === types_1.PropertyName.DeviceShakeAlert) {
            this.emit("shake alarm", this, newValue, this.getPropertyValue(types_1.PropertyName.DeviceShakeAlertEvent));
        }
        else if (metadata.name === types_1.PropertyName.DeviceLongTimeNotCloseAlert) {
            this.emit("long time not close", this, newValue);
        }
        else if (metadata.name === types_1.PropertyName.DeviceWrongTryProtectAlert) {
            this.emit("wrong try-protect alarm", this, newValue);
        }
    }
    getState() {
        return this.getPropertyValue(types_1.PropertyName.DeviceState);
    }
    getBatteryValue() {
        return this.getPropertyValue(types_1.PropertyName.DeviceBattery);
    }
    getWifiRssi() {
        return this.getPropertyValue(types_1.PropertyName.DeviceWifiRSSI);
    }
    isLocked() {
        return this.getPropertyValue(types_1.PropertyName.DeviceLocked);
    }
}
SmartSafe.IV = "052E19EB3F880512E99EBB684D4DC1FE";
SmartSafe.DATA_HEADER = [-1, 9];
SmartSafe.VERSION_CODE = 1;
SmartSafe.PUSH_NOTIFICATION_POSITION = {
    [types_1.PropertyName.DeviceNotificationUnlockByKey]: 0,
    [types_1.PropertyName.DeviceNotificationUnlockByPIN]: 1,
    [types_1.PropertyName.DeviceNotificationUnlockByFingerprint]: 2,
    [types_1.PropertyName.DeviceNotificationUnlockByApp]: 3,
    [types_1.PropertyName.DeviceNotificationDualUnlock]: 4,
    [types_1.PropertyName.DeviceNotificationDualLock]: 5,
    [types_1.PropertyName.DeviceNotificationWrongTryProtect]: 6,
    [types_1.PropertyName.DeviceNotificationJammed]: 7,
};
exports.SmartSafe = SmartSafe;
class UnknownDevice extends Device {
    static async getInstance(api, device) {
        return new UnknownDevice(api, device);
    }
    getStateChannel() {
        return "unknown";
    }
}
exports.UnknownDevice = UnknownDevice;
//# sourceMappingURL=device.js.map