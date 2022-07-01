import {matchPattern, matchPart} from ".";
import DatalogDB from "./datalogDB";
import sqlite3Driver from 'sqlite3'
import {open} from 'sqlite'

let db;
describe("async sqlite tests", () => {
    beforeAll(async () => {
        db = new DatalogDB("test.db");
        await db.open();
    });


    test("querySingle", async () => {
        expect(await db.querySingle(["?movieId", "movie/year", 1987], {})).toEqual([
            {"?movieId": 202},
            {"?movieId": 203},
            {"?movieId": 204},
        ]);
    });

    test("queryWhere", async () => {
        expect(
            await db.queryWhere(
                [
                    ["?movieId", "movie/title", "The Terminator"],
                    ["?movieId", "movie/director", "?directorId"],
                    ["?directorId", "person/name", "?directorName"],
                ],
                {}
            )
        ).toEqual([
            {"?movieId": 200, "?directorId": 100, "?directorName": "James Cameron"},
        ]);
    });

    test("query", async () => {
        expect(
            await db.query(
                {
                    find: ["?directorName"],
                    where: [
                        ["?movieId", "movie/title", "The Terminator"],
                        ["?movieId", "movie/director", "?directorId"],
                        ["?directorId", "person/name", "?directorName"],
                    ],
                }
            )
        ).toEqual([["James Cameron"]]);
    });

    test("play", async () => {
        expect(
            await db.query(
                {
                    find: ["?year"],
                    where: [
                        ["?id", "movie/title", "Alien"],
                        ["?id", "movie/year", "?year"],
                    ],
                }
            )
        ).toEqual([[1979]]);
        expect(
            await db.query(
                {
                    find: ["?directorName"],
                    where: [
                        ["?movieId", "movie/title", "RoboCop"],
                        ["?movieId", "movie/director", "?directorId"],
                        ["?directorId", "person/name", "?directorName"],
                    ],
                }
            )
        ).toEqual([["Paul Verhoeven"]]);
        expect(
            new Set(
                await db.query(
                    {
                        find: ["?attr", "?value"],
                        where: [[200, "?attr", "?value"]],
                    }
                )
            )
        ).toEqual(
            new Set([
                ["movie/title", "The Terminator"],
                ["movie/year", 1984],
                ["movie/director", 100],
                ["movie/cast", 101],
                ["movie/cast", 102],
                ["movie/cast", 103],
                ["movie/sequel", 207],
            ])
        );
        expect(
            new Set(
                await db.query(
                    {
                        find: ["?directorName", "?movieTitle"],
                        where: [
                            ["?arnoldId", "person/name", "Arnold Schwarzenegger"],
                            ["?movieId", "movie/cast", "?arnoldId"],
                            ["?movieId", "movie/title", "?movieTitle"],
                            ["?movieId", "movie/director", "?directorId"],
                            ["?directorId", "person/name", "?directorName"],
                        ],
                    }
                )
            )
        ).toEqual(
            new Set([
                ["James Cameron", "The Terminator"],
                ["John McTiernan", "Predator"],
                ["Mark L. Lester", "Commando"],
                ["James Cameron", "Terminator 2: Judgment Day"],
                ["Jonathan Mostow", "Terminator 3: Rise of the Machines"],
            ])
        );
    });

    // function onlyUnique(value, index, self) {
    //     return self.indexOf(value) === index;
    // }
    //
    // test("getUniqueAttributes", () => {
    //     let res = query({
    //         find: ["?attr"],
    //         where: [
    //             ["?any1", "?attr", "?any2"]
    //         ]
    //     }, db);
    //     console.log(res.flat().filter(onlyUnique));
    // })
    //
    //
    // test("simple query", async () => {
    //
    //     const db = await open({
    //         filename: 'test.db',
    //         driver: sqlite3Driver.Database
    //     });
    //
    //     let res = await db.all('SELECT * from "datoms" WHERE e = ?', 100);
    //     //                                               slice removes transaction
    //     let data = res.map(datom => Object.values(datom).slice(0, 3))
    //
    //     expect(data).toEqual([
    //         [100, 'person/name', 'James Cameron'],
    //         [100, 'person/born', '1954-08-16T00:00:00Z']
    //     ])
    // });
})

