import { OptionsType, ResponseServerDataType } from "./interfaces";
declare let query: (options: OptionsType) => Promise<ResponseServerDataType>;
export default query;
