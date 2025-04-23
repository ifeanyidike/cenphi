export type JSONValue =
  | string
  | number
  | boolean
  |Date
  | null
  | JSONObject
  | JSONArray;
export interface JSONObject {
  [key: string]: JSONValue;
}
export type JSONArray = JSONValue[];
