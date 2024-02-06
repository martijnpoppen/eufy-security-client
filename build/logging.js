"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setLoggingLevel = exports.rootP2PLogger = exports.rootPushLogger = exports.rootMQTTLogger = exports.rootHTTPLogger = exports.rootMainLogger = exports.InternalLogger = exports.LogLevel = void 0;
const typescript_logging_1 = require("typescript-logging");
const typescript_logging_category_style_1 = require("typescript-logging-category-style");
exports.LogLevel = typescript_logging_1.LogLevel;
class InternalLogger {
    static logger;
}
exports.InternalLogger = InternalLogger;
const getMethodName = function () {
    const matches = new Error("").stack?.split("\n")[6].match(/ at( new){0,1} ([a-zA-Z0-9_\.]+) /);
    if (matches !== null && matches !== undefined && matches[2] !== undefined && matches[2] !== "eval") {
        return matches[2];
    }
    return undefined;
};
const provider = typescript_logging_category_style_1.CategoryProvider.createProvider("EufySecurityClientProvider", {
    level: exports.LogLevel.Off,
    channel: {
        type: "RawLogChannel",
        write: (msg, _formatArg) => {
            const methodName = getMethodName();
            const method = methodName ? `[${methodName}] ` : "";
            switch (msg.level) {
                case exports.LogLevel.Trace:
                    if (msg.args)
                        InternalLogger.logger?.trace(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.trace(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case exports.LogLevel.Debug:
                    if (msg.args)
                        InternalLogger.logger?.debug(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.debug(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case exports.LogLevel.Info:
                    if (msg.args)
                        InternalLogger.logger?.info(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.info(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case exports.LogLevel.Warn:
                    if (msg.args)
                        InternalLogger.logger?.warn(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.warn(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case exports.LogLevel.Error:
                    if (msg.args)
                        InternalLogger.logger?.error(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                    else
                        InternalLogger.logger?.error(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
                case exports.LogLevel.Fatal:
                    if (InternalLogger.logger && InternalLogger.logger.fatal)
                        if (msg.args)
                            InternalLogger.logger.fatal(`[${msg.logNames}] ${method}${msg.message}`, ...msg.args);
                        else
                            InternalLogger.logger.fatal(`[${msg.logNames}] ${method}${msg.message}`);
                    break;
            }
        },
    },
});
exports.rootMainLogger = provider.getCategory("main");
exports.rootHTTPLogger = provider.getCategory("http");
exports.rootMQTTLogger = provider.getCategory("mqtt");
exports.rootPushLogger = provider.getCategory("push");
exports.rootP2PLogger = provider.getCategory("p2p");
const setLoggingLevel = function (category = "all", level = exports.LogLevel.Off) {
    switch (category) {
        case "all":
            provider.updateRuntimeSettings({
                level: level
            });
            break;
        case "main":
            provider.updateRuntimeSettingsCategory(exports.rootMainLogger, {
                level: level
            });
            break;
        case "http":
            provider.updateRuntimeSettingsCategory(exports.rootHTTPLogger, {
                level: level
            });
            break;
        case "mqtt":
            provider.updateRuntimeSettingsCategory(exports.rootMQTTLogger, {
                level: level
            });
            break;
        case "p2p":
            provider.updateRuntimeSettingsCategory(exports.rootP2PLogger, {
                level: level
            });
            break;
        case "push":
            provider.updateRuntimeSettingsCategory(exports.rootPushLogger, {
                level: level
            });
            break;
    }
};
exports.setLoggingLevel = setLoggingLevel;
//# sourceMappingURL=logging.js.map