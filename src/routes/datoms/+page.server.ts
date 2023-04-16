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

    let reduced = datoms.reduce<{data: {[key:DatomPart]: SearchContext}, attrs: Set<string>}>((accum, currentValue) => {

        // if (accum == null) {
        //     accum = {};
        // }
        if (currentValue == null) {
            currentValue = ["null","null","null"]
        }

        const entity = currentValue[0];
        const attribute = currentValue[1];
        const value = currentValue[2];

        if (accum.data[entity] == null) {
            accum.data[entity] = {id: entity};
        }
        accum.data[entity][attribute] = value;
        accum.attrs.add(attribute);
        return accum;
    }, {
        data:{},
        attrs: new Set()
    })
    //     .filter((value, index, array) => {
    //     return array.indexOf(value[0]) === index;
    // })
    // datoms = datoms.flat().filter(onlyUnique)
    // console.log('Datoms found', reduced);

    return {
        datoms: reduced.data,
        attrs: reduced.attrs
    }
}