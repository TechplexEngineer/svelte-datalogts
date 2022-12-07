import type {PageServerLoad} from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import exampleTriples from "$lib/datalogts/src/exampleTriples";
import {onlyUnique} from "../../lib/datalogts/src/utils";


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
        find: ["?entity"],
        where: [
            ["?entity", "?attr", "?value"]
        ],
        // options: {
        //     limit: 5
        // }
    })
    datoms = datoms.flat().filter(onlyUnique)
    console.log('Datoms found', datoms);

    return {
        datoms
    }
}