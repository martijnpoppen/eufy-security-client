/// <reference types="node" />
/// <reference types="node" />
import { Socket } from "dgram";
import NodeRSA from "node-rsa";
import { P2PMessageParts, P2PMessageState, P2PQueueMessage, RGBColor } from "./interfaces";
import { CommandType, ESLCommand, LockV12P2PCommand, SmartSafeCommandCode, VideoCodec, EncryptionType, SmartLockP2PCommand, SmartLockFunctionType, SmartLockCommand } from "./types";
import { Address, LockP2PCommandType, SmartSafeNotificationResponse, SmartSafeP2PCommandType } from "./models";
import { DeviceType } from "../http/types";
export declare const MAGIC_WORD = "XZYH";
export declare const isPrivateIp: (ip: string) => boolean;
export declare const getLocalIpAddress: (init?: string) => string;
export declare const isP2PCommandEncrypted: (cmd: CommandType) => boolean;
export declare const getP2PCommandEncryptionKey: (serialNumber: string, p2pDid: string) => string;
export declare const encryptP2PData: (data: Buffer, key: Buffer) => Buffer;
export declare const decryptP2PData: (data: Buffer, key: Buffer) => Buffer;
export declare const paddingP2PData: (data: Buffer, blocksize?: number) => Buffer;
export declare const buildLookupWithKeyPayload: (socket: Socket, p2pDid: string, dskKey: string) => Buffer;
export declare const buildLookupWithKeyPayload2: (p2pDid: string, dskKey: string) => Buffer;
export declare const buildLookupWithKeyPayload3: (p2pDid: string, address: Address, data: Buffer) => Buffer;
export declare const buildCheckCamPayload: (p2pDid: string) => Buffer;
export declare const buildCheckCamPayload2: (p2pDid: string, data: Buffer) => Buffer;
export declare const buildIntCommandPayload: (encryptionType: EncryptionType, encryptionKey: Buffer | undefined, serialNumber: string, p2pDid: string, commandType: CommandType, value: number, strValue?: string, channel?: number) => Buffer;
export declare const buildStringTypeCommandPayload: (encryptionType: EncryptionType, encryptionKey: Buffer | undefined, serialNumber: string, p2pDid: string, commandType: CommandType, strValue: string, strValueSub: string, channel?: number) => Buffer;
export declare const buildIntStringCommandPayload: (encryptionType: EncryptionType, encryptionKey: Buffer | undefined, serialNumber: string, p2pDid: string, commandType: CommandType, value: number, valueSub?: number, strValue?: string, strValueSub?: string, channel?: number) => Buffer;
export declare const sendMessage: (socket: Socket, address: {
    host: string;
    port: number;
}, msgID: Buffer, payload?: Buffer) => Promise<number>;
export declare const hasHeader: (msg: Buffer, searchedType: Buffer) => boolean;
export declare const buildCommandHeader: (seqNumber: number, commandType: CommandType, p2pDataTypeHeader?: Buffer | null) => Buffer;
export declare const buildCommandWithStringTypePayload: (encryptionType: EncryptionType, encryptionKey: Buffer | undefined, serialNumber: string, p2pDid: string, commandType: CommandType, value: string, channel?: number) => Buffer;
export declare const sortP2PMessageParts: (messages: P2PMessageParts) => Buffer;
export declare const getRSAPrivateKey: (pem: string) => NodeRSA;
export declare const getNewRSAPrivateKey: () => NodeRSA;
export declare const decryptAESData: (hexkey: string, data: Buffer) => Buffer;
export declare const findStartCode: (data: Buffer) => boolean;
export declare const isIFrame: (data: Buffer) => boolean;
export declare const decryptLockAESData: (key: string, iv: string, data: Buffer) => Buffer;
export declare const encryptLockAESData: (key: string, iv: string, data: Buffer) => Buffer;
export declare const generateBasicLockAESKey: (adminID: string, stationSN: string) => string;
export declare const getCurrentTimeInSeconds: () => number;
export declare const generateLockSequence: (deviceType: DeviceType) => number;
export declare const encodeLockPayload: (data: string) => Buffer;
export declare const getLockVectorBytes: (data: string) => string;
export declare const decodeLockPayload: (data: Buffer) => string;
export declare const decodeBase64: (data: string) => Buffer;
export declare const eslTimestamp: (timestamp_in_sec?: number) => number[];
export declare const generateAdvancedLockAESKey: () => string;
export declare const getVideoCodec: (data: Buffer) => VideoCodec;
export declare const checkT8420: (serialNumber: string) => boolean;
export declare const buildVoidCommandPayload: (channel?: number) => Buffer;
export declare function isP2PQueueMessage(type: P2PQueueMessage | P2PMessageState): type is P2PQueueMessage;
export declare const encryptPayloadData: (data: string | Buffer, key: Buffer, iv: Buffer) => Buffer;
export declare const decryptPayloadData: (data: Buffer, key: Buffer, iv: Buffer) => Buffer;
export declare const eufyKDF: (key: Buffer) => Buffer;
export declare const getAdvancedLockKey: (key: string, publicKey: string) => string;
export declare const getLockV12Key: (key: string, publicKey: string) => string;
export declare const buildTalkbackAudioFrameHeader: (audioData: Buffer, channel?: number) => Buffer;
export declare const decodeP2PCloudIPs: (data: string) => Array<Address>;
export declare const decodeSmartSafeData: (deviceSN: string, data: Buffer) => SmartSafeNotificationResponse;
export declare const getSmartSafeP2PCommand: (deviceSN: string, user_id: string, command: CommandType, intCommand: SmartSafeCommandCode, channel: number, sequence: number, data: Buffer) => SmartSafeP2PCommandType;
export declare const getLockP2PCommand: (deviceSN: string, user_id: string, command: CommandType, channel: number, lockPublicKey: string, payload: any) => LockP2PCommandType;
export declare const getLockV12P2PCommand: (deviceSN: string, user_id: string, command: CommandType | ESLCommand, channel: number, lockPublicKey: string, sequence: number, data: Buffer) => LockV12P2PCommand;
export declare const DecimalToRGBColor: (color: number) => RGBColor;
export declare const RGBColorToDecimal: (color: RGBColor) => number;
export declare const getNullTerminatedString: (data: Buffer, encoding?: BufferEncoding) => string;
export declare const isUsbCharging: (value: number) => boolean;
export declare const isSolarCharging: (value: number) => boolean;
export declare const isPlugSolarCharging: (value: number) => boolean;
export declare const isCharging: (value: number) => boolean;
export declare const getSmartLockCurrentTimeInSeconds: () => number;
export declare const generateSmartLockAESKey: (adminUserId: string, time: number) => Buffer;
export declare const getSmartLockP2PCommand: (deviceSN: string, user_id: string, command: CommandType | SmartLockCommand, channel: number, sequence: number, data: Buffer, functionType?: SmartLockFunctionType) => SmartLockP2PCommand;
