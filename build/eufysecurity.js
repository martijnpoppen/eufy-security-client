"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EufySecurity = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const ts_log_1 = require("ts-log");
const fse = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const events_1 = __importDefault(require("events"));
const image_type_1 = __importDefault(require("image-type"));
const api_1 = require("./http/api");
const station_1 = require("./http/station");
const types_1 = require("./http/types");
const service_1 = require("./push/service");
const device_1 = require("./http/device");
const types_2 = require("./p2p/types");
const utils_1 = require("./utils");
const error_1 = require("./error");
const _1 = require(".");
const error_2 = require("./http/error");
const types_3 = require("./push/types");
const service_2 = require("./mqtt/service");
const const_1 = require("./http/const");
const utils_2 = require("./http/utils");
class EufySecurity extends tiny_typed_emitter_1.TypedEmitter {
    config;
    log;
    api;
    houses = {};
    stations = {};
    devices = {};
    P2P_REFRESH_INTERVAL_MIN = 720;
    cameraMaxLivestreamSeconds = 30;
    cameraStationLivestreamTimeout = new Map();
    cameraCloudLivestreamTimeout = new Map();
    pushService;
    mqttService;
    pushCloudRegistered = false;
    pushCloudChecked = false;
    persistentFile;
    persistentData = {
        country: "",
        openudid: "",
        serial_number: "",
        push_credentials: undefined,
        push_persistentIds: [],
        login_hash: "",
        version: "",
        httpApi: undefined
    };
    connected = false;
    retries = 0;
    refreshEufySecurityCloudTimeout;
    refreshEufySecurityP2PTimeout = {};
    deviceSnoozeTimeout = {};
    loadingEmitter = new events_1.default();
    stationsLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "stations loaded");
    devicesLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "devices loaded");
    constructor(config, log = ts_log_1.dummyLogger) {
        super();
        this.config = config;
        this.log = log;
    }
    static async initialize(config, log = ts_log_1.dummyLogger) {
        const eufySecurity = new EufySecurity(config, log);
        await eufySecurity._initializeInternals();
        return eufySecurity;
    }
    async _initializeInternals() {
        if (this.config.country === undefined) {
            this.config.country = "US";
        }
        else {
            this.config.country = this.config.country.toUpperCase();
        }
        if (this.config.language === undefined) {
            this.config.language = "en";
        }
        if (this.config.eventDurationSeconds === undefined) {
            this.config.eventDurationSeconds = 10;
        }
        if (this.config.p2pConnectionSetup === undefined) {
            this.config.p2pConnectionSetup = types_2.P2PConnectionType.QUICKEST;
        }
        else if (!Object.values(types_2.P2PConnectionType).includes(this.config.p2pConnectionSetup)) {
            this.config.p2pConnectionSetup = types_2.P2PConnectionType.QUICKEST;
        }
        if (this.config.pollingIntervalMinutes === undefined) {
            this.config.pollingIntervalMinutes = 10;
        }
        if (this.config.acceptInvitations === undefined) {
            this.config.acceptInvitations = false;
        }
        if (this.config.persistentDir === undefined) {
            this.config.persistentDir = path.resolve(__dirname, "../../..");
        }
        else if (!fse.existsSync(this.config.persistentDir)) {
            this.config.persistentDir = path.resolve(__dirname, "../../..");
        }
        this.persistentFile = path.join(this.config.persistentDir, "persistent.json");
        try {
            if (fse.statSync(this.persistentFile).isFile()) {
                const fileContent = fse.readFileSync(this.persistentFile, "utf8");
                this.persistentData = JSON.parse(fileContent);
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.debug("No stored data from last exit found", error);
        }
        try {
            if (this.persistentData.version !== _1.libVersion) {
                const currentVersion = Number.parseFloat((0, utils_1.removeLastChar)(_1.libVersion, "."));
                const previousVersion = this.persistentData.version !== "" && this.persistentData.version !== undefined ? Number.parseFloat((0, utils_1.removeLastChar)(this.persistentData.version, ".")) : 0;
                this.log.debug("Handling of driver update", { currentVersion: currentVersion, previousVersion: previousVersion });
                if (previousVersion < currentVersion) {
                    this.persistentData = (0, utils_1.handleUpdate)(this.persistentData, this.log, previousVersion);
                    this.persistentData.version = _1.libVersion;
                    this.writePersistentData();
                }
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error("Handling update - Error", error);
        }
        if (this.config.trustedDeviceName === undefined || this.config.trustedDeviceName === "") {
            if (this.persistentData.fallbackTrustedDeviceName !== undefined) {
                this.config.trustedDeviceName = this.persistentData.fallbackTrustedDeviceName;
            }
            else {
                const rnd = (0, utils_2.randomNumber)(0, const_1.PhoneModels.length);
                this.persistentData.fallbackTrustedDeviceName = const_1.PhoneModels[rnd];
                this.config.trustedDeviceName = this.persistentData.fallbackTrustedDeviceName;
            }
        }
        this.api = await api_1.HTTPApi.initialize(this.config.country, this.config.username, this.config.password, this.log, this.persistentData.httpApi);
        this.api.setLanguage(this.config.language);
        this.api.setPhoneModel(this.config.trustedDeviceName);
        this.api.on("houses", (houses) => this.handleHouses(houses));
        this.api.on("hubs", (hubs) => this.handleHubs(hubs));
        this.api.on("devices", (devices) => this.handleDevices(devices));
        this.api.on("close", () => this.onAPIClose());
        this.api.on("connect", () => this.onAPIConnect());
        this.api.on("captcha request", (id, captcha) => this.onCaptchaRequest(id, captcha));
        this.api.on("auth token invalidated", () => this.onAuthTokenInvalidated());
        this.api.on("tfa request", () => this.onTfaRequest());
        this.api.on("connection error", (error) => this.onAPIConnectionError(error));
        if (this.persistentData.login_hash && this.persistentData.login_hash != "") {
            this.log.debug("Load previous login_hash:", this.persistentData.login_hash);
            if ((0, utils_1.md5)(`${this.config.username}:${this.config.password}`) != this.persistentData.login_hash) {
                this.log.info("Authentication properties changed, invalidate saved cloud token.");
                this.persistentData.cloud_token = "";
                this.persistentData.cloud_token_expiration = 0;
                this.persistentData.httpApi = undefined;
            }
        }
        else {
            this.persistentData.cloud_token = "";
            this.persistentData.cloud_token_expiration = 0;
        }
        if (this.persistentData.country !== undefined && this.persistentData.country !== "" && this.persistentData.country !== this.config.country) {
            this.log.info("Country property changed, invalidate saved cloud token.");
            this.persistentData.cloud_token = "";
            this.persistentData.cloud_token_expiration = 0;
            this.persistentData.httpApi = undefined;
        }
        if (this.persistentData.cloud_token && this.persistentData.cloud_token != "" && this.persistentData.cloud_token_expiration) {
            this.log.debug("Load previous token:", { token: this.persistentData.cloud_token, tokenExpiration: this.persistentData.cloud_token_expiration });
            this.api.setToken(this.persistentData.cloud_token);
            this.api.setTokenExpiration(new Date(this.persistentData.cloud_token_expiration));
        }
        if (this.persistentData.httpApi !== undefined && (this.persistentData.httpApi.clientPrivateKey === undefined || this.persistentData.httpApi.clientPrivateKey === "" || this.persistentData.httpApi.serverPublicKey === undefined || this.persistentData.httpApi.serverPublicKey === "")) {
            this.log.debug("Incomplete persistent data for v2 encrypted cloud api communication. Invalidate authenticated session data.");
            this.persistentData.cloud_token = "";
            this.persistentData.cloud_token_expiration = 0;
            this.persistentData.httpApi = undefined;
        }
        if (!this.persistentData.openudid || this.persistentData.openudid == "") {
            this.persistentData.openudid = (0, utils_1.generateUDID)();
            this.log.debug("Generated new openudid:", this.persistentData.openudid);
        }
        this.api.setOpenUDID(this.persistentData.openudid);
        if (!this.persistentData.serial_number || this.persistentData.serial_number == "") {
            this.persistentData.serial_number = (0, utils_1.generateSerialnumber)(12);
            this.log.debug("Generated new serial_number:", this.persistentData.serial_number);
        }
        this.api.setSerialNumber(this.persistentData.serial_number);
        this.pushService = new service_1.PushNotificationService(this.log);
        this.pushService.on("connect", async (token) => {
            this.pushCloudRegistered = await this.api.registerPushToken(token);
            this.pushCloudChecked = await this.api.checkPushToken();
            //TODO: Retry if failed with max retry to not lock account
            if (this.pushCloudRegistered && this.pushCloudChecked) {
                this.log.info("Push notification connection successfully established");
                this.emit("push connect");
            }
            else {
                this.log.info("Push notification connection closed");
                this.emit("push close");
            }
        });
        this.pushService.on("credential", (credentials) => {
            this.savePushCredentials(credentials);
        });
        this.pushService.on("message", (message) => this.onPushMessage(message));
        this.pushService.on("close", () => {
            this.log.info("Push notification connection closed");
            this.emit("push close");
        });
        await this.initMQTT();
    }
    async initMQTT() {
        this.mqttService = await service_2.MQTTService.init(this.log);
        this.mqttService.on("connect", () => {
            this.log.info("MQTT connection successfully established");
            this.emit("mqtt connect");
        });
        this.mqttService.on("close", () => {
            this.log.info("MQTT connection closed");
            this.emit("mqtt close");
        });
        this.mqttService.on("lock message", (message) => {
            this.getDevice(message.data.data.deviceSn).then((device) => {
                device.processMQTTNotification(message.data.data, this.config.eventDurationSeconds);
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                if (error instanceof error_1.DeviceNotFoundError) {
                }
                else {
                    this.log.error("Lock MQTT Message Error", error);
                }
            }).finally(() => {
                this.emit("mqtt lock message", message);
            });
        });
    }
    getPushService() {
        return this.pushService;
    }
    addStation(station) {
        const serial = station.getSerial();
        if (serial && !Object.keys(this.stations).includes(serial)) {
            this.stations[serial] = station;
            this.getStorageInfo(serial);
            this.emit("station added", station);
        }
        else {
            this.log.debug(`Station with this serial ${station.getSerial()} exists already and couldn't be added again!`);
        }
    }
    removeStation(station) {
        const serial = station.getSerial();
        if (serial && Object.keys(this.stations).includes(serial)) {
            delete this.stations[serial];
            station.removeAllListeners();
            if (station.isConnected())
                station.close();
            this.emit("station removed", station);
        }
        else {
            this.log.debug(`Station with this serial ${station.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    async updateStation(hub) {
        if (this.stationsLoaded)
            await this.stationsLoaded;
        if (Object.keys(this.stations).includes(hub.station_sn)) {
            this.stations[hub.station_sn].update(hub);
            if (!this.stations[hub.station_sn].isConnected() && !this.stations[hub.station_sn].isEnergySavingDevice() && this.stations[hub.station_sn].isP2PConnectableDevice()) {
                this.stations[hub.station_sn].setConnectionType(this.config.p2pConnectionSetup);
                this.stations[hub.station_sn].connect();
            }
            this.getStorageInfo(hub.station_sn);
        }
        else {
            this.log.debug(`Station with this serial ${hub.station_sn} doesn't exists and couldn't be updated!`);
        }
    }
    async getStorageInfo(stationSerial) {
        try {
            const station = await this.getStation(stationSerial);
            if (station.isStation() || (station.hasProperty(types_1.PropertyName.StationSdStatus) && station.getPropertyValue(types_1.PropertyName.StationSdStatus) !== undefined && station.getPropertyValue(types_1.PropertyName.StationSdStatus) !== types_2.TFCardStatus.REMOVE)) {
                await station.getStorageInfoEx();
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error("getStorageInfo Error", error);
        }
    }
    addDevice(device) {
        const serial = device.getSerial();
        if (serial && !Object.keys(this.devices).includes(serial)) {
            this.devices[serial] = device;
            this.emit("device added", device);
            if (device.isLock())
                this.mqttService.subscribeLock(device.getSerial());
        }
        else {
            this.log.debug(`Device with this serial ${device.getSerial()} exists already and couldn't be added again!`);
        }
    }
    removeDevice(device) {
        const serial = device.getSerial();
        if (serial && Object.keys(this.devices).includes(serial)) {
            delete this.devices[serial];
            device.removeAllListeners();
            this.emit("device removed", device);
        }
        else {
            this.log.debug(`Device with this serial ${device.getSerial()} doesn't exists and couldn't be removed!`);
        }
    }
    async updateDevice(device) {
        if (this.devicesLoaded)
            await this.devicesLoaded;
        if (Object.keys(this.devices).includes(device.device_sn))
            this.devices[device.device_sn].update(device);
        else
            this.log.debug(`Device with this serial ${device.device_sn} doesn't exists and couldn't be updated!`);
    }
    async getDevices() {
        if (this.devicesLoaded)
            await this.devicesLoaded;
        const arr = [];
        Object.keys(this.devices).forEach((serialNumber) => {
            arr.push(this.devices[serialNumber]);
        });
        return arr;
    }
    async getDevicesFromStation(stationSN) {
        if (this.devicesLoaded)
            await this.devicesLoaded;
        const arr = [];
        Object.keys(this.devices).forEach((serialNumber) => {
            if (this.devices[serialNumber].getStationSerial() === stationSN)
                arr.push(this.devices[serialNumber]);
        });
        return arr;
    }
    async getDevice(deviceSN) {
        if (this.devicesLoaded)
            await this.devicesLoaded;
        if (Object.keys(this.devices).includes(deviceSN))
            return this.devices[deviceSN];
        throw new error_1.DeviceNotFoundError("Device doesn't exists", { context: { device: deviceSN } });
    }
    async getStationDevice(stationSN, channel) {
        if (this.devicesLoaded)
            await this.devicesLoaded;
        for (const device of Object.values(this.devices)) {
            if ((device.getStationSerial() === stationSN && device.getChannel() === channel) || (device.getStationSerial() === stationSN && device.getSerial() === stationSN)) {
                return device;
            }
        }
        throw new error_1.DeviceNotFoundError("No device with passed channel found on station", { context: { station: stationSN, channel: channel } });
    }
    async getStations() {
        if (this.stationsLoaded)
            await this.stationsLoaded;
        const arr = [];
        Object.keys(this.stations).forEach((serialNumber) => {
            arr.push(this.stations[serialNumber]);
        });
        return arr;
    }
    async getStation(stationSN) {
        if (this.stationsLoaded)
            await this.stationsLoaded;
        if (Object.keys(this.stations).includes(stationSN))
            return this.stations[stationSN];
        throw new error_1.StationNotFoundError("Station doesn't exists", { context: { station: stationSN } });
    }
    getApi() {
        return this.api;
    }
    async connectToStation(stationSN, p2pConnectionType = types_2.P2PConnectionType.QUICKEST) {
        const station = await this.getStation(stationSN);
        if (station.isP2PConnectableDevice()) {
            station.setConnectionType(p2pConnectionType);
            station.connect();
        }
    }
    async isStationConnected(stationSN) {
        const station = await this.getStation(stationSN);
        return station.isConnected();
    }
    async isStationEnergySavingDevice(stationSN) {
        const station = await this.getStation(stationSN);
        return station.isEnergySavingDevice();
    }
    handleHouses(houses) {
        this.log.debug("Got houses:", houses);
        //TODO: Finish implementation
        this.houses = houses;
    }
    handleHubs(hubs) {
        this.log.debug("Got hubs:", hubs);
        const stationsSNs = Object.keys(this.stations);
        const newStationsSNs = Object.keys(hubs);
        const promises = [];
        for (const hub of Object.values(hubs)) {
            if (stationsSNs.includes(hub.station_sn)) {
                this.updateStation(hub);
            }
            else {
                if (this.stationsLoaded === undefined)
                    this.stationsLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "stations loaded");
                let ipAddress;
                if (this.config.stationIPAddresses !== undefined) {
                    ipAddress = this.config.stationIPAddresses[hub.station_sn];
                }
                const station = station_1.Station.getInstance(this.api, hub, ipAddress);
                promises.push(station.then((station) => {
                    try {
                        station.on("connect", (station) => this.onStationConnect(station));
                        station.on("connection error", (station, error) => this.onStationConnectionError(station, error));
                        station.on("close", (station) => this.onStationClose(station));
                        station.on("raw device property changed", (deviceSN, params) => this.updateDeviceProperties(deviceSN, params));
                        station.on("livestream start", (station, channel, metadata, videostream, audiostream) => this.onStartStationLivestream(station, channel, metadata, videostream, audiostream));
                        station.on("livestream stop", (station, channel) => this.onStopStationLivestream(station, channel));
                        station.on("livestream error", (station, channel, error) => this.onErrorStationLivestream(station, channel, error));
                        station.on("download start", (station, channel, metadata, videoStream, audioStream) => this.onStationStartDownload(station, channel, metadata, videoStream, audioStream));
                        station.on("download finish", (station, channel) => this.onStationFinishDownload(station, channel));
                        station.on("command result", (station, result) => this.onStationCommandResult(station, result));
                        station.on("guard mode", (station, guardMode) => this.onStationGuardMode(station, guardMode));
                        station.on("current mode", (station, currentMode) => this.onStationCurrentMode(station, currentMode));
                        station.on("rtsp livestream start", (station, channel) => this.onStartStationRTSPLivestream(station, channel));
                        station.on("rtsp livestream stop", (station, channel) => this.onStopStationRTSPLivestream(station, channel));
                        station.on("rtsp url", (station, channel, value) => this.onStationRtspUrl(station, channel, value));
                        station.on("property changed", (station, name, value, ready) => this.onStationPropertyChanged(station, name, value, ready));
                        station.on("raw property changed", (station, type, value) => this.onStationRawPropertyChanged(station, type, value));
                        station.on("alarm event", (station, alarmEvent) => this.onStationAlarmEvent(station, alarmEvent));
                        station.on("runtime state", (station, channel, batteryLevel, temperature) => this.onStationRuntimeState(station, channel, batteryLevel, temperature));
                        station.on("charging state", (station, channel, chargeType, batteryLevel) => this.onStationChargingState(station, channel, chargeType, batteryLevel));
                        station.on("wifi rssi", (station, channel, rssi) => this.onStationWifiRssi(station, channel, rssi));
                        station.on("floodlight manual switch", (station, channel, enabled) => this.onFloodlightManualSwitch(station, channel, enabled));
                        station.on("alarm delay event", (station, alarmDelayEvent, alarmDelay) => this.onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay));
                        station.on("talkback started", (station, channel, talkbackStream) => this.onStationTalkbackStart(station, channel, talkbackStream));
                        station.on("talkback stopped", (station, channel) => this.onStationTalkbackStop(station, channel));
                        station.on("talkback error", (station, channel, error) => this.onStationTalkbackError(station, channel, error));
                        station.on("alarm armed event", (station) => this.onStationAlarmArmedEvent(station));
                        station.on("alarm arm delay event", (station, armDelay) => this.onStationArmDelayEvent(station, armDelay));
                        station.on("secondary command result", (station, result) => this.onStationSecondaryCommandResult(station, result));
                        station.on("device shake alarm", (deviceSN, event) => this.onStationDeviceShakeAlarm(deviceSN, event));
                        station.on("device 911 alarm", (deviceSN, event) => this.onStationDevice911Alarm(deviceSN, event));
                        station.on("device jammed", (deviceSN) => this.onStationDeviceJammed(deviceSN));
                        station.on("device low battery", (deviceSN) => this.onStationDeviceLowBattery(deviceSN));
                        station.on("device wrong try-protect alarm", (deviceSN) => this.onStationDeviceWrongTryProtectAlarm(deviceSN));
                        station.on("device pin verified", (deviceSN, successfull) => this.onStationDevicePinVerified(deviceSN, successfull));
                        station.on("sd info ex", (station, sdStatus, sdCapacity, sdCapacityAvailable) => this.onStationSdInfoEx(station, sdStatus, sdCapacity, sdCapacityAvailable));
                        station.on("image download", (station, file, image) => this.onStationImageDownload(station, file, image));
                        station.on("database query latest", (station, returnCode, data) => this.onStationDatabaseQueryLatest(station, returnCode, data));
                        station.on("database query local", (station, returnCode, data) => this.onStationDatabaseQueryLocal(station, returnCode, data));
                        station.on("database count by date", (station, returnCode, data) => this.onStationDatabaseCountByDate(station, returnCode, data));
                        station.on("database delete", (station, returnCode, failedIds) => this.onStationDatabaseDelete(station, returnCode, failedIds));
                        station.on("sensor status", (station, channel, status) => this.onStationSensorStatus(station, channel, status));
                        station.on("garage door status", (station, channel, doorId, status) => this.onStationGarageDoorStatus(station, channel, doorId, status));
                        this.addStation(station);
                        station.initialize();
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error("HandleHubs Error", error);
                    }
                    return station;
                }));
            }
        }
        Promise.all(promises).then(() => {
            this.loadingEmitter.emit("stations loaded");
            this.stationsLoaded = undefined;
        });
        if (promises.length === 0) {
            this.loadingEmitter.emit("stations loaded");
            this.stationsLoaded = undefined;
        }
        for (const stationSN of stationsSNs) {
            if (!newStationsSNs.includes(stationSN)) {
                this.getStation(stationSN).then((station) => {
                    this.removeStation(station);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error("Error removing station", error);
                });
            }
        }
    }
    onStationConnect(station) {
        this.emit("station connect", station);
        if (station_1.Station.isStation(station.getDeviceType()) || (device_1.Device.isCamera(station.getDeviceType()) && !device_1.Device.isWiredDoorbell(station.getDeviceType()) || device_1.Device.isSmartSafe(station.getDeviceType()))) {
            station.getCameraInfo().catch(err => {
                const error = (0, error_1.ensureError)(err);
                this.log.error(`Error during station ${station.getSerial()} p2p data refreshing`, error);
            });
            if (this.refreshEufySecurityP2PTimeout[station.getSerial()] !== undefined) {
                clearTimeout(this.refreshEufySecurityP2PTimeout[station.getSerial()]);
                delete this.refreshEufySecurityP2PTimeout[station.getSerial()];
            }
            //if (!station.isEnergySavingDevice()) {
            this.refreshEufySecurityP2PTimeout[station.getSerial()] = setTimeout(() => {
                station.getCameraInfo().catch(err => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Error during station ${station.getSerial()} p2p data refreshing`, error);
                });
            }, this.P2P_REFRESH_INTERVAL_MIN * 60 * 1000);
            //}
        }
    }
    onStationConnectionError(station, error) {
        this.emit("station connection error", station, error);
    }
    onStationClose(station) {
        this.emit("station close", station);
        for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.getDevice(device_sn).then((device) => {
                if (device !== null && device.getStationSerial() === station.getSerial()) {
                    clearTimeout(this.cameraStationLivestreamTimeout.get(device_sn));
                    this.cameraStationLivestreamTimeout.delete(device_sn);
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                this.log.error(`Station ${station.getSerial()} - Error`, error);
            });
        }
    }
    handleDevices(devices) {
        this.log.debug("Got devices:", devices);
        const deviceSNs = Object.keys(this.devices);
        const newDeviceSNs = Object.keys(devices);
        const promises = [];
        for (const device of Object.values(devices)) {
            if (deviceSNs.includes(device.device_sn)) {
                this.updateDevice(device);
            }
            else {
                if (this.devicesLoaded === undefined)
                    this.devicesLoaded = (0, utils_1.waitForEvent)(this.loadingEmitter, "devices loaded");
                let new_device;
                if (device_1.Device.isIndoorCamera(device.device_type)) {
                    new_device = device_1.IndoorCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isSoloCameras(device.device_type)) {
                    new_device = device_1.SoloCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isBatteryDoorbell(device.device_type)) {
                    new_device = device_1.BatteryDoorbellCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isWiredDoorbell(device.device_type) || device_1.Device.isWiredDoorbellDual(device.device_type)) {
                    new_device = device_1.WiredDoorbellCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isFloodLight(device.device_type)) {
                    new_device = device_1.FloodlightCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isWallLightCam(device.device_type)) {
                    new_device = device_1.WallLightCam.getInstance(this.api, device);
                }
                else if (device_1.Device.isGarageCamera(device.device_type)) {
                    new_device = device_1.GarageCamera.getInstance(this.api, device);
                }
                else if (device_1.Device.isCamera(device.device_type)) {
                    new_device = device_1.Camera.getInstance(this.api, device);
                }
                else if (device_1.Device.isLock(device.device_type)) {
                    new_device = device_1.Lock.getInstance(this.api, device);
                }
                else if (device_1.Device.isMotionSensor(device.device_type)) {
                    new_device = device_1.MotionSensor.getInstance(this.api, device);
                }
                else if (device_1.Device.isEntrySensor(device.device_type)) {
                    new_device = device_1.EntrySensor.getInstance(this.api, device);
                }
                else if (device_1.Device.isKeyPad(device.device_type)) {
                    new_device = device_1.Keypad.getInstance(this.api, device);
                }
                else if (device_1.Device.isSmartSafe(device.device_type)) {
                    new_device = device_1.SmartSafe.getInstance(this.api, device);
                }
                else {
                    new_device = device_1.UnknownDevice.getInstance(this.api, device);
                }
                promises.push(new_device.then((device) => {
                    try {
                        device.on("property changed", (device, name, value, ready) => this.onDevicePropertyChanged(device, name, value, ready));
                        device.on("raw property changed", (device, type, value) => this.onDeviceRawPropertyChanged(device, type, value));
                        device.on("crying detected", (device, state) => this.onDeviceCryingDetected(device, state));
                        device.on("sound detected", (device, state) => this.onDeviceSoundDetected(device, state));
                        device.on("pet detected", (device, state) => this.onDevicePetDetected(device, state));
                        device.on("vehicle detected", (device, state) => this.onDeviceVehicleDetected(device, state));
                        device.on("motion detected", (device, state) => this.onDeviceMotionDetected(device, state));
                        device.on("person detected", (device, state, person) => this.onDevicePersonDetected(device, state, person));
                        device.on("rings", (device, state) => this.onDeviceRings(device, state));
                        device.on("locked", (device, state) => this.onDeviceLocked(device, state));
                        device.on("open", (device, state) => this.onDeviceOpen(device, state));
                        device.on("ready", (device) => this.onDeviceReady(device));
                        device.on("package delivered", (device, state) => this.onDevicePackageDelivered(device, state));
                        device.on("package stranded", (device, state) => this.onDevicePackageStranded(device, state));
                        device.on("package taken", (device, state) => this.onDevicePackageTaken(device, state));
                        device.on("someone loitering", (device, state) => this.onDeviceSomeoneLoitering(device, state));
                        device.on("radar motion detected", (device, state) => this.onDeviceRadarMotionDetected(device, state));
                        device.on("911 alarm", (device, state, detail) => this.onDevice911Alarm(device, state, detail));
                        device.on("shake alarm", (device, state, detail) => this.onDeviceShakeAlarm(device, state, detail));
                        device.on("wrong try-protect alarm", (device, state) => this.onDeviceWrongTryProtectAlarm(device, state));
                        device.on("long time not close", (device, state) => this.onDeviceLongTimeNotClose(device, state));
                        device.on("low battery", (device, state) => this.onDeviceLowBattery(device, state));
                        device.on("jammed", (device, state) => this.onDeviceJammed(device, state));
                        device.on("stranger person detected", (device, state) => this.onDeviceStrangerPersonDetected(device, state));
                        device.on("dog detected", (device, state) => this.onDeviceDogDetected(device, state));
                        device.on("dog lick detected", (device, state) => this.onDeviceDogLickDetected(device, state));
                        device.on("dog poop detected", (device, state) => this.onDeviceDogPoopDetected(device, state));
                        this.addDevice(device);
                        device.initialize();
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error("HandleDevices Error", error);
                    }
                    return device;
                }));
            }
        }
        Promise.all(promises).then((devices) => {
            devices.forEach((device) => {
                this.getStation(device.getStationSerial()).then((station) => {
                    if (!station.isConnected() && station.isP2PConnectableDevice()) {
                        station.setConnectionType(this.config.p2pConnectionSetup);
                        station.connect();
                    }
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error("Error trying to connect to station afte device loaded", error);
                });
            });
            this.loadingEmitter.emit("devices loaded");
            this.devicesLoaded = undefined;
        });
        if (promises.length === 0) {
            this.loadingEmitter.emit("devices loaded");
            this.devicesLoaded = undefined;
        }
        for (const deviceSN of deviceSNs) {
            if (!newDeviceSNs.includes(deviceSN)) {
                this.getDevice(deviceSN).then((device) => {
                    this.removeDevice(device);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error("Error removing device", error);
                });
            }
        }
    }
    async refreshCloudData() {
        if (this.config.acceptInvitations) {
            await this.processInvitations().catch(err => {
                const error = (0, error_1.ensureError)(err);
                this.log.error("Error in processing invitations", error);
            });
        }
        await this.api.refreshAllData().catch(err => {
            const error = (0, error_1.ensureError)(err);
            this.log.error("Error during API data refreshing", error);
        });
        if (this.refreshEufySecurityCloudTimeout !== undefined)
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        this.refreshEufySecurityCloudTimeout = setTimeout(() => { this.refreshCloudData(); }, this.config.pollingIntervalMinutes * 60 * 1000);
    }
    close() {
        for (const device_sn of this.cameraStationLivestreamTimeout.keys()) {
            this.stopStationLivestream(device_sn);
        }
        for (const device_sn of this.cameraCloudLivestreamTimeout.keys()) {
            this.stopCloudLivestream(device_sn);
        }
        if (this.refreshEufySecurityCloudTimeout !== undefined)
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        Object.keys(this.refreshEufySecurityP2PTimeout).forEach(station_sn => {
            clearTimeout(this.refreshEufySecurityP2PTimeout[station_sn]);
            delete this.refreshEufySecurityP2PTimeout[station_sn];
        });
        Object.keys(this.deviceSnoozeTimeout).forEach(device_sn => {
            clearTimeout(this.deviceSnoozeTimeout[device_sn]);
            delete this.deviceSnoozeTimeout[device_sn];
        });
        this.savePushPersistentIds();
        this.pushService.close();
        this.mqttService.close();
        Object.values(this.stations).forEach(station => {
            station.close();
        });
        Object.values(this.devices).forEach(device => {
            device.destroy();
        });
        if (this.connected)
            this.emit("close");
        this.connected = false;
    }
    setCameraMaxLivestreamDuration(seconds) {
        this.cameraMaxLivestreamSeconds = seconds;
    }
    getCameraMaxLivestreamDuration() {
        return this.cameraMaxLivestreamSeconds;
    }
    async registerPushNotifications(credentials, persistentIds) {
        if (credentials)
            this.pushService.setCredentials(credentials);
        if (persistentIds)
            this.pushService.setPersistentIds(persistentIds);
        this.pushService.open();
    }
    async connect(options) {
        await this.api.login(options)
            .then(async () => {
            if (options?.verifyCode) {
                let trusted = false;
                const trusted_devices = await this.api.listTrustDevice();
                trusted_devices.forEach(trusted_device => {
                    if (trusted_device.is_current_device === 1) {
                        trusted = true;
                    }
                });
                if (!trusted)
                    return await this.api.addTrustDevice(options?.verifyCode);
            }
        })
            .catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error("Connect Error", error);
        });
    }
    getPushPersistentIds() {
        return this.pushService.getPersistentIds();
    }
    updateDeviceProperties(deviceSN, values) {
        this.getDevice(deviceSN).then((device) => {
            device.updateRawProperties(values);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Update device ${deviceSN} properties error`, error);
        });
    }
    async onAPIClose() {
        if (this.refreshEufySecurityCloudTimeout !== undefined)
            clearTimeout(this.refreshEufySecurityCloudTimeout);
        this.connected = false;
        this.emit("close");
        if (this.retries < 1) {
            this.retries++;
            await this.connect();
        }
        else {
            this.log.error(`Tried to re-authenticate to Eufy cloud, but failed in the process. Manual intervention is required!`);
        }
    }
    async onAPIConnect() {
        this.connected = true;
        this.retries = 0;
        this.saveCloudToken();
        await this.refreshCloudData();
        this.emit("connect");
        this.registerPushNotifications(this.persistentData.push_credentials, this.persistentData.push_persistentIds);
        const loginData = this.api.getPersistentData();
        if (loginData) {
            this.mqttService.connect(loginData.user_id, this.persistentData.openudid, this.api.getAPIBase(), loginData.email);
        }
        else {
            this.log.warn("No login data recevied to initialize MQTT connection...");
        }
    }
    onAPIConnectionError(error) {
        this.emit("connection error", error);
    }
    async startStationLivestream(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStartLivestream))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStartLivestream } });
        const camera = device;
        if (!station.isLiveStreaming(camera)) {
            await station.startLivestream(camera);
            if (this.cameraMaxLivestreamSeconds > 0) {
                this.cameraStationLivestreamTimeout.set(deviceSN, setTimeout(() => {
                    this.log.info(`Stopping the station stream for the device ${deviceSN}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                    this.stopStationLivestream(deviceSN);
                }, this.cameraMaxLivestreamSeconds * 1000));
            }
        }
        else {
            this.log.warn(`The station stream for the device ${deviceSN} cannot be started, because it is already streaming!`);
        }
    }
    async startCloudLivestream(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStartLivestream))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStartLivestream } });
        const camera = device;
        if (!camera.isStreaming()) {
            const url = await camera.startStream();
            if (url !== "") {
                if (this.cameraMaxLivestreamSeconds > 0) {
                    this.cameraCloudLivestreamTimeout.set(deviceSN, setTimeout(() => {
                        this.log.info(`Stopping the station stream for the device ${deviceSN}, because we have reached the configured maximum stream timeout (${this.cameraMaxLivestreamSeconds} seconds)`);
                        this.stopCloudLivestream(deviceSN);
                    }, this.cameraMaxLivestreamSeconds * 1000));
                }
                this.emit("cloud livestream start", station, camera, url);
            }
            else {
                this.log.error(`Failed to start cloud stream for the device ${deviceSN}`);
            }
        }
        else {
            this.log.warn(`The cloud stream for the device ${deviceSN} cannot be started, because it is already streaming!`);
        }
    }
    async stopStationLivestream(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStopLivestream))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStopLivestream } });
        if (station.isConnected() && station.isLiveStreaming(device)) {
            await station.stopLivestream(device);
        }
        else {
            this.log.warn(`The station stream for the device ${deviceSN} cannot be stopped, because it isn't streaming!`);
        }
        const timeout = this.cameraStationLivestreamTimeout.get(deviceSN);
        if (timeout) {
            clearTimeout(timeout);
            this.cameraStationLivestreamTimeout.delete(deviceSN);
        }
    }
    async stopCloudLivestream(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStopLivestream))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStopLivestream } });
        const camera = device;
        if (camera.isStreaming()) {
            await camera.stopStream();
            this.emit("cloud livestream stop", station, camera);
        }
        else {
            this.log.warn(`The cloud stream for the device ${deviceSN} cannot be stopped, because it isn't streaming!`);
        }
        const timeout = this.cameraCloudLivestreamTimeout.get(deviceSN);
        if (timeout) {
            clearTimeout(timeout);
            this.cameraCloudLivestreamTimeout.delete(deviceSN);
        }
    }
    writePersistentData() {
        this.persistentData.login_hash = (0, utils_1.md5)(`${this.config.username}:${this.config.password}`);
        this.persistentData.httpApi = this.api?.getPersistentData();
        this.persistentData.country = this.api?.getCountry();
        try {
            fse.writeFileSync(this.persistentFile, JSON.stringify(this.persistentData));
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error("WritePersistentData Error", error);
        }
    }
    saveCloudToken() {
        const token = this.api.getToken();
        const token_expiration = this.api.getTokenExpiration();
        if (!!token && !!token_expiration) {
            this.log.debug("Save cloud token and token expiration", { token: token, tokenExpiration: token_expiration });
            this.persistentData.cloud_token = token;
            this.persistentData.cloud_token_expiration = token_expiration.getTime();
            this.writePersistentData();
        }
    }
    savePushCredentials(credentials) {
        this.persistentData.push_credentials = credentials;
        this.writePersistentData();
    }
    savePushPersistentIds() {
        this.persistentData.push_persistentIds = this.getPushPersistentIds();
        this.writePersistentData();
    }
    getVersion() {
        return _1.libVersion;
    }
    isPushConnected() {
        return this.pushService.isConnected();
    }
    isMQTTConnected() {
        return this.mqttService.isConnected();
    }
    isConnected() {
        return this.connected;
    }
    async processInvitations() {
        let refreshCloud = false;
        const invites = await this.api.getInvites().catch(err => {
            const error = (0, error_1.ensureError)(err);
            this.log.error("processInvitations - getInvites - Error", error);
            return error;
        });
        if (Object.keys(invites).length > 0) {
            const confirmInvites = [];
            for (const invite of Object.values(invites)) {
                const devices = [];
                invite.devices.forEach(device => {
                    devices.push(device.device_sn);
                });
                if (devices.length > 0) {
                    confirmInvites.push({
                        invite_id: invite.invite_id,
                        station_sn: invite.station_sn,
                        device_sns: devices
                    });
                }
            }
            if (confirmInvites.length > 0) {
                const result = await this.api.confirmInvites(confirmInvites).catch(err => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error("processInvitations - confirmInvites - Error", error);
                    return error;
                });
                if (result) {
                    this.log.info(`Accepted received invitations`, confirmInvites);
                    refreshCloud = true;
                }
            }
        }
        const houseInvites = await this.api.getHouseInviteList().catch(err => {
            const error = (0, error_1.ensureError)(err);
            this.log.error("processInvitations - getHouseInviteList - Error", error);
            return error;
        });
        if (Object.keys(houseInvites).length > 0) {
            for (const invite of Object.values(houseInvites)) {
                const result = await this.api.confirmHouseInvite(invite.house_id, invite.id).catch(err => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error("processInvitations - confirmHouseInvite - Error", error);
                    return error;
                });
                if (result) {
                    this.log.info(`Accepted received house invitation from ${invite.action_user_email}`, invite);
                    refreshCloud = true;
                }
            }
        }
        if (refreshCloud)
            this.refreshCloudData();
    }
    onPushMessage(message) {
        this.emit("push message", message);
        try {
            this.log.debug("Received push message", message);
            try {
                if ((message.type === types_3.ServerPushEvent.INVITE_DEVICE || message.type === types_3.ServerPushEvent.HOUSE_INVITE) && this.config.acceptInvitations) {
                    if (this.isConnected())
                        this.processInvitations();
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                this.log.error(`Error processing server push notification for device invitation`, error);
            }
            try {
                if (message.type === types_3.ServerPushEvent.REMOVE_DEVICE || message.type === types_3.ServerPushEvent.REMOVE_HOMEBASE || message.type === types_3.ServerPushEvent.HOUSE_REMOVE) {
                    if (this.isConnected())
                        this.refreshCloudData();
                }
            }
            catch (err) {
                const error = (0, error_1.ensureError)(err);
                this.log.error(`Error processing server push notification for device/station/house removal`, error);
            }
            this.getStations().then((stations) => {
                stations.forEach(station => {
                    try {
                        station.processPushNotification(message);
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error(`Error processing push notification for station ${station.getSerial()}`, error);
                    }
                });
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                this.log.error("Process push notification for stations", error);
            });
            this.getDevices().then((devices) => {
                devices.forEach(device => {
                    try {
                        device.processPushNotification(message, this.config.eventDurationSeconds);
                    }
                    catch (err) {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error(`Error processing push notification for device ${device.getSerial()}`, error);
                    }
                });
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                this.log.error("Process push notification for devices", error);
            });
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error("OnPushMessage Generic Error", error);
        }
    }
    async startStationDownload(deviceSN, path, cipherID) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStartDownload))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStartDownload, path: path, cipherID: cipherID } });
        if (!station.isDownloading(device)) {
            await station.startDownload(device, path, cipherID);
        }
        else {
            this.log.warn(`The station is already downloading a video for the device ${deviceSN}!`);
        }
    }
    async cancelStationDownload(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceCancelDownload))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceCancelDownload } });
        if (station.isConnected() && station.isDownloading(device)) {
            await station.cancelDownload(device);
        }
        else {
            this.log.warn(`The station isn't downloading a video for the device ${deviceSN}!`);
        }
    }
    getConfig() {
        return this.config;
    }
    async setDeviceProperty(deviceSN, name, value) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        const metadata = device.getPropertyMetadata(name);
        value = (0, utils_1.parseValue)(metadata, value);
        switch (name) {
            case types_1.PropertyName.DeviceEnabled:
                await station.enableDevice(device, value);
                break;
            case types_1.PropertyName.DeviceStatusLed:
                await station.setStatusLed(device, value);
                break;
            case types_1.PropertyName.DeviceAutoNightvision:
                await station.setAutoNightVision(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetection:
                await station.setMotionDetection(device, value);
                break;
            case types_1.PropertyName.DeviceSoundDetection:
                await station.setSoundDetection(device, value);
                break;
            case types_1.PropertyName.DevicePetDetection:
                await station.setPetDetection(device, value);
                break;
            case types_1.PropertyName.DeviceRTSPStream:
                await station.setRTSPStream(device, value);
                break;
            case types_1.PropertyName.DeviceAntitheftDetection:
                await station.setAntiTheftDetection(device, value);
                break;
            case types_1.PropertyName.DeviceLocked:
                await station.lockDevice(device, value);
                break;
            case types_1.PropertyName.DeviceWatermark:
                await station.setWatermark(device, value);
                break;
            case types_1.PropertyName.DeviceLight:
                await station.switchLight(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsEnable:
                await station.setFloodlightLightSettingsEnable(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsBrightnessManual:
                await station.setFloodlightLightSettingsBrightnessManual(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsBrightnessMotion:
                await station.setFloodlightLightSettingsBrightnessMotion(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsBrightnessSchedule:
                await station.setFloodlightLightSettingsBrightnessSchedule(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionTriggered:
                await station.setFloodlightLightSettingsMotionTriggered(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionTriggeredDistance:
                await station.setFloodlightLightSettingsMotionTriggeredDistance(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionTriggeredTimer:
                await station.setFloodlightLightSettingsMotionTriggeredTimer(device, value);
                break;
            case types_1.PropertyName.DeviceMicrophone:
                await station.setMicMute(device, value);
                break;
            case types_1.PropertyName.DeviceSpeaker:
                await station.enableSpeaker(device, value);
                break;
            case types_1.PropertyName.DeviceSpeakerVolume:
                await station.setSpeakerVolume(device, value);
                break;
            case types_1.PropertyName.DeviceAudioRecording:
                await station.setAudioRecording(device, value);
                break;
            case types_1.PropertyName.DevicePowerSource:
                await station.setPowerSource(device, value);
                break;
            case types_1.PropertyName.DevicePowerWorkingMode:
                await station.setPowerWorkingMode(device, value);
                break;
            case types_1.PropertyName.DeviceRecordingEndClipMotionStops:
                await station.setRecordingEndClipMotionStops(device, value);
                break;
            case types_1.PropertyName.DeviceRecordingClipLength:
                await station.setRecordingClipLength(device, value);
                break;
            case types_1.PropertyName.DeviceRecordingRetriggerInterval:
                await station.setRecordingRetriggerInterval(device, value);
                break;
            case types_1.PropertyName.DeviceVideoStreamingQuality:
                await station.setVideoStreamingQuality(device, value);
                break;
            case types_1.PropertyName.DeviceVideoRecordingQuality:
                await station.setVideoRecordingQuality(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivity:
                await station.setMotionDetectionSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionTracking:
                await station.setMotionTracking(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionType:
                await station.setMotionDetectionType(device, value);
                break;
            case types_1.PropertyName.DeviceMotionZone:
                await station.setMotionZone(device, value);
                break;
            case types_1.PropertyName.DeviceVideoWDR:
                await station.setWDR(device, value);
                break;
            case types_1.PropertyName.DeviceRingtoneVolume:
                await station.setRingtoneVolume(device, value);
                break;
            case types_1.PropertyName.DeviceChimeIndoor:
                await station.enableIndoorChime(device, value);
                break;
            case types_1.PropertyName.DeviceChimeHomebase:
                await station.enableHomebaseChime(device, value);
                break;
            case types_1.PropertyName.DeviceChimeHomebaseRingtoneVolume:
                await station.setHomebaseChimeRingtoneVolume(device, value);
                break;
            case types_1.PropertyName.DeviceChimeHomebaseRingtoneType:
                await station.setHomebaseChimeRingtoneType(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationType:
                await station.setNotificationType(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationPerson:
                await station.setNotificationPerson(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationPet:
                await station.setNotificationPet(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationAllOtherMotion:
                await station.setNotificationAllOtherMotion(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationAllSound:
                await station.setNotificationAllSound(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationCrying:
                await station.setNotificationCrying(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationMotion:
                await station.setNotificationMotion(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationRing:
                await station.setNotificationRing(device, value);
                break;
            case types_1.PropertyName.DeviceChirpVolume:
                await station.setChirpVolume(device, value);
                break;
            case types_1.PropertyName.DeviceChirpTone:
                await station.setChirpTone(device, value);
                break;
            case types_1.PropertyName.DeviceVideoHDR:
                await station.setHDR(device, value);
                break;
            case types_1.PropertyName.DeviceVideoDistortionCorrection:
                await station.setDistortionCorrection(device, value);
                break;
            case types_1.PropertyName.DeviceVideoRingRecord:
                await station.setRingRecord(device, value);
                break;
            case types_1.PropertyName.DeviceRotationSpeed:
                await station.setPanAndTiltRotationSpeed(device, value);
                break;
            case types_1.PropertyName.DeviceNightvision:
                await station.setNightVision(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionRange:
                await station.setMotionDetectionRange(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionRangeStandardSensitivity:
                await station.setMotionDetectionRangeStandardSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionRangeAdvancedLeftSensitivity:
                await station.setMotionDetectionRangeAdvancedLeftSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionRangeAdvancedMiddleSensitivity:
                await station.setMotionDetectionRangeAdvancedMiddleSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionRangeAdvancedRightSensitivity:
                await station.setMotionDetectionRangeAdvancedRightSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionTestMode:
                await station.setMotionDetectionTestMode(device, value);
                break;
            case types_1.PropertyName.DeviceMotionTrackingSensitivity:
                await station.setMotionTrackingSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceMotionAutoCruise:
                await station.setMotionAutoCruise(device, value);
                break;
            case types_1.PropertyName.DeviceMotionOutOfViewDetection:
                await station.setMotionOutOfViewDetection(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsColorTemperatureManual:
                await station.setLightSettingsColorTemperatureManual(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsColorTemperatureMotion:
                await station.setLightSettingsColorTemperatureMotion(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsColorTemperatureSchedule:
                await station.setLightSettingsColorTemperatureSchedule(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionActivationMode:
                await station.setLightSettingsMotionActivationMode(device, value);
                break;
            case types_1.PropertyName.DeviceVideoNightvisionImageAdjustment:
                await station.setVideoNightvisionImageAdjustment(device, value);
                break;
            case types_1.PropertyName.DeviceVideoColorNightvision:
                await station.setVideoColorNightvision(device, value);
                break;
            case types_1.PropertyName.DeviceAutoCalibration:
                await station.setAutoCalibration(device, value);
                break;
            case types_1.PropertyName.DeviceAutoLock:
                await station.setAutoLock(device, value);
                break;
            case types_1.PropertyName.DeviceAutoLockSchedule:
                await station.setAutoLockSchedule(device, value);
                break;
            case types_1.PropertyName.DeviceAutoLockScheduleStartTime:
                await station.setAutoLockScheduleStartTime(device, value);
                break;
            case types_1.PropertyName.DeviceAutoLockScheduleEndTime:
                await station.setAutoLockScheduleEndTime(device, value);
                break;
            case types_1.PropertyName.DeviceAutoLockTimer:
                await station.setAutoLockTimer(device, value);
                break;
            case types_1.PropertyName.DeviceOneTouchLocking:
                await station.setOneTouchLocking(device, value);
                break;
            case types_1.PropertyName.DeviceSound:
                await station.setSound(device, value);
                break;
            case types_1.PropertyName.DeviceNotification:
                await station.setNotification(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationLocked:
                await station.setNotificationLocked(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationUnlocked:
                await station.setNotificationUnlocked(device, value);
                break;
            case types_1.PropertyName.DeviceScramblePasscode:
                await station.setScramblePasscode(device, value);
                break;
            case types_1.PropertyName.DeviceWrongTryProtection:
                await station.setWrongTryProtection(device, value);
                break;
            case types_1.PropertyName.DeviceWrongTryAttempts:
                await station.setWrongTryAttempts(device, value);
                break;
            case types_1.PropertyName.DeviceWrongTryLockdownTime:
                await station.setWrongTryLockdownTime(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringDetection:
                await station.setLoiteringDetection(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringDetectionRange:
                await station.setLoiteringDetectionRange(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringDetectionLength:
                await station.setLoiteringDetectionLength(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponse:
                await station.setLoiteringCustomResponseAutoVoiceResponse(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponseHomeBaseNotification:
                await station.setLoiteringCustomResponseHomeBaseNotification(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponsePhoneNotification:
                await station.setLoiteringCustomResponsePhoneNotification(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponseAutoVoiceResponseVoice:
                await station.setLoiteringCustomResponseAutoVoiceResponseVoice(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponseTimeFrom:
                await station.setLoiteringCustomResponseTimeFrom(device, value);
                break;
            case types_1.PropertyName.DeviceLoiteringCustomResponseTimeTo:
                await station.setLoiteringCustomResponseTimeTo(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityMode:
                await station.setMotionDetectionSensitivityMode(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityStandard:
                await station.setMotionDetectionSensitivityStandard(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedA:
                await station.setMotionDetectionSensitivityAdvancedA(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedB:
                await station.setMotionDetectionSensitivityAdvancedB(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedC:
                await station.setMotionDetectionSensitivityAdvancedC(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedD:
                await station.setMotionDetectionSensitivityAdvancedD(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedE:
                await station.setMotionDetectionSensitivityAdvancedE(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedF:
                await station.setMotionDetectionSensitivityAdvancedF(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedG:
                await station.setMotionDetectionSensitivityAdvancedG(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionSensitivityAdvancedH:
                await station.setMotionDetectionSensitivityAdvancedH(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuard:
                await station.setDeliveryGuard(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardPackageGuarding:
                await station.setDeliveryGuardPackageGuarding(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardPackageGuardingVoiceResponseVoice:
                await station.setDeliveryGuardPackageGuardingVoiceResponseVoice(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeFrom:
                await station.setDeliveryGuardPackageGuardingActivatedTimeFrom(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardPackageGuardingActivatedTimeTo:
                await station.setDeliveryGuardPackageGuardingActivatedTimeTo(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlert:
                await station.setDeliveryGuardUncollectedPackageAlert(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardPackageLiveCheckAssistance:
                await station.setDeliveryGuardPackageLiveCheckAssistance(device, value);
                break;
            case types_1.PropertyName.DeviceDualCamWatchViewMode:
                await station.setDualCamWatchViewMode(device, value);
                break;
            case types_1.PropertyName.DeviceRingAutoResponse:
                await station.setRingAutoResponse(device, value);
                break;
            case types_1.PropertyName.DeviceRingAutoResponseVoiceResponse:
                await station.setRingAutoResponseVoiceResponse(device, value);
                break;
            case types_1.PropertyName.DeviceRingAutoResponseVoiceResponseVoice:
                await station.setRingAutoResponseVoiceResponseVoice(device, value);
                break;
            case types_1.PropertyName.DeviceRingAutoResponseTimeFrom:
                await station.setRingAutoResponseTimeFrom(device, value);
                break;
            case types_1.PropertyName.DeviceRingAutoResponseTimeTo:
                await station.setRingAutoResponseTimeTo(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationRadarDetector:
                await station.setNotificationRadarDetector(device, value);
                break;
            case types_1.PropertyName.DeviceSoundDetectionSensitivity:
                await station.setSoundDetectionSensitivity(device, value);
                break;
            case types_1.PropertyName.DeviceContinuousRecording:
                await station.setContinuousRecording(device, value);
                break;
            case types_1.PropertyName.DeviceContinuousRecordingType:
                await station.setContinuousRecordingType(device, value);
                break;
            case types_1.PropertyName.DeviceDefaultAngle:
                await station.enableDefaultAngle(device, value);
                break;
            case types_1.PropertyName.DeviceDefaultAngleIdleTime:
                await station.setDefaultAngleIdleTime(device, value);
                break;
            case types_1.PropertyName.DeviceNotificationIntervalTime:
                await station.setNotificationIntervalTime(device, value);
                break;
            case types_1.PropertyName.DeviceSoundDetectionRoundLook:
                await station.setSoundDetectionRoundLook(device, value);
                break;
            case types_1.PropertyName.DeviceDeliveryGuardUncollectedPackageAlertTimeToCheck:
                await station.setDeliveryGuardUncollectedPackageAlertTimeToCheck(device, value);
                break;
            case types_1.PropertyName.DeviceLeftOpenAlarm:
            case types_1.PropertyName.DeviceLeftOpenAlarmDuration:
            case types_1.PropertyName.DeviceDualUnlock:
            case types_1.PropertyName.DevicePowerSave:
            case types_1.PropertyName.DeviceInteriorBrightness:
            case types_1.PropertyName.DeviceInteriorBrightnessDuration:
            case types_1.PropertyName.DeviceTamperAlarm:
            case types_1.PropertyName.DeviceRemoteUnlock:
            case types_1.PropertyName.DeviceRemoteUnlockMasterPIN:
            case types_1.PropertyName.DeviceAlarmVolume:
            case types_1.PropertyName.DevicePromptVolume:
            case types_1.PropertyName.DeviceNotificationUnlockByKey:
            case types_1.PropertyName.DeviceNotificationUnlockByPIN:
            case types_1.PropertyName.DeviceNotificationUnlockByFingerprint:
            case types_1.PropertyName.DeviceNotificationUnlockByApp:
            case types_1.PropertyName.DeviceNotificationDualUnlock:
            case types_1.PropertyName.DeviceNotificationDualLock:
            case types_1.PropertyName.DeviceNotificationWrongTryProtect:
            case types_1.PropertyName.DeviceNotificationJammed:
                await station.setSmartSafeParams(device, name, value);
                break;
            case types_1.PropertyName.DeviceVideoTypeStoreToNAS:
                await station.setVideoTypeStoreToNAS(device, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionTypeHumanRecognition:
                await station.setMotionDetectionTypeHB3(device, types_1.HB3DetectionTypes.HUMAN_RECOGNITION, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionTypeHuman:
                if (device.isWallLightCam()) {
                    await station.setMotionDetectionTypeHuman(device, value);
                }
                else {
                    await station.setMotionDetectionTypeHB3(device, types_1.HB3DetectionTypes.HUMAN_DETECTION, value);
                }
                break;
            case types_1.PropertyName.DeviceMotionDetectionTypePet:
                await station.setMotionDetectionTypeHB3(device, types_1.HB3DetectionTypes.PET_DETECTION, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionTypeVehicle:
                await station.setMotionDetectionTypeHB3(device, types_1.HB3DetectionTypes.VEHICLE_DETECTION, value);
                break;
            case types_1.PropertyName.DeviceMotionDetectionTypeAllOtherMotions:
                if (device.isWallLightCam()) {
                    await station.setMotionDetectionTypeAllOtherMotions(device, value);
                }
                else {
                    await station.setMotionDetectionTypeHB3(device, types_1.HB3DetectionTypes.ALL_OTHER_MOTION, value);
                }
                break;
            case types_1.PropertyName.DeviceLightSettingsManualLightingActiveMode:
                await station.setLightSettingsManualLightingActiveMode(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsManualDailyLighting:
                await station.setLightSettingsManualDailyLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsManualColoredLighting:
                await station.setLightSettingsManualColoredLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsManualDynamicLighting:
                await station.setLightSettingsManualDynamicLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionLightingActiveMode:
                await station.setLightSettingsMotionLightingActiveMode(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionDailyLighting:
                await station.setLightSettingsMotionDailyLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionColoredLighting:
                await station.setLightSettingsMotionColoredLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsMotionDynamicLighting:
                await station.setLightSettingsMotionDynamicLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsScheduleLightingActiveMode:
                await station.setLightSettingsScheduleLightingActiveMode(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsScheduleDailyLighting:
                await station.setLightSettingsScheduleDailyLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsScheduleColoredLighting:
                await station.setLightSettingsScheduleColoredLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsScheduleDynamicLighting:
                await station.setLightSettingsScheduleDynamicLighting(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsColoredLightingColors:
                await station.setLightSettingsColoredLightingColors(device, value);
                break;
            case types_1.PropertyName.DeviceLightSettingsDynamicLightingThemes:
                await station.setLightSettingsDynamicLightingThemes(device, value);
                break;
            case types_1.PropertyName.DeviceDoorControlWarning:
                await station.setDoorControlWarning(device, value);
                break;
            case types_1.PropertyName.DeviceDoor1Open:
                await station.openDoor(device, value, 1);
                break;
            case types_1.PropertyName.DeviceDoor2Open:
                await station.openDoor(device, value, 2);
                break;
            default:
                if (!Object.values(types_1.PropertyName).includes(name))
                    throw new error_1.ReadOnlyPropertyError("Property is read only", { context: { device: deviceSN, propertyName: name, propertyValue: value } });
                throw new error_2.InvalidPropertyError("Device has no writable property", { context: { device: deviceSN, propertyName: name, propertyValue: value } });
        }
    }
    async setStationProperty(stationSN, name, value) {
        const station = await this.getStation(stationSN);
        const metadata = station.getPropertyMetadata(name);
        value = (0, utils_1.parseValue)(metadata, value);
        switch (name) {
            case types_1.PropertyName.StationGuardMode:
                await station.setGuardMode(value);
                break;
            case types_1.PropertyName.StationAlarmTone:
                await station.setStationAlarmTone(value);
                break;
            case types_1.PropertyName.StationAlarmVolume:
                await station.setStationAlarmRingtoneVolume(value);
                break;
            case types_1.PropertyName.StationPromptVolume:
                await station.setStationPromptVolume(value);
                break;
            case types_1.PropertyName.StationNotificationSwitchModeApp:
                await station.setStationNotificationSwitchMode(types_1.NotificationSwitchMode.APP, value);
                break;
            case types_1.PropertyName.StationNotificationSwitchModeGeofence:
                await station.setStationNotificationSwitchMode(types_1.NotificationSwitchMode.GEOFENCE, value);
                break;
            case types_1.PropertyName.StationNotificationSwitchModeSchedule:
                await station.setStationNotificationSwitchMode(types_1.NotificationSwitchMode.SCHEDULE, value);
                break;
            case types_1.PropertyName.StationNotificationSwitchModeKeypad:
                await station.setStationNotificationSwitchMode(types_1.NotificationSwitchMode.KEYPAD, value);
                break;
            case types_1.PropertyName.StationNotificationStartAlarmDelay:
                await station.setStationNotificationStartAlarmDelay(value);
                break;
            case types_1.PropertyName.StationTimeFormat:
                await station.setStationTimeFormat(value);
                break;
            case types_1.PropertyName.StationSwitchModeWithAccessCode:
                await station.setStationSwitchModeWithAccessCode(value);
                break;
            case types_1.PropertyName.StationAutoEndAlarm:
                await station.setStationAutoEndAlarm(value);
                break;
            case types_1.PropertyName.StationTurnOffAlarmWithButton:
                await station.setStationTurnOffAlarmWithButton(value);
                break;
            default:
                if (!Object.values(types_1.PropertyName).includes(name))
                    throw new error_1.ReadOnlyPropertyError("Property is read only", { context: { station: stationSN, propertyName: name, propertyValue: value } });
                throw new error_2.InvalidPropertyError("Station has no writable property", { context: { station: stationSN, propertyName: name, propertyValue: value } });
        }
    }
    onStartStationLivestream(station, channel, metadata, videostream, audiostream) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station livestream start", station, device, metadata, videostream, audiostream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station start livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStopStationLivestream(station, channel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station livestream stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station stop livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onErrorStationLivestream(station, channel, _error) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            station.stopLivestream(device).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                this.log.error(`Station livestream error (station: ${station.getSerial()} channel: ${channel} error: ${_error}})`, error);
            });
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station livestream error (station: ${station.getSerial()} channel: ${channel} error: ${_error}})`, error);
        });
    }
    onStartStationRTSPLivestream(station, channel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream start", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station start rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStopStationRTSPLivestream(station, channel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp livestream stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station stop rtsp livestream error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationStartDownload(station, channel, metadata, videoStream, audioStream) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station download start", station, device, metadata, videoStream, audioStream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station start download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationFinishDownload(station, channel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station download finish", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station finish download error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationCommandResult(station, result) {
        this.emit("station command result", station, result);
        if (result.return_code === 0) {
            if (result.customData !== undefined && result.customData.onSuccess !== undefined) {
                try {
                    result.customData.onSuccess();
                }
                catch (err) {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Station command result (station: ${station.getSerial()}) - onSuccess callback error`, error);
                }
            }
            this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                if ((result.customData !== undefined && result.customData.property !== undefined && !device.isLockWifiR10() && !device.isLockWifiR20() && !device.isLockWifiVideo() && !device.isSmartSafe()) ||
                    (result.customData !== undefined && result.customData.property !== undefined && device.isSmartSafe() && result.command_type !== types_2.CommandType.CMD_SMARTSAFE_SETTINGS)) {
                    if (device.hasProperty(result.customData.property.name)) {
                        const metadata = device.getPropertyMetadata(result.customData.property.name);
                        if (typeof result.customData.property.value !== "object" || metadata.type === "object") {
                            device.updateProperty(result.customData.property.name, result.customData.property.value);
                        }
                    }
                    else if (station.hasProperty(result.customData.property.name)) {
                        const metadata = station.getPropertyMetadata(result.customData.property.name);
                        if (typeof result.customData.property.value !== "object" || metadata.type === "object") {
                            station.updateProperty(result.customData.property.name, result.customData.property.value);
                        }
                    }
                }
                else if (result.customData !== undefined && result.customData.command !== undefined && result.customData.command.name === types_1.CommandName.DeviceSnooze) {
                    const snoozeTime = result.customData.command.value !== undefined && result.customData.command.value.snooze_time !== undefined ? result.customData.command.value.snooze_time : 0;
                    if (snoozeTime > 0) {
                        device.updateProperty(types_1.PropertyName.DeviceSnooze, true);
                        device.updateProperty(types_1.PropertyName.DeviceSnoozeTime, snoozeTime);
                    }
                    this.api.refreshAllData().then(() => {
                        const snoozeStartTime = device.getPropertyValue(types_1.PropertyName.DeviceSnoozeStartTime);
                        const currentTime = Math.trunc(new Date().getTime() / 1000);
                        let timeoutMS;
                        if (snoozeStartTime !== undefined && snoozeStartTime !== 0) {
                            timeoutMS = (snoozeStartTime + snoozeTime - currentTime) * 1000;
                        }
                        else {
                            timeoutMS = snoozeTime * 1000;
                        }
                        this.deviceSnoozeTimeout[device.getSerial()] = setTimeout(() => {
                            device.updateProperty(types_1.PropertyName.DeviceSnooze, false);
                            device.updateProperty(types_1.PropertyName.DeviceSnoozeTime, 0);
                            device.updateProperty(types_1.PropertyName.DeviceSnoozeStartTime, 0);
                            if (device.hasProperty(types_1.PropertyName.DeviceSnoozeHomebase)) {
                                device.updateProperty(types_1.PropertyName.DeviceSnoozeHomebase, false);
                            }
                            if (device.hasProperty(types_1.PropertyName.DeviceSnoozeMotion)) {
                                device.updateProperty(types_1.PropertyName.DeviceSnoozeMotion, false);
                            }
                            if (device.hasProperty(types_1.PropertyName.DeviceSnoozeChime)) {
                                device.updateProperty(types_1.PropertyName.DeviceSnoozeChime, false);
                            }
                            delete this.deviceSnoozeTimeout[device.getSerial()];
                        }, timeoutMS);
                    }).catch(err => {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error("Error during API data refreshing", error);
                    });
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    this.log.error(`Station command result error (station: ${station.getSerial()})`, error);
                }
            });
            if (station.isIntegratedDevice() && result.command_type === types_2.CommandType.CMD_SET_ARMING && station.isConnected() && station.getDeviceType() !== types_1.DeviceType.DOORBELL) {
                station.getCameraInfo();
            }
        }
        else {
            if (result.customData !== undefined && result.customData.onFailure !== undefined) {
                try {
                    result.customData.onFailure();
                }
                catch (err) {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Station command result (station: ${station.getSerial()}) - onFailure callback error`, error);
                }
            }
        }
        if (result.customData !== undefined && result.customData.command !== undefined) {
            const customValue = result.customData.command.value;
            switch (result.customData.command.name) {
                case types_1.CommandName.DeviceAddUser:
                    this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user added", device, customValue.username, customValue.schedule);
                                break;
                            case 4:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError("Passcode already used by another user, please choose a different one", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule } }));
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.AddUserError("Error creating user", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule, returnode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case types_1.CommandName.DeviceDeleteUser:
                    this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.api.deleteUser(device.getSerial(), customValue.short_user_id, device.getStationSerial()).then((result) => {
                                    if (result) {
                                        this.emit("user deleted", device, customValue.username);
                                    }
                                    else {
                                        this.emit("user error", device, customValue.username, new error_1.DeleteUserError("Error in deleting user through cloud api call", { context: { device: device.getSerial(), username: customValue.username, shortUserId: customValue.short_user_id } }));
                                    }
                                });
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.DeleteUserError("Error deleting user", { context: { device: device.getSerial(), username: customValue.username, shortUserId: customValue.short_user_id, returnCode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case types_1.CommandName.DeviceUpdateUserPasscode:
                    this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user passcode updated", device, customValue.username);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserPasscodeError("Error updating user passcode", { context: { device: device.getSerial(), username: customValue.username, returnCode: result.return_code } }));
                                break;
                        }
                    });
                    break;
                case types_1.CommandName.DeviceUpdateUserSchedule:
                    this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                        switch (result.return_code) {
                            case 0:
                                this.emit("user schedule updated", device, customValue.username, customValue.schedule);
                                break;
                            default:
                                this.emit("user error", device, customValue.username, new error_1.UpdateUserScheduleError("Error updating user schedule", { context: { device: device.getSerial(), username: customValue.username, schedule: customValue.schedule, returnCode: result.return_code } }));
                                break;
                        }
                    });
                    break;
            }
        }
    }
    onStationSecondaryCommandResult(station, result) {
        if (result.return_code === 0) {
            this.getStationDevice(station.getSerial(), result.channel).then((device) => {
                if (result.customData !== undefined && result.customData.property !== undefined) {
                    if (device.hasProperty(result.customData.property.name))
                        device.updateProperty(result.customData.property.name, result.customData.property.value);
                    else if (station.hasProperty(result.customData.property.name)) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
            }).catch((err) => {
                const error = (0, error_1.ensureError)(err);
                if (error instanceof error_1.DeviceNotFoundError) {
                    if (result.customData !== undefined && result.customData.property !== undefined) {
                        station.updateProperty(result.customData.property.name, result.customData.property.value);
                    }
                }
                else {
                    this.log.error(`Station secondary command result error (station: ${station.getSerial()})`, error);
                }
            });
        }
    }
    onStationRtspUrl(station, channel, value) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station rtsp url", station, device, value);
            device.setCustomPropertyValue(types_1.PropertyName.DeviceRTSPStreamUrl, value);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station rtsp url error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationGuardMode(station, guardMode) {
        this.emit("station guard mode", station, guardMode);
    }
    onStationCurrentMode(station, currentMode) {
        this.emit("station current mode", station, currentMode);
    }
    onStationPropertyChanged(station, name, value, ready) {
        if (ready && !name.startsWith("hidden-")) {
            this.emit("station property changed", station, name, value);
        }
    }
    onStationRawPropertyChanged(station, type, value) {
        this.emit("station raw property changed", station, type, value);
    }
    onStationAlarmEvent(station, alarmEvent) {
        this.emit("station alarm event", station, alarmEvent);
    }
    onStationAlarmDelayEvent(station, alarmDelayEvent, alarmDelay) {
        this.emit("station alarm delay event", station, alarmDelayEvent, alarmDelay);
    }
    onStationArmDelayEvent(station, armDelay) {
        this.emit("station alarm arm delay event", station, armDelay);
    }
    onStationAlarmArmedEvent(station) {
        this.emit("station alarm armed", station);
    }
    onDevicePropertyChanged(device, name, value, ready) {
        try {
            if (ready && !name.startsWith("hidden-")) {
                this.emit("device property changed", device, name, value);
            }
            if (name === types_1.PropertyName.DeviceRTSPStream && value === true && (device.getPropertyValue(types_1.PropertyName.DeviceRTSPStreamUrl) === undefined || (device.getPropertyValue(types_1.PropertyName.DeviceRTSPStreamUrl) !== undefined && device.getPropertyValue(types_1.PropertyName.DeviceRTSPStreamUrl) === ""))) {
                this.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Device property changed error (device: ${device.getSerial()} name: ${name}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
            else if (name === types_1.PropertyName.DeviceRTSPStream && value === false) {
                device.setCustomPropertyValue(types_1.PropertyName.DeviceRTSPStreamUrl, "");
            }
            else if (name === types_1.PropertyName.DevicePictureUrl && value !== "") {
                this.getStation(device.getStationSerial()).then((station) => {
                    if (station.hasCommand(types_1.CommandName.StationDownloadImage)) {
                        station.downloadImage(value);
                    }
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Device property changed error (device: ${device.getSerial()} name: ${name}) - station download image (station: ${device.getStationSerial()} image_path: ${value})`, error);
                });
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Device property changed error (device: ${device.getSerial()} name: ${name})`, error);
        }
    }
    onDeviceRawPropertyChanged(device, type, value) {
        this.emit("device raw property changed", device, type, value);
    }
    onDeviceCryingDetected(device, state) {
        this.emit("device crying detected", device, state);
    }
    onDeviceSoundDetected(device, state) {
        this.emit("device sound detected", device, state);
    }
    onDevicePetDetected(device, state) {
        this.emit("device pet detected", device, state);
    }
    onDeviceVehicleDetected(device, state) {
        this.emit("device vehicle detected", device, state);
    }
    onDeviceMotionDetected(device, state) {
        this.emit("device motion detected", device, state);
    }
    onDevicePersonDetected(device, state, person) {
        this.emit("device person detected", device, state, person);
    }
    onDeviceRings(device, state) {
        this.emit("device rings", device, state);
    }
    onDeviceLocked(device, state) {
        this.emit("device locked", device, state);
    }
    onDeviceOpen(device, state) {
        this.emit("device open", device, state);
    }
    onDevicePackageDelivered(device, state) {
        this.emit("device package delivered", device, state);
    }
    onDevicePackageStranded(device, state) {
        this.emit("device package stranded", device, state);
    }
    onDevicePackageTaken(device, state) {
        this.emit("device package taken", device, state);
    }
    onDeviceSomeoneLoitering(device, state) {
        this.emit("device someone loitering", device, state);
    }
    onDeviceRadarMotionDetected(device, state) {
        this.emit("device radar motion detected", device, state);
    }
    onDevice911Alarm(device, state, detail) {
        this.emit("device 911 alarm", device, state, detail);
    }
    onDeviceShakeAlarm(device, state, detail) {
        this.emit("device shake alarm", device, state, detail);
    }
    onDeviceWrongTryProtectAlarm(device, state) {
        this.emit("device wrong try-protect alarm", device, state);
    }
    onDeviceLongTimeNotClose(device, state) {
        this.emit("device long time not close", device, state);
    }
    onDeviceLowBattery(device, state) {
        this.emit("device low battery", device, state);
    }
    onDeviceJammed(device, state) {
        this.emit("device jammed", device, state);
    }
    onDeviceStrangerPersonDetected(device, state) {
        this.emit("device stranger person detected", device, state);
    }
    onDeviceDogDetected(device, state) {
        this.emit("device dog detected", device, state);
    }
    onDeviceDogLickDetected(device, state) {
        this.emit("device dog lick detected", device, state);
    }
    onDeviceDogPoopDetected(device, state) {
        this.emit("device dog poop detected", device, state);
    }
    onDeviceReady(device) {
        try {
            if (device.getPropertyValue(types_1.PropertyName.DeviceRTSPStream) !== undefined && device.getPropertyValue(types_1.PropertyName.DeviceRTSPStream) === true) {
                this.getStation(device.getStationSerial()).then((station) => {
                    station.setRTSPStream(device, true);
                }).catch((err) => {
                    const error = (0, error_1.ensureError)(err);
                    this.log.error(`Device ready error (device: ${device.getSerial()}) - station enable rtsp (station: ${device.getStationSerial()})`, error);
                });
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Device ready error (device: ${device.getSerial()})`, error);
        }
    }
    onStationRuntimeState(station, channel, batteryLevel, temperature) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(types_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(types_1.PropertyName.DeviceBattery);
                device.updateRawProperty(metadataBattery.key, batteryLevel.toString(), "p2p");
            }
            if (device.hasProperty(types_1.PropertyName.DeviceBatteryTemp)) {
                const metadataBatteryTemperature = device.getPropertyMetadata(types_1.PropertyName.DeviceBatteryTemp);
                device.updateRawProperty(metadataBatteryTemperature.key, temperature.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station runtime state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationChargingState(station, channel, chargeType, batteryLevel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(types_1.PropertyName.DeviceBattery)) {
                const metadataBattery = device.getPropertyMetadata(types_1.PropertyName.DeviceBattery);
                if (chargeType !== types_2.ChargingType.PLUGGED && batteryLevel > 0)
                    device.updateRawProperty(metadataBattery.key, batteryLevel.toString(), "p2p");
            }
            if (device.hasProperty(types_1.PropertyName.DeviceChargingStatus)) {
                const metadataChargingStatus = device.getPropertyMetadata(types_1.PropertyName.DeviceChargingStatus);
                device.updateRawProperty(metadataChargingStatus.key, chargeType.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station charging state error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationWifiRssi(station, channel, rssi) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(types_1.PropertyName.DeviceWifiRSSI)) {
                const metadataWifiRssi = device.getPropertyMetadata(types_1.PropertyName.DeviceWifiRSSI);
                device.updateRawProperty(metadataWifiRssi.key, rssi.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station wifi rssi error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onCaptchaRequest(id, captcha) {
        this.emit("captcha request", id, captcha);
    }
    onFloodlightManualSwitch(station, channel, enabled) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(types_1.PropertyName.DeviceLight)) {
                const metadataLight = device.getPropertyMetadata(types_1.PropertyName.DeviceLight);
                device.updateRawProperty(metadataLight.key, enabled === true ? "1" : "0", "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station floodlight manual switch error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onAuthTokenInvalidated() {
        this.persistentData.cloud_token = undefined;
        this.persistentData.cloud_token_expiration = undefined;
        this.writePersistentData();
    }
    onTfaRequest() {
        this.emit("tfa request");
    }
    onStationTalkbackStart(station, channel, talkbackStream) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station talkback start", station, device, talkbackStream);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station talkback start error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationTalkbackStop(station, channel) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            this.emit("station talkback stop", station, device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station talkback stop error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationTalkbackError(station, channel, _error) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            station.stopTalkback(device);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station talkback error (station: ${station.getSerial()} channel: ${channel} error: ${_error}})`, error);
        });
    }
    async startStationTalkback(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStartTalkback))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStartTalkback } });
        if (station.isLiveStreaming(device)) {
            if (!station.isTalkbackOngoing(device)) {
                station.startTalkback(device);
            }
            else {
                this.log.warn(`The station talkback for the device ${deviceSN} cannot be started, because it is ongoing!`);
            }
        }
        else {
            this.log.warn(`The station talkback for the device ${deviceSN} cannot be started, because it isn't live streaming!`);
        }
    }
    async stopStationTalkback(deviceSN) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceStopTalkback))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceStopTalkback } });
        if (station.isLiveStreaming(device)) {
            if (station.isTalkbackOngoing(device)) {
                station.stopTalkback(device);
            }
            else {
                this.log.warn(`The station talkback for the device ${deviceSN} cannot be stopped, because it isn't ongoing!`);
            }
        }
        else {
            this.log.warn(`The station talkback for the device ${deviceSN} cannot be stopped, because it isn't live streaming!`);
        }
    }
    onStationDeviceShakeAlarm(deviceSN, event) {
        this.getDevice(deviceSN).then((device) => {
            if (device.isSmartSafe())
                device.shakeEvent(event, this.config.eventDurationSeconds);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationShakeAlarm device ${deviceSN} error`, error);
        });
    }
    onStationDevice911Alarm(deviceSN, event) {
        this.getDevice(deviceSN).then((device) => {
            if (device.isSmartSafe())
                device.alarm911Event(event, this.config.eventDurationSeconds);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStation911Alarm device ${deviceSN} error`, error);
        });
    }
    onStationDeviceJammed(deviceSN) {
        this.getDevice(deviceSN).then((device) => {
            if (device.isSmartSafe())
                device.jammedEvent(this.config.eventDurationSeconds);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationDeviceJammed device ${deviceSN} error`, error);
        });
    }
    onStationDeviceLowBattery(deviceSN) {
        this.getDevice(deviceSN).then((device) => {
            if (device.isSmartSafe())
                device.lowBatteryEvent(this.config.eventDurationSeconds);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationDeviceLowBattery device ${deviceSN} error`, error);
        });
    }
    onStationDeviceWrongTryProtectAlarm(deviceSN) {
        this.getDevice(deviceSN).then((device) => {
            if (device.isSmartSafe())
                device.wrongTryProtectAlarmEvent(this.config.eventDurationSeconds);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationDeviceWrongTryProtectAlarm device ${deviceSN} error`, error);
        });
    }
    async addUser(deviceSN, username, passcode, schedule) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        try {
            if (!device.hasCommand(types_1.CommandName.DeviceAddUser))
                throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceAddUser, username: username, passcode: "[redacted]", schedule: schedule } });
            const addUserResponse = await this.api.addUser(deviceSN, username, device.getStationSerial());
            if (addUserResponse !== null) {
                await station.addUser(device, username, addUserResponse.short_user_id, passcode, schedule);
            }
            else {
                this.emit("user error", device, username, new error_1.AddUserError("Error on creating user through cloud api call", { context: { deivce: deviceSN, username: username, passcode: "[redacted]", schedule: schedule } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`addUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.AddUserError("Generic error", { cause: error, context: { device: deviceSN, username: username, passcode: "[redacted]", schedule: schedule } }));
        }
    }
    async deleteUser(deviceSN, username) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceDeleteUser))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceDeleteUser, username: username } });
        try {
            const users = await this.api.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.deleteUser(device, user.user_name, user.short_user_id);
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.DeleteUserError("User not found", { context: { device: deviceSN, username: username } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.DeleteUserError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`deleteUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.DeleteUserError("Generic error", { cause: error, context: { device: deviceSN, username: username } }));
        }
    }
    async updateUser(deviceSN, username, newUsername) {
        const device = await this.getDevice(deviceSN);
        if (!device.hasCommand(types_1.CommandName.DeviceUpdateUsername))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceUpdateUsername, usernmae: username, newUsername: newUsername } });
        try {
            const users = await this.api.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        const result = await this.api.updateUser(deviceSN, device.getStationSerial(), user.short_user_id, newUsername);
                        if (result) {
                            this.emit("user username updated", device, username);
                        }
                        else {
                            this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Error in changing username through cloud api call", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserUsernameError("User not found", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username, newUsername: newUsername } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`updateUser device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserUsernameError("Generic error", { cause: error, context: { device: deviceSN, username: username, newUsername: newUsername } }));
        }
    }
    async updateUserPasscode(deviceSN, username, passcode) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceUpdateUserPasscode))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceUpdateUserPasscode, username: username, passcode: "[redacted]" } });
        try {
            const users = await this.api.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.updateUserPasscode(device, user.user_name, user.short_user_id, passcode);
                        found = true;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("User not found", { context: { device: deviceSN, username: username, passcode: "[redacted]" } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username, passcode: "[redacted]" } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`updateUserPasscode device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserPasscodeError("Generic error", { cause: error, context: { device: deviceSN, username: username, passcode: "[redacted]" } }));
        }
    }
    async updateUserSchedule(deviceSN, username, schedule) {
        const device = await this.getDevice(deviceSN);
        const station = await this.getStation(device.getStationSerial());
        if (!device.hasCommand(types_1.CommandName.DeviceUpdateUserSchedule))
            throw new error_1.NotSupportedError("This functionality is not implemented or supported by this device", { context: { device: deviceSN, commandName: types_1.CommandName.DeviceUpdateUserSchedule, usernmae: username, schedule: schedule } });
        try {
            const users = await this.api.getUsers(deviceSN, device.getStationSerial());
            if (users !== null) {
                let found = false;
                for (const user of users) {
                    if (user.user_name === username) {
                        await station.updateUserSchedule(device, user.user_name, user.short_user_id, schedule);
                        found = true;
                    }
                }
                if (!found) {
                    this.emit("user error", device, username, new error_1.UpdateUserScheduleError("User not found", { context: { device: deviceSN, username: username, schedule: schedule } }));
                }
            }
            else {
                this.emit("user error", device, username, new error_1.UpdateUserScheduleError("Error on getting user list through cloud api call", { context: { device: deviceSN, username: username, schedule: schedule } }));
            }
        }
        catch (err) {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`updateUserSchedule device ${deviceSN} error`, error);
            this.emit("user error", device, username, new error_1.UpdateUserScheduleError("Generic error", { cause: error, context: { device: deviceSN, username: username, schedule: schedule } }));
        }
    }
    onStationDevicePinVerified(deviceSN, successfull) {
        this.getDevice(deviceSN).then((device) => {
            this.emit("device pin verified", device, successfull);
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationDevicePinVerified device ${deviceSN} error`, error);
        });
    }
    onStationSdInfoEx(station, sdStatus, sdCapacity, sdCapacityAvailable) {
        if (station.hasProperty(types_1.PropertyName.StationSdStatus)) {
            station.updateProperty(types_1.PropertyName.StationSdStatus, sdStatus);
        }
        if (station.hasProperty(types_1.PropertyName.StationSdCapacity)) {
            station.updateProperty(types_1.PropertyName.StationSdCapacity, sdCapacity);
        }
        if (station.hasProperty(types_1.PropertyName.StationSdCapacityAvailable)) {
            station.updateProperty(types_1.PropertyName.StationSdCapacityAvailable, sdCapacityAvailable);
        }
    }
    onStationImageDownload(station, file, image) {
        const type = (0, image_type_1.default)(image);
        const picture = {
            data: image,
            type: type !== null ? type : { ext: "unknown", mime: "application/octet-stream" }
        };
        this.emit("station image download", station, file, picture);
        this.getDevicesFromStation(station.getSerial()).then((devices) => {
            for (const device of devices) {
                if (device.getPropertyValue(types_1.PropertyName.DevicePictureUrl) === file) {
                    this.log.debug(`onStationImageDownload - Set first picture for device ${device.getSerial()} file: ${file} picture_ext: ${picture.type.ext} picture_mime: ${picture.type.mime}`);
                    device.updateProperty(types_1.PropertyName.DevicePicture, picture);
                    break;
                }
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`onStationImageDownload - Set first picture error`, error);
        });
    }
    onStationDatabaseQueryLatest(station, returnCode, data) {
        if (returnCode === types_2.DatabaseReturnCode.SUCCESSFUL) {
            for (const element of data) {
                if ((element.device_sn !== "" && !station.isStation()) || (station.isStation() && element.device_sn !== station.getSerial())) {
                    this.getDevice(element.device_sn).then((device) => {
                        const raw = device.getRawDevice();
                        if ("crop_local_path" in element) {
                            raw.cover_path = element.crop_local_path;
                        }
                        else if ("crop_cloud_path" in element) {
                            raw.cover_path = element.crop_cloud_path;
                        }
                        device.update(raw);
                    }).catch((err) => {
                        const error = (0, error_1.ensureError)(err);
                        this.log.error("onStationDatabaseQueryLatest Error", error);
                    });
                }
            }
        }
        this.emit("station database query latest", station, returnCode, data);
    }
    onStationDatabaseQueryLocal(station, returnCode, data) {
        this.emit("station database query local", station, returnCode, data);
    }
    onStationDatabaseCountByDate(station, returnCode, data) {
        this.emit("station database count by date", station, returnCode, data);
    }
    onStationDatabaseDelete(station, returnCode, failedIds) {
        this.emit("station database delete", station, returnCode, failedIds);
    }
    onStationSensorStatus(station, channel, status) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            if (device.hasProperty(types_1.PropertyName.DeviceSensorOpen)) {
                const metadataSensorOpen = device.getPropertyMetadata(types_1.PropertyName.DeviceSensorOpen);
                device.updateRawProperty(metadataSensorOpen.key, status.toString(), "p2p");
            }
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station sensor status error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
    onStationGarageDoorStatus(station, channel, doorId, status) {
        this.getStationDevice(station.getSerial(), channel).then((device) => {
            device.updateRawProperty(types_2.CommandType.CMD_CAMERA_GARAGE_DOOR_STATUS, status.toString(), "p2p");
        }).catch((err) => {
            const error = (0, error_1.ensureError)(err);
            this.log.error(`Station garage door status error (station: ${station.getSerial()} channel: ${channel})`, error);
        });
    }
}
exports.EufySecurity = EufySecurity;
//# sourceMappingURL=eufysecurity.js.map