
export type DatomPart = number | string;
export type Datom = [DatomPart, DatomPart, DatomPart];
export type SearchContext = {[key: string]: DatomPart};
export type ResultContext = SearchContext | null;