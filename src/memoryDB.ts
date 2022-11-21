// 2. querySingle


import {Datom, SearchContext} from "./datom";
import {isVariable, matchPattern} from "./utils";

export function querySingle(pattern: Datom, db, context: SearchContext) {
    return relevantTriples(pattern, db)
        .map((triple) => matchPattern(pattern, triple, context))
        .filter((x) => x);
}

// 3. queryWhere

export function queryWhere(patterns: Datom[], db, ctx: SearchContext = {}) {
    return patterns.reduce(
        (contexts, pattern) => {
            return  contexts.flatMap((context) => {
                return querySingle(pattern, db, context);
            });
        },
        [ctx]
    );
}

// 4. query

function actualize(context, find) {
    return find.map((findPart) => {
        return isVariable(findPart) ? context[findPart] : findPart;
    });
}

export function query({find, where}: { find: string[], where: Datom[] }, db) {
    const contexts = queryWhere(where, db);
    return contexts.map((context) => actualize(context, find));
}

// 5. DB

function relevantTriples(pattern, db) {
    const [id, attribute, value] = pattern;
    if (!isVariable(id)) {
        return db.entityIndex[id];
    }
    if (!isVariable(attribute)) {
        return db.attrIndex[attribute];
    }
    if (!isVariable(value)) {
        return db.valueIndex[value];
    }
    return db.triples;
}

function indexBy(triples, idx) {
    return triples.reduce((index, triple) => {
        const k = triple[idx];
        index[k] = index[k] || [];
        index[k].push(triple);
        return index;
    }, {});
}

export function createDB(triples) {
    return {
        triples,
        entityIndex: indexBy(triples, 0),
        attrIndex: indexBy(triples, 1),
        valueIndex: indexBy(triples, 2),
    };
}