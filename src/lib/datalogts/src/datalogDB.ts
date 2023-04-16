import {
    actualize,
    isVariable,
    matchPattern,
} from "./utils.js";


import sqlite3Driver from 'sqlite3';
import {open} from 'sqlite';
import type {Database} from 'sqlite';
import {Datom, DatomPart, ResultContext, SearchContext} from "./datom";

class DatalogDB {

    private sqlDb: Database = null;
    private readonly dbFile: string;

    private constructor(dbFile = "test.db") {
        this.dbFile = dbFile;
    }

    public static async create(dbFile = "test.db") {
        const db = new DatalogDB(dbFile);

        db.sqlDb = await open({
            filename: db.dbFile,
            driver: sqlite3Driver.Database
        });

        //@todo need migration
        await db.createTables();

        return db;
    }


    /**
     * Remove all data from the database
     * https://stackoverflow.com/a/65743498/429544
     */
    public async truncate() {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be truncated");
        }
        await this.sqlDb.exec(`
            PRAGMA writable_schema = 1;
            DELETE FROM sqlite_master;
            PRAGMA writable_schema = 0;
            VACUUM;
            PRAGMA integrity_check;
        `);
        await this.createTables();
    }

    private async createTables() {
        await this.sqlDb.exec(`
            CREATE TABLE IF NOT EXISTS "datoms" (
                "e"  INTEGER NOT NULL,
                "a"  SMALLINT NOT NULL,
                "v"  BLOB NOT NULL,
                "tx" INTEGER NOT NULL
            );
        `);
        await this.sqlDb.run(`
            CREATE TABLE IF NOT EXISTS "schema" (
                "e"	INTEGER NOT NULL,
                "a"	SMALLINT NOT NULL,
                "v"	BLOB NOT NULL
            );
        `);
    }

    public async loadDatoms(datoms: Datom[]) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before datoms can be loaded");
        }

        let txCounter = 0; //@todo query for most recent transaction
        for (const datom of datoms) {
            await this.sqlDb.run(`INSERT INTO "datoms" (e, a, v, tx) VALUES ($e, $a, $v, $tx);`, {
                $e: datom[0],
                $a: datom[1],
                $v: datom[2],
                $tx: txCounter++
            });
        }
    }

    public async query({find, where, context, options}: { find: string[], where: Datom[], context?: SearchContext,options?: {limit?:number, offset?:number} }): Promise<Array<DatomPart[]>> {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const contexts = await this.queryWhere(where, context);
        let matches = contexts.map((context) => actualize(context, find));

        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? -1; //-1 means last element

        const end = limit >= 0 ? limit+offset : -1;

        if (offset == 0 && end == -1) {
            // nothing to do
        } else {
            matches = matches.slice(offset, end)
        }

        return matches; //@todo Datom[]
    }

    private async queryWhere(patterns: Datom[], ctx: SearchContext = {}): Promise<Array<ResultContext>> {
        let contexts = [ctx];
        for (const pattern of patterns) {
            const res = await Promise.all(contexts.map(async (context) => {
                return await this.querySingle(pattern, context);
            }));
            contexts = res.flat()
        }
        return contexts;
    }

    private async querySingle(pattern: Datom, context: SearchContext) {
        console.log("querySingle context", context);
        let relevant = (await this.relevantTriples(pattern, context));
        console.log("querySingle relevant", relevant);
        let matching = relevant.map((triple) => matchPattern(pattern, triple, context));
        return matching; //.filter((x) => x);


    }

    /**
     *
     * @todo this is ripe for performance improvement
     * @param pattern
     * @private
     */
    private async relevantTriples(pattern: Datom, context?: SearchContext): Promise<Datom[]> {
        const [id, attribute, value] = pattern;
        if (!isVariable(id)) {
            const res = await this.sqlDb.all('SELECT * from "datoms" WHERE e = ?', id);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        if (!isVariable(attribute)) {
            const res = await this.sqlDb.all('SELECT * from "datoms" WHERE a = ?', attribute);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        if (!isVariable(value)) {
            const res = await this.sqlDb.all('SELECT * from "datoms" WHERE v = ?', value);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        console.log("Falling Back to querying ALL Datoms");
        const res = await this.sqlDb.all('SELECT * from "datoms"');
        // slice throws away the transaction portion of the result
        return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
    }
}

export default DatalogDB;
