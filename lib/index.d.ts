import { OptionsType, ResponseServerDataType } from "./interfaces";
declare let query: (options: OptionsType) => Promise<void | ResponseServerDataType>;
export default query;
