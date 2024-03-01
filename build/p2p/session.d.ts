import { TypedEmitter } from "tiny-typed-emitter";
import * as NodeRSA from "node-rsa";
import { Address, CustomData } from "./models";
import { CommandType, P2PDataType, P2PConnectionType } from "./types";
import { P2PClientProtocolEvents, P2PCommand } from "./interfaces";
import { StationListResponse } from "../http/models";
import { HTTPApi } from "../http/api";
export declare class P2PClientProtocol extends TypedEmitter<P2PClientProtocolEvents> {
    private readonly MAX_RETRIES;
    private readonly MAX_COMMAND_RESULT_WAIT;
    private readonly MAX_GATEWAY_COMMAND_RESULT_WAIT;
    private readonly MAX_CONNECTION_TIMEOUT;
    private readonly MAX_AKNOWLEDGE_TIMEOUT;
    private readonly MAX_LOOKUP_TIMEOUT;
    private readonly LOCAL_LOOKUP_RETRY_TIMEOUT;
    private readonly LOOKUP_RETRY_TIMEOUT;
    private readonly LOOKUP2_TIMEOUT;
    private readonly LOOKUP2_RETRY_TIMEOUT;
    private readonly MAX_EXPECTED_SEQNO_WAIT;
    private readonly HEARTBEAT_INTERVAL;
    private readonly MAX_COMMAND_QUEUE_TIMEOUT;
    private readonly AUDIO_CODEC_ANALYZE_TIMEOUT;
    private readonly KEEPALIVE_INTERVAL;
    private readonly ESD_DISCONNECT_TIMEOUT;
    private readonly MAX_STREAM_DATA_WAIT;
    private readonly RESEND_NOT_ACKNOWLEDGED_COMMAND;
    private readonly UDP_RECVBUFFERSIZE_BYTES;
    private readonly MAX_PAYLOAD_BYTES;
    private readonly MAX_PACKET_BYTES;
    private readonly MAX_VIDEO_PACKET_BYTES;
    private readonly P2P_DATA_HEADER_BYTES;
    private readonly MAX_SEQUENCE_NUMBER;
    private readonly SEQUENCE_PROCESSING_BOUNDARY;
    private socket;
    private binded;
    private connected;
    private connecting;
    private terminating;
    private p2pTurnHandshaking;
    private p2pTurnConfirmed;
    private seqNumber;
    private offsetDataSeqNumber;
    private videoSeqNumber;
    private lockSeqNumber;
    private expectedSeqNo;
    private currentMessageBuilder;
    private currentMessageState;
    private talkbackStream?;
    private downloadTotalBytes;
    private downloadReceivedBytes;
    private cloudAddresses;
    private messageStates;
    private messageVideoStates;
    private sendQueue;
    private connectTimeout?;
    private lookupTimeout?;
    private localLookupRetryTimeout?;
    private lookupRetryTimeout?;
    private lookup2Timeout?;
    private lookup2RetryTimeout?;
    private heartbeatTimeout?;
    private keepaliveTimeout?;
    private esdDisconnectTimeout?;
    private secondaryCommandTimeout?;
    private connectTime;
    private lastPong;
    private lastPongData;
    private connectionType;
    private energySavingDevice;
    private p2pSeqMapping;
    private p2pDataSeqNumber;
    private connectAddress;
    private localIPAddress;
    private preferredIPAddress;
    private dskKey;
    private dskExpiration;
    private deviceSNs;
    private api;
    private rawStation;
    private customDataStaging;
    private lockPublicKey;
    private lockAESKeys;
    private channel;
    private encryption;
    private p2pKey?;
    constructor(rawStation: StationListResponse, api: HTTPApi, ipAddress?: string, publicKey?: string);
    private _incrementSequence;
    private _isBetween;
    private _wasSequenceNumberAlreadyProcessed;
    private _initialize;
    private initializeMessageBuilder;
    private initializeMessageState;
    private _clearTimeout;
    private _clearMessageStateTimeouts;
    private _clearMessageVideoStateTimeouts;
    private _clearHeartbeatTimeout;
    private _clearKeepaliveTimeout;
    private _clearConnectTimeout;
    private _clearLookupTimeout;
    private _clearLocalLookupRetryTimeout;
    private _clearLookupRetryTimeout;
    private _clearLookup2RetryTimeout;
    private _clearLookup2Timeout;
    private _clearESDDisconnectTimeout;
    private _clearSecondaryCommandTimeout;
    private sendMessage;
    private _disconnected;
    private closeEnergySavingDevice;
    private renewDSKKey;
    private localLookup;
    private cloudLookup;
    private cloudLookup2;
    private cloudLookupWithTurnServer;
    private localLookupByAddress;
    private cloudLookupByAddress;
    private cloudLookupByAddress2;
    private cloudLookupByAddressWithTurnServer;
    isConnected(): boolean;
    private _startConnectTimeout;
    private _connect;
    private lookup;
    connect(host?: string): Promise<void>;
    private sendCamCheck;
    private sendCamCheck2;
    sendPing(address: Address): Promise<void>;
    sendCommandWithIntString(p2pcommand: P2PCommand, customData?: CustomData): void;
    sendCommandWithInt(p2pcommand: P2PCommand, customData?: CustomData): void;
    sendCommandWithStringPayload(p2pcommand: P2PCommand, customData?: CustomData): void;
    sendCommandWithString(p2pcommand: P2PCommand, customData?: CustomData): void;
    sendCommandPing(channel?: number): void;
    sendCommandDevicePing(channel?: number): void;
    sendCommandWithoutData(commandType: CommandType, channel?: number): void;
    private sendQueuedMessage;
    private sendCommand;
    private resendNotAcknowledgedCommand;
    private _sendCommand;
    private handleMsg;
    private parseDataMessage;
    private handleData;
    private isIFrame;
    private waitForStreamData;
    private handleDataBinaryAndVideo;
    private handleDataControl;
    private sendAck;
    private getDataType;
    close(): Promise<void>;
    private getHeartbeatInterval;
    private onClose;
    private onError;
    private scheduleHeartbeat;
    private scheduleP2PKeepalive;
    getDownloadRSAPrivateKey(): NodeRSA;
    setDownloadRSAPrivateKeyPem(pem: string): void;
    getRSAPrivateKey(): NodeRSA | null;
    private initializeStream;
    private endStream;
    private endRTSPStream;
    private emitStreamStartEvent;
    private emitStreamStopEvent;
    isStreaming(channel: number, datatype: P2PDataType): boolean;
    isLiveStreaming(channel: number): boolean;
    private isCurrentlyStreaming;
    isRTSPLiveStreaming(channel: number): boolean;
    isDownloading(channel: number): boolean;
    getLockSequenceNumber(): number;
    incLockSequenceNumber(): number;
    setConnectionType(type: P2PConnectionType): void;
    getConnectionType(): P2PConnectionType;
    isEnergySavingDevice(): boolean;
    private getDSKKeys;
    updateRawStation(value: StationListResponse): void;
    private initializeTalkbackStream;
    private sendTalkbackAudioFrame;
    private onTalkbackStreamClose;
    private onTalkbackStreamError;
    private _sendVideoData;
    isTalkbackOngoing(channel: number): boolean;
    startTalkback(channel?: number): void;
    stopTalkback(channel?: number): void;
    setLockAESKey(commandCode: number, aesKey: string): void;
    getLockAESKey(commandCode: number): string | undefined;
    isConnecting(): boolean;
}
