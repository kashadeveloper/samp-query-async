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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dgram = __importStar(require("dgram"));
const iconv_lite_1 = __importDefault(require("iconv-lite"));
const err = (text) => {
    new Error(text);
};
/**
 * It queries a SAMP server and returns the response
 *
 * @param {OptionsType} options - OptionsType
 * @returns The response object is being returned.
 */
let query = (options) => __awaiter(void 0, void 0, void 0, function* () {
    let self = this;
    let obj = {
        result: null,
    };
    options.port = options.port || 7777;
    options.timeout = options.timeout || 5000;
    if (!options.host) {
        err('Invalid "host" passed');
    }
    if (!isFinite(options.port) || options.port < 1 || options.port > 65535) {
        err(`Invalid port '${options.port}'. Port mus't be larger than 1 and less than 65535`);
    }
    let response = {
        online: 0,
    };
    yield new Promise((resolve, reject) => {
        request.call(this, options, "i", function (error, information) {
            return __awaiter(this, void 0, void 0, function* () {
                if (error) {
                    return reject(new Error(error));
                }
                response.address = options.host;
                response.port = options.port;
                response.hostname = information.hostname;
                response.gamemode = information.gamemode;
                response.mapname = information.mapname;
                response.passworded = Boolean(information.passworded);
                response.maxplayers = information.maxplayers;
                response.online = information.players;
                request.call(self, options, "r", function (error, rules) {
                    return __awaiter(this, void 0, void 0, function* () {
                        if (error) {
                            return reject(new Error(error));
                        }
                        rules.lagcomp = rules.lagcomp === "On" ? true : false;
                        rules.weather = parseInt(rules.weather, 10);
                        response.rules = rules;
                        resolve(response);
                    });
                });
            });
        });
    });
    return response;
});
let request = function (options, opcode, callback) {
    let socket = dgram.createSocket("udp4");
    let packet = Buffer.alloc(11);
    packet.write("SAMP");
    for (let i = 0; i < 4; ++i)
        packet[i + 4] = options.host.split(".")[i];
    packet[8] = options.port & 0xff;
    packet[9] = (options.port >> 8) & 0xff;
    packet[10] = opcode.charCodeAt(0);
    try {
        socket.send(packet, 0, packet.length, options.port, options.host, function (error, bytes) {
            if (error)
                return callback.apply(options, [error]);
        });
    }
    catch (error) {
        return callback.apply(options, [error]);
    }
    let controller = undefined;
    let onTimeOut = () => {
        socket.close();
        return callback.apply(options, ['Socket timed out.']);
    };
    controller = setTimeout(onTimeOut, options.timeout);
    socket.on("message", function (message) {
        if (controller)
            clearTimeout(controller);
        if (message.length < 11)
            return callback.apply(options, ['Socket invalid']);
        else {
            socket.close();
            message = message.slice(11);
            let object = {};
            let array = [];
            let strlen = 0;
            let offset = 0;
            try {
                if (opcode == "i") {
                    object.passworded = message.readUInt8(offset);
                    offset += 1;
                    object.players = message.readUInt16LE(offset);
                    offset += 2;
                    object.maxplayers = message.readUInt16LE(offset);
                    offset += 2;
                    strlen = message.readUInt16LE(offset);
                    offset += 4;
                    object.hostname = decode(message.slice(offset, (offset += strlen)));
                    strlen = message.readUInt16LE(offset);
                    offset += 4;
                    object.gamemode = decode(message.slice(offset, (offset += strlen)));
                    strlen = message.readUInt16LE(offset);
                    offset += 4;
                    object.mapname = decode(message.slice(offset, (offset += strlen)));
                    return callback.apply(options, [false, object]);
                }
                if (opcode == "r") {
                    let rulecount = message.readUInt16LE(offset);
                    offset += 2;
                    let property, value = undefined;
                    while (rulecount) {
                        strlen = message.readUInt8(offset);
                        ++offset;
                        property = decode(message.slice(offset, (offset += strlen)));
                        strlen = message.readUInt8(offset);
                        ++offset;
                        value = decode(message.slice(offset, (offset += strlen)));
                        object[property] = value;
                        --rulecount;
                    }
                    return callback.apply(options, [false, object]);
                }
                if (opcode == "d") {
                    let playercount = message.readUInt16LE(offset);
                    offset += 2;
                    let player = undefined;
                    while (playercount) {
                        player = {};
                        player.id = message.readUInt8(offset);
                        ++offset;
                        strlen = message.readUInt8(offset);
                        ++offset;
                        player.name = decode(message.slice(offset, (offset += strlen)));
                        player.score = message.readUInt16LE(offset);
                        offset += 4;
                        player.ping = message.readUInt16LE(offset);
                        offset += 4;
                        array.push(player);
                        --playercount;
                    }
                    return callback.apply(options, [false, array]);
                }
            }
            catch (exception) {
                return callback.apply(options, [exception]);
            }
        }
    });
};
let decode = (buffer) => {
    return iconv_lite_1.default.decode(buffer, "win1251");
};
exports.default = query;
