// 2. querySingle

import {Datom, isVariable, matchPattern, SearchContext} from "./index";


// 3. queryWhere


// 4. query

function actualize(context, find) {
    return find.map((findPart) => {
        return isVariable(findPart) ? context[findPart] : findPart;
    });
}


// 5. DB

import sqlite3Driver from 'sqlite3';
import {open} from 'sqlite';
import type {Database} from 'sqlite';

class DatalogDb {

    private sqlDb: Database = null;
    private readonly dbFile: string;

    constructor(dbFile = "test.db") {
        this.dbFile = dbFile;
    }

    public async open() {
        this.sqlDb = await open({
            filename: this.dbFile,
            driver: sqlite3Driver.Database
        });
    }

    public query({find, where}: { find: string[], where: Datom[] }, db) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const contexts = this.queryWhere(where);
        return contexts.map((context) => actualize(context, find));
    }

    private queryWhere(patterns: Datom[], ctx: SearchContext = {}) {
        return patterns.reduce(
            (contexts, pattern) => {
                return contexts.flatMap((context) => this.querySingle(pattern, context));
            },
            [ctx]
        );
    }

    private querySingle(pattern: Datom, context: SearchContext) {
        return this.relevantTriples(pattern)
            .map((triple) => matchPattern(pattern, triple, context))
            .filter((x) => x);
    }

    private async relevantTriples(pattern: Datom): Promise<Datom[]> {
        const [id, attribute, value] = pattern;
        if (!isVariable(id)) {
            let res = await this.sqlDb.all('SELECT * from "datoms" WHERE e = ?', id);
            // slice throws away the transaction
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
            // return db.entityIndex[id];
        }
        if (!isVariable(attribute)) {
            let res = await this.sqlDb.get('SELECT * from "datoms" WHERE a = ?', attribute);
            // slice throws away the transaction
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
            // return db.attrIndex[attribute];
        }
        if (!isVariable(value)) {
            let res = await this.sqlDb.get('SELECT * from "datoms" WHERE v = ?', value);
            // slice throws away the transaction
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
            // return db.valueIndex[value];
        }
        console.log("Falling Back to querying ALL Datoms");
        let res = await this.sqlDb.get('SELECT * from "datoms"');
        // slice throws away the transaction
        return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        // return db.triples;
    }
}


// function indexBy(triples, idx) {
//     return triples.reduce((index, triple) => {
//         const k = triple[idx];
//         index[k] = index[k] || [];
//         index[k].push(triple);
//         return index;
//     }, {});
// }
//
// export function createDB(triples) {
//     return {
//         triples,
//         entityIndex: indexBy(triples, 0),
//         attrIndex: indexBy(triples, 1),
//         valueIndex: indexBy(triples, 2),
//     };
// }