export type OptionsType = {
    host: string;
    port?: number;
    timeout?: number;
};
export type ResponseRulesType = {
    lagcomp: boolean;
    mapname: string;
    version: '0.3.7';
    weather: number;
    weburl: string;
    worldtime: string;
};
export type ResponseServerDataType = {
    address?: string;
    hostname?: string;
    gamemode?: string;
    mapname?: string;
    passworded?: boolean;
    maxplayers?: number;
    port?: number | string;
    online?: number;
    rules?: ResponseRulesType;
    players?: ResponsePlayer[];
};
export type ResponsePlayer = {
    id: number;
    name: string;
    score: number;
    ping: number;
};
