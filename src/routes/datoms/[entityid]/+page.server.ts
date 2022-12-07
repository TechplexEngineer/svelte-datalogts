import type {PageServerLoad} from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import {onlyUnique} from "$lib/datalogts/src/utils";


export const load: PageServerLoad = async ({params}) => {

    const db = await DatalogDB.create("movies.db");

    let datoms = [];

    // @todo need a way to only run this once
    // await db.loadDatoms(exampleTriples);

    datoms = await db.query({
        find: ["?entity", "?attr", "?value"],
        where: [
            ["?entity", "?attr", "?value"]
        ],
        context: {
            "?entity": parseInt(params.entityid)
        },
        options: {
            limit: 5
        }
    })

    console.log('Datoms found', datoms);

    return {
        datoms
    }
}