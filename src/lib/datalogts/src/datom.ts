
export type DatomField = number | string;
export type Datom = [DatomField, DatomField, DatomField];
export type SearchContext = { [key: string]: DatomField };
export type ResultContext = SearchContext | null;