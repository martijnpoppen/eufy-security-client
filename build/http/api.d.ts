/// <reference types="node" />
import { TypedEmitter } from "tiny-typed-emitter";
import { Logger } from "ts-log";
import { TrustDevice, Cipher, EventRecordResponse, ConfirmInvite, SensorHistoryEntry, ApiResponse, HouseDetail, DeviceListResponse, StationListResponse, HouseInviteListResponse, HouseListResponse, PassportProfileResponse, User, AddUserResponse } from "./models";
import { HTTPApiEvents, Ciphers, FullDevices, Hubs, Voices, Invites, HTTPApiRequest, HTTPApiPersistentData, LoginOptions } from "./interfaces";
import { EventFilterType, PublicKeyType, VerfyCodeTypes } from "./types";
export declare class HTTPApi extends TypedEmitter<HTTPApiEvents> {
    private static apiDomainBase;
    private readonly SERVER_PUBLIC_KEY;
    private apiBase;
    private username;
    private password;
    private ecdh;
    private token;
    private tokenExpiration;
    private renewAuthTokenJob?;
    private log;
    private connected;
    private requestEufyCloud;
    private throttle;
    private devices;
    private hubs;
    private houses;
    private persistentData;
    private headers;
    private constructor();
    static getApiBaseFromCloud(country: string): Promise<string>;
    static initialize(country: string, username: string, password: string, log?: Logger, persistentData?: HTTPApiPersistentData): Promise<HTTPApi>;
    private clearScheduleRenewAuthToken;
    private scheduleRenewAuthToken;
    private invalidateToken;
    setPhoneModel(model: string): void;
    getPhoneModel(): string;
    getCountry(): string;
    setLanguage(language: string): void;
    getLanguage(): string;
    login(options?: LoginOptions): Promise<void>;
    sendVerifyCode(type?: VerfyCodeTypes): Promise<boolean>;
    listTrustDevice(): Promise<Array<TrustDevice>>;
    addTrustDevice(verifyCode: string): Promise<boolean>;
    getStationList(): Promise<Array<StationListResponse>>;
    getDeviceList(): Promise<Array<DeviceListResponse>>;
    refreshHouseData(): Promise<void>;
    refreshStationData(): Promise<void>;
    refreshDeviceData(): Promise<void>;
    refreshAllData(): Promise<void>;
    request(request: HTTPApiRequest): Promise<ApiResponse>;
    checkPushToken(): Promise<boolean>;
    registerPushToken(token: string): Promise<boolean>;
    setParameters(stationSN: string, deviceSN: string, params: {
        paramType: number;
        paramValue: any;
    }[]): Promise<boolean>;
    getCiphers(/*stationSN: string, */ cipherIDs: Array<number>, userID: string): Promise<Ciphers>;
    getVoices(deviceSN: string): Promise<Voices>;
    getCipher(/*stationSN: string, */ cipherID: number, userID: string): Promise<Cipher>;
    getLog(): Logger;
    getDevices(): FullDevices;
    getHubs(): Hubs;
    getToken(): string | null;
    getTokenExpiration(): Date | null;
    setToken(token: string): void;
    setTokenExpiration(tokenExpiration: Date): void;
    getAPIBase(): string;
    setOpenUDID(openudid: string): void;
    setSerialNumber(serialnumber: string): void;
    private _getEvents;
    getVideoEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    getAlarmEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    getHistoryEvents(startTime: Date, endTime: Date, filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    getAllVideoEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    getAllAlarmEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    getAllHistoryEvents(filter?: EventFilterType, maxResults?: number): Promise<Array<EventRecordResponse>>;
    isConnected(): boolean;
    getInvites(): Promise<Invites>;
    confirmInvites(confirmInvites: Array<ConfirmInvite>): Promise<boolean>;
    getPublicKey(deviceSN: string, type: PublicKeyType): Promise<string>;
    decryptAPIData(data?: string, json?: boolean): any;
    getSensorHistory(stationSN: string, deviceSN: string): Promise<Array<SensorHistoryEntry>>;
    getHouseDetail(houseID: string): Promise<HouseDetail | null>;
    getHouseList(): Promise<Array<HouseListResponse>>;
    getHouseInviteList(isInviter?: number): Promise<Array<HouseInviteListResponse>>;
    confirmHouseInvite(houseID: string, inviteID: number): Promise<boolean>;
    getPersistentData(): HTTPApiPersistentData | undefined;
    getPassportProfile(): Promise<PassportProfileResponse | null>;
    addUser(deviceSN: string, nickname: string, stationSN?: string): Promise<AddUserResponse | null>;
    deleteUser(deviceSN: string, shortUserId: string, stationSN?: string): Promise<boolean>;
    getUsers(deviceSN: string, stationSN: string): Promise<Array<User> | null>;
    getUser(deviceSN: string, stationSN: string, shortUserId: string): Promise<User | null>;
    updateUser(deviceSN: string, stationSN: string, shortUserId: string, nickname: string): Promise<boolean>;
    getImage(deviceSN: string, url: string): Promise<Buffer>;
}
