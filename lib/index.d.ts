import { OptionsType, ResponseServerDataType } from "./interfaces";
/**
 * It queries a SAMP server and returns the response
 *
 * @param {OptionsType} options - OptionsType
 * @returns The response object is being returned.
 */
declare let query: (options: OptionsType) => Promise<ResponseServerDataType>;
export default query;
