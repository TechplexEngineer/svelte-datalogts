import DatalogDB from "./datalogDB.js";
import exampleTriples from "./exampleTriples";
import {onlyUnique} from "./utils";

let db; //:DatalogDB;

beforeAll(async () => {
    db = await DatalogDB.create("test.db");
    await db.truncate();
    await db.loadDatoms(exampleTriples);
});

describe("querySingle", () => {

    test("find movies with movie/year of 1987", async () => {
        expect(await db.querySingle(
            ["?movieId", "movie/year", 1987],
            {}
        )).toEqual([
            {"?movieId": 202},
            {"?movieId": 203},
            {"?movieId": 204},
        ]);
    });

    test("find movieId for Terminator", async () => {
        expect(await db.querySingle(
            ['?movieId', 'movie/title', 'The Terminator'],
            {}
        )).toEqual([
            {"?movieId": 200}
        ]);
    });
});

describe("queryWhere", () => {
    test("Find the director of the terminator movie", async () => {
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
            {
                "?movieId": 200,
                "?directorId": 100,
                "?directorName": "James Cameron"
            },
        ]);
    });
});
describe("query", () => {
    test("Find director of `The Terminator`", async () => {
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

    test("Find year Alien was released", async () => {
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
    });
    test("Find the director of `RoboCop`", async () => {
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
    });
    test("Find all attributes and values of entity `200`", async () => {
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
    });
    test("Find director and title of all movies with `Arnold Schwarzenegger`", async () => {
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
    test("Find entity attribute and value, limit 2 no offset", async () => {
        expect(
            new Set(
                await db.query(
                    {
                        find: ["?entity", "?attr", "?value"],
                        where: [["?entity", "?attr", "?value"]],
                        options: {
                            offset: 0,
                            limit: 2
                        }
                    }
                )
            )
        ).toEqual(
            new Set([
                [100, "person/name", "James Cameron"],
                [100, "person/born", "1954-08-16T00:00:00Z"]
            ])
        );
    });
    test("Find entity attribute and value, limit 0, offset 0", async () => {
        expect(
            new Set(
                await db.query(
                    {
                        find: ["?entity", "?attr", "?value"],
                        where: [["?entity", "?attr", "?value"]],
                        options: {
                            offset: 0,
                            limit: 0
                        }
                    }
                )
            )
        ).toEqual(
            new Set([])
        );
    });

    test("getUniqueAttributes", async () => {
        expect((await db.query({
            find: ["?attr"],
            where: [
                ["?any1", "?attr", "?any2"]
            ]
        }, db)).flat().filter(onlyUnique)).toEqual([
            'person/name',
            'person/born',
            'person/death',
            'movie/title',
            'movie/year',
            'movie/director',
            'movie/cast',
            'movie/sequel',
            'trivia'
        ]);
    });

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
});

