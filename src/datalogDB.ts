// 2. querySingle

import {Datom, isVariable, matchPattern, ResultContext, SearchContext} from "./index";


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
import {querySingle} from "./memoryDB";

class DatalogDB {

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

        //@todo need migration
        await this.sqlDb.exec(`
            CREATE TABLE IF NOT EXISTS "datoms" (
                "e"  INTEGER NOT NULL,
                "a"  SMALLINT NOT NULL,
                "v"  BLOB NOT NULL,
                "tx" INTEGER NOT NULL
            );
        `)
    }

    public async query({find, where}: { find: string[], where: Datom[] }): Promise<Array<ResultContext>> {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const contexts = await this.queryWhere(where);
        return contexts.map((context) => actualize(context, find));
    }

    private async queryWhere(patterns: Datom[], ctx: SearchContext = {}): Promise<Array<ResultContext>> {
        console.log("queryWhere", patterns, ctx);
        return patterns.reduce(
            (contexts, pattern) => {
                console.log("pattern", pattern);
                return contexts.flatMap(async (context) => {
                    const a = await this.querySingle(pattern, context);
                    console.log("contexts querySingle", a);
                    return a;
                });
            },
            [ctx]
        );

        // console.log("queryWhere", patterns, ctx);
        // let contexts = [ctx];
        // for (const pattern of patterns) {
        //     console.log("pattern", pattern);
        //     contexts.flatMap(async (context) => {
        //         const a = await this.querySingle(pattern, context);
        //         console.log("contexts querySingle", a);
        //         return a;
        //     })
        // }
        // return contexts;

        // return patterns.reduce(
        //     async (contexts, pattern: Datom) => {
        //         return contexts.flatMap(async (context) => await this.querySingle(pattern, context));
        //     },
        //     [ctx]
        // );
    }

    private async querySingle(pattern: Datom, context: SearchContext) {
        return (await this.relevantTriples(pattern))
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
            let res = await this.sqlDb.all('SELECT * from "datoms" WHERE a = ?', attribute);
            // slice throws away the transaction
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
            // return db.attrIndex[attribute];
        }
        if (!isVariable(value)) {
            let res = await this.sqlDb.all('SELECT * from "datoms" WHERE v = ?', value);
            // slice throws away the transaction
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
            // return db.valueIndex[value];
        }
        console.log("Falling Back to querying ALL Datoms");
        let res = await this.sqlDb.all('SELECT * from "datoms"');
        // slice throws away the transaction
        return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        // return db.triples;
    }
}

export default DatalogDB;


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