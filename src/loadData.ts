

import sqlite from 'sqlite3';

const sqlite3 = sqlite.verbose();
const db = new sqlite3.Database("test.db");

db.serialize();
db.run(`CREATE TABLE IF NOT EXISTS "datoms" (
    "e"		INTEGER NOT NULL,
    "a"		SMALLINT NOT NULL,
    "v"		BLOB NOT NULL,
    "tx"	INTEGER NOT NULL
);`);
db.run(`CREATE TABLE IF NOT EXISTS "schema" (
    "e"	INTEGER NOT NULL,
    "a"	SMALLINT NOT NULL,
    "v"	BLOB NOT NULL
);`);
console.log("Done Creating Tables");

// db.parallelize();
import datoms from './exampleTriples.js';

let txCounter = 0;
for (const datom of datoms) {
    console.log(datom);
    db.run(`INSERT INTO "datoms" (e, a, v, tx) VALUES ($e, $a, $v, $tx);`, {
        $e: datom[0],
        $a: datom[1],
        $v: datom[2],
        $tx: txCounter++
    });
}