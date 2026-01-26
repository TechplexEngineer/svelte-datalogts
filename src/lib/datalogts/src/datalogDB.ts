import {
    actualize,
    isVariable,
    matchPattern,
} from "./utils.js";


import sqlite3Driver from 'sqlite3';
import { open } from 'sqlite';
import type { Database } from 'sqlite';
import type { Datom, DatomField, ResultContext, SearchContext } from "./datom.js";

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
            CREATE TABLE IF NOT EXISTS "transactions" (
                "id" INTEGER PRIMARY KEY,
                "metadata" TEXT,
                "executed_at" TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS "datoms" (
                "e"  INTEGER NOT NULL,
                "a"  TEXT NOT NULL,
                "v"  BLOB NOT NULL,
                "tx" INTEGER NOT NULL,
                FOREIGN KEY("tx") REFERENCES "transactions"("id")
            );

            CREATE INDEX IF NOT EXISTS "idx_datoms_e" ON "datoms" ("e");
            CREATE INDEX IF NOT EXISTS "idx_datoms_a" ON "datoms" ("a");
            CREATE INDEX IF NOT EXISTS "idx_datoms_v" ON "datoms" ("v");
            CREATE INDEX IF NOT EXISTS "idx_datoms_tx" ON "datoms" ("tx");

            CREATE TABLE IF NOT EXISTS "schema" (
                "e"	INTEGER NOT NULL,
                "a"	TEXT NOT NULL,
                "v"	BLOB NOT NULL
            );
        `);
    }

    public async transact(datoms: Datom[], metadata: any = {}) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before transacting");
        }

        // Microsecond timestamp
        const txId = Date.now() * 1000;
        const executedAt = new Date().toISOString();

        await this.sqlDb.run("BEGIN TRANSACTION");
        try {
            await this.sqlDb.run(
                `INSERT INTO "transactions" (id, metadata, executed_at) VALUES (?, ?, ?);`,
                txId,
                JSON.stringify(metadata),
                executedAt
            );

            for (const datom of datoms) {
                await this.sqlDb.run(
                    `INSERT INTO "datoms" (e, a, v, tx) VALUES (?, ?, ?, ?);`,
                    datom[0],
                    datom[1],
                    datom[2],
                    txId
                );
            }
            await this.sqlDb.run("COMMIT");
            return txId;
        } catch (e) {
            await this.sqlDb.run("ROLLBACK");
            throw e;
        }
    }

    public async loadDatoms(datoms: Datom[]) {
        return this.transact(datoms, { system: "initial_load" });
    }

    public async query({ find, where, context, options }: { find: string[], where: Datom[], context?: SearchContext, options?: { limit?: number, offset?: number } }): Promise<Array<DatomField[]>> {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const contexts = await this.queryWhere(where, context);
        let matches = contexts.map((context) => actualize(context, find));

        const offset = options?.offset ?? 0;
        const limit = options?.limit ?? -1; //-1 means last element

        const end = limit >= 0 ? limit + offset : -1;

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
        let relevant = (await this.relevantTriples(pattern, context));
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
        const res = await this.sqlDb.all('SELECT * from "datoms"');
        // slice throws away the transaction portion of the result
        return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
    }
}

export default DatalogDB;
