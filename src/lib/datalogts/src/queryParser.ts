import Hjson from 'hjson';
import type { Datom, SearchContext } from './datom.js';

export interface Query {
    find: string[];
    where: Datom[];
    context?: SearchContext;
    options?: {
        limit?: number;
        offset?: number;
    };
}

export function parseHJsonQuery(queryStr: string): Query {
    try {
        const parsed = Hjson.parse(queryStr);

        if (!parsed.find || !Array.isArray(parsed.find)) {
            throw new Error("Query must include a 'find' array.");
        }

        if (!parsed.where || !Array.isArray(parsed.where)) {
            throw new Error("Query must include a 'where' array.");
        }

        // Basic validation and type casting
        const query: Query = {
            find: parsed.find as string[],
            where: (parsed.where as any[]).map(w => {
                if (!Array.isArray(w) || w.length !== 3) {
                    throw new Error("Each 'where' clause must be an array of length 3.");
                }
                return w as Datom;
            }),
            context: parsed.context as SearchContext,
            options: parsed.options as { limit?: number; offset?: number }
        };

        return query;
    } catch (e: any) {
        throw new Error(`Failed to parse HJSON query: ${e.message}`);
    }
}
