import { parseHJsonQuery } from './src/lib/datalogts/src/queryParser.js';

const queryStr = `
{
    find: ["?name"]
    where: [
        ["?e", "person/name", "?name"]
    ]
}
`;

try {
    const q = parseHJsonQuery(queryStr);
    console.log("Parsed successfully:", q);
} catch (e) {
    console.error("Failed to parse:", e);
}
