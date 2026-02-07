import {
    actualize,
    isVariable,
    matchPattern,
} from "./utils.js";
import { parseHJsonQuery } from "./queryParser.js";


import sqlite3Driver from 'sqlite3';
import { open } from 'sqlite';
import type { Database } from 'sqlite';
import type { Datom, DatomField, ResultContext, SearchContext } from "./datom.js";

class DatalogDB {

    private sqlDb: Database | null = null;
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
        await this.sqlDb!.exec(`
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

    public async transact(datoms: Datom[], metadata: any = {}, options: { refreshViews?: boolean } = { refreshViews: true }) {
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
        } finally {
            if (options.refreshViews) {
                // @todo: In a production environment, we might want to refresh views asynchronously
                // or more selectively. For now, we refresh all after any transaction.
                await this.refreshAllMaterializedViews();
            }
        }
    }

    public async createMaterializedView(name: string, queryStr: string) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before creating materialized view");
        }

        const query = parseHJsonQuery(queryStr);
        const columns = query.find.map(c => c.startsWith('?') ? c.slice(1) : c);
        const tableName = `mv_${name.replace(/[^a-z0-9_]/gi, '_').toLowerCase()}`;

        // Store view definition as datoms
        // We use a negative entity ID or a specific range for "system" entities if we had one.
        // For now, let's just use a hash of the name or a large random number.
        const viewId = Math.abs(name.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0));

        const datoms: Datom[] = [
            [viewId, ":db/ident", name],
            [viewId, ":mv/name", name],
            [viewId, ":mv/query", queryStr],
            [viewId, ":mv/table", tableName],
            [viewId, ":mv/columns", JSON.stringify(columns)]
        ];

        await this.transact(datoms, { system: "create_mv", name }, { refreshViews: false });

        // Create the SQLite table
        const columnDefs = columns.map(col => `"${col}" TEXT`).join(', ');
        await this.sqlDb.exec(`CREATE TABLE IF NOT EXISTS "${tableName}" (${columnDefs});`);

        await this.refreshMaterializedView(name);
    }

    public async refreshMaterializedView(name: string) {
        const viewInfo = await this.getViewInfo(name);
        if (!viewInfo) throw new Error(`Materialized view "${name}" not found`);

        const results = await this.queryHJson(viewInfo.query);
        const tableName = viewInfo.table;
        const columns = viewInfo.columns;

        await this.sqlDb!.run("BEGIN TRANSACTION");
        try {
            await this.sqlDb!.run(`DELETE FROM "${tableName}"`);
            for (const row of results) {
                const placeholders = columns.map(() => '?').join(', ');
                const sql = `INSERT INTO "${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders})`;
                await this.sqlDb!.run(sql, ...row);
            }
            await this.sqlDb!.run("COMMIT");
        } catch (e) {
            await this.sqlDb!.run("ROLLBACK");
            throw e;
        }
    }

    public async refreshAllMaterializedViews() {
        const views = await this.listMaterializedViews();
        for (const view of views) {
            await this.refreshMaterializedView(view.name);
        }
    }

    public async listMaterializedViews(): Promise<Array<{ id: number, name: string, query: string, table: string, columns: string[] }>> {
        const query = `{
          find: ["?id", "?name", "?query", "?table", "?cols"]
          where: [
            ["?id", ":mv/name", "?name"]
            ["?id", ":mv/query", "?query"]
            ["?id", ":mv/table", "?table"]
            ["?id", ":mv/columns", "?cols"]
          ]
        }`;
        const results = await this.queryHJson(query);
        return results.map(r => ({
            id: r[0] as number,
            name: r[1] as string,
            query: r[2] as string,
            table: r[3] as string,
            columns: JSON.parse(r[4] as string)
        }));
    }

    public async deleteMaterializedView(name: string) {
        const viewInfo = await this.getViewInfo(name);
        if (!viewInfo) return;

        await this.sqlDb!.exec(`DROP TABLE IF EXISTS "${viewInfo.table}"`);
        await this.deleteEntity(viewInfo.id);
    }

    public async updateMaterializedView(oldName: string, newName: string, newQueryStr: string) {
        // This will drop the old table and delete datoms
        await this.deleteMaterializedView(oldName);
        // This will create the new table and datoms
        await this.createMaterializedView(newName, newQueryStr);
    }

    private async getViewInfo(name: string) {
        const views = await this.listMaterializedViews();
        return views.find(v => v.name === name);
    }

    public async getMaterializedViewData(name: string) {
        const viewInfo = await this.getViewInfo(name);
        if (!viewInfo) throw new Error(`Materialized view "${name}" not found`);
        return await this.sqlDb!.all(`SELECT * FROM "${viewInfo.table}"`);
    }

    public async deleteEntity(eid: number | string) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before deleting");
        }
        await this.sqlDb.run(`DELETE FROM "datoms" WHERE e = ?;`, eid);
        await this.refreshAllMaterializedViews();
    }
    public async deleteAttribute(eid: number | string, attr: string) {
        if (this.sqlDb == null) {
            throw new Error("Must open database before deleting");
        }
        await this.sqlDb.run(`DELETE FROM "datoms" WHERE e = ? AND a = ?;`, eid, attr);
        await this.refreshAllMaterializedViews();
    }


    public async loadDatoms(datoms: Datom[]) {
        return this.transact(datoms, { system: "initial_load" });
    }

    public async query({ find, where, context, options }: { find: string[], where: Datom[], context?: SearchContext, options?: { limit?: number, offset?: number } }): Promise<Array<DatomField[]>> {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const contexts = await this.queryWhere(where, context);
        let matches = contexts.map((context) => actualize(context as SearchContext, find));

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

    public async queryHJson(queryStr: string): Promise<Array<DatomField[]>> {
        const query = parseHJsonQuery(queryStr);
        return this.query(query);
    }

    private async queryWhere(patterns: Datom[], ctx: SearchContext = {}): Promise<Array<ResultContext>> {
        let contexts = [ctx];
        for (const pattern of patterns) {
            const res = await Promise.all(contexts.map(async (context) => {
                if (!context) return [];
                return await this.querySingle(pattern, context);
            }));
            contexts = res.flat().filter((x): x is SearchContext => x !== null);
        }
        return contexts;
    }

    private async querySingle(pattern: Datom, context: SearchContext) {
        let relevant = (await this.relevantTriples(pattern, context));
        let matching = relevant.map((triple) => matchPattern(pattern, triple, context));
        return matching.filter((x): x is SearchContext => x !== null);
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
            const res = await this.sqlDb!.all('SELECT * from "datoms" WHERE e = ?', id);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        if (!isVariable(attribute)) {
            const res = await this.sqlDb!.all('SELECT * from "datoms" WHERE a = ?', attribute);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        if (!isVariable(value)) {
            const res = await this.sqlDb!.all('SELECT * from "datoms" WHERE v = ?', value);
            // slice throws away the transaction portion of the result
            return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
        }
        const res = await this.sqlDb!.all('SELECT * from "datoms"');
        // slice throws away the transaction portion of the result
        return res.map(datom => Object.values(datom).slice(0, 3) as Datom);
    }

    public async getAllDatoms(): Promise<Datom[]> {
        if (this.sqlDb == null) {
            throw new Error("Must open database before it can be queried");
        }
        const res = await this.sqlDb.all('SELECT e, a, v from "datoms"');
        return res.map(row => [row.e, row.a, row.v] as Datom);
    }
}

export default DatalogDB;
