import * as dgram from "dgram";
import iconv from "iconv-lite";
import {
  OptionsType,
  ResponsePlayer,
  ResponseRulesType,
  ResponseServerDataType,
} from "./interfaces";

const err = (text: string) => {
  new Error(text);
};

/**
 * It queries a SAMP server and returns the response
 * 
 * @param {OptionsType} options - OptionsType
 * @returns The response object is being returned.
 */
let query = async (options: OptionsType) => {
  let self = this;
  let obj: {
    result: ResponseServerDataType | null;
  } = {
    result: null,
  };
  options.port = options.port || 7777;
  options.timeout = options.timeout || 5000;
  if (!options.host) {
    err('Invalid "host" passed');
  }

  if (!isFinite(options.port) || options.port < 1 || options.port > 65535) {
    err(
      `Invalid port '${options.port}'. Port mus't be larger than 1 and less than 65535`
    );
  }

  let response: ResponseServerDataType = {
    online: 0,
  };

  await new Promise((resolve, reject) => {
    request.call(
      this,
      options,
      "i",
      async function (error: any, information: any) {
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

        request.call(
          self,
          options,
          "r",
          async function (error: string, rules: any) {
            if (error) {
              return reject(new Error(error));
            }
            rules.lagcomp = rules.lagcomp === "On" ? true : false;

            rules.weather = parseInt(rules.weather, 10);

            response.rules = rules;
            resolve(response) 
          }
        );
      }
    );
  });
  return response
};

let request = function (options: any, opcode: 'r' | 'd' | 'i', callback: Function) {
  let socket = dgram.createSocket("udp4");
  let packet = Buffer.alloc(11);

  packet.write("SAMP");

  for (let i = 0; i < 4; ++i) packet[i + 4] = options.host.split(".")[i];

  packet[8] = options.port & 0xff;
  packet[9] = (options.port >> 8) & 0xff;
  packet[10] = opcode.charCodeAt(0);

  try {
    socket.send(
      packet,
      0,
      packet.length,
      options.port,
      options.host,
      function (error, bytes) {
        if (error) return callback.apply(options, [error]);
      }
    );
  } catch (error) {
    return callback.apply(options, [error]);
  }

  let controller: any = undefined;

  let onTimeOut = () => {
    socket.close();
    return callback.apply(options, ['Socket timed out.'])
  };

  controller = setTimeout(onTimeOut, options.timeout);

  socket.on("message", function (message) {
    if (controller) clearTimeout(controller);
    if (message.length < 11) return callback.apply(options, ['Socket invalid']);
    else {
      socket.close();

      message = message.slice(11);

      let object: any = {};
      let array: Array<any> = [];
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

          let property,
            value: any = undefined;

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

          let player: any = undefined;

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
      } catch (exception) {
        return callback.apply(options, [exception]);
      }
    }
  });
};

let decode = (buffer: Buffer) => {
  return iconv.decode(buffer, "win1251");
};

export default query;
