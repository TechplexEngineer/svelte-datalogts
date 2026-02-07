import type { PageServerLoad } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";

export const load: PageServerLoad = async () => {
    const db = await DatalogDB.create("movies.db");
    const datoms = await db.getAllDatoms();

    return {
        datoms
    };
};
