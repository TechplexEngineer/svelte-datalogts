import { test, expect } from '@playwright/test';
import { parseHJsonQuery } from './queryParser.js';

test.describe("parseHJsonQuery", () => {
    test("should parse a basic HJSON query", () => {
        const queryStr = `
        {
            find: ["?name"]
            where: [
                ["?e", "person/name", "?name"]
            ]
        }
        `;
        const query = parseHJsonQuery(queryStr);
        expect(query.find).toEqual(["?name"]);
        expect(query.where).toEqual([["?e", "person/name", "?name"]]);
    });

    test("should parse HJSON with comments and without quotes", () => {
        const queryStr = `
        {
            # Find all person names
            find: ["?name"]
            where: [
                ["?e", "person/name", "?name"]
            ]
        }
        `;
        const query = parseHJsonQuery(queryStr);
        expect(query.find).toEqual(["?name"]);
        expect(query.where).toEqual([["?e", "person/name", "?name"]]);
    });

    test("should parse options", () => {
        const queryStr = `
        {
            find: ["?name"]
            where: [
                ["?e", "person/name", "?name"]
            ]
            options: {
                limit: 10
                offset: 5
            }
        }
        `;
        const query = parseHJsonQuery(queryStr);
        expect(query.options).toEqual({ limit: 10, offset: 5 });
    });

    test("should throw error on invalid HJSON", () => {
        const queryStr = `{ find: [ }`;
        expect(() => parseHJsonQuery(queryStr)).toThrow(/Failed to parse HJSON query/);
    });

    test("should throw error if find is missing", () => {
        const queryStr = `{ where: [] }`;
        expect(() => parseHJsonQuery(queryStr)).toThrow(/Query must include a 'find' array/);
    });

    test("should throw error if where is missing", () => {
        const queryStr = `{ find: [] }`;
        expect(() => parseHJsonQuery(queryStr)).toThrow(/Query must include a 'where' array/);
    });
});
