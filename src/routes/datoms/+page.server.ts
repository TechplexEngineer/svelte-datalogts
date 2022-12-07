import type {PageServerLoad} from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import exampleTriples from "$lib/datalogts/src/exampleTriples";
import {onlyUnique} from "$lib/datalogts/src/utils";
import {Datom, ResultContext, type DatomPart, SearchContext} from "../../lib/datalogts/src/datom";


export const load: PageServerLoad = async () => {

    const db = await DatalogDB.create("movies.db");

    let datoms = [];

    // @todo need a way to only run this once
    // await db.loadDatoms(exampleTriples);

    // datoms = await db.query({
    //     find: ["?entity", "?attr", "?value"],
    //     where: [
    //         ["?entity", "?attr", "?value"]
    //     ],
    //     options: {
    //         limit: 5
    //     }
    // })

    datoms = await db.query({
        find: ["?entity", "?attr", "?value"],
        where: [
            ["?entity", "?attr", "?value"]
        ],
        // options: {
        //     limit: 5
        // }
    })

    let reduced = datoms.reduce<{[key:DatomPart]: SearchContext}>((previousValue, currentValue) => {

        if (previousValue == null) {
            previousValue = {};
        }
        if (currentValue == null) {
            currentValue = ["null","null","null"]
        }

        const entity = currentValue[0];
        const attribute = currentValue[1];
        const value = currentValue[2];
        if (previousValue[entity] == null) {
            previousValue[entity] = {};
        }
        previousValue[entity][attribute] = value;
        return previousValue;
    }, {})
    //     .filter((value, index, array) => {
    //     return array.indexOf(value[0]) === index;
    // })
    // datoms = datoms.flat().filter(onlyUnique)
    console.log('Datoms found', reduced);

    return {
        datoms
    }
}