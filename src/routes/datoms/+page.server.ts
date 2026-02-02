import type { PageServerLoad, Actions } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import type { SearchContext, Datom } from "../../lib/datalogts/src/datom";
import exampleTriples from "$lib/datalogts/src/exampleTriples";

export const load: PageServerLoad = async () => {
    const db = await DatalogDB.create("movies.db");
    let datoms = await db.query({
        find: ["?entity", "?attr", "?value"],
        where: [
            ["?entity", "?attr", "?value"]
        ],
    });

    let reduced = datoms.reduce<{ data: { [key: string]: SearchContext }, attrs: Set<string> }>((accum, currentValue) => {
        if (currentValue == null) {
            currentValue = ["null", "null", "null"]
        }

        const entity = String(currentValue[0]);
        const attribute = String(currentValue[1]);
        const value = currentValue[2];

        if (accum.data[entity] == null) {
            accum.data[entity] = { id: entity };
        }
        accum.data[entity][attribute] = value;
        accum.attrs.add(attribute);
        return accum;
    }, {
        data: {},
        attrs: new Set()
    })

    return {
        datoms: reduced.data,
        attrs: reduced.attrs
    }
}

export const actions: Actions = {
    create: async ({ request }) => {
        const data = await request.formData();
        const json = data.get('json') as string;
        try {
            const parsed = JSON.parse(json);
            const db = await DatalogDB.create("movies.db");
            const eid = parsed.id || Date.now();
            const datoms: Datom[] = [];
            for (const [attr, value] of Object.entries(parsed)) {
                if (attr === 'id') continue;
                datoms.push([eid, attr, value as string | number]);
            }
            await db.transact(datoms);
            return { success: true, error: undefined };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    },
    delete: async ({ request }) => {
        const data = await request.formData();
        const eid = data.get('eid') as string;
        if (eid) {
            const db = await DatalogDB.create("movies.db");
            await db.deleteEntity(eid);
            return { success: true, error: undefined };
        }
        return { success: false, error: 'Entity ID is required' };
    },
    loadExamples: async () => {
        try {
            const db = await DatalogDB.create("movies.db");
            await db.loadDatoms(exampleTriples);
            return { success: true, error: undefined };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    },
    query: async ({ request }) => {
        const data = await request.formData();
        const queryStr = data.get('query') as string;
        try {
            const db = await DatalogDB.create("movies.db");
            const results = await db.queryHJson(queryStr);
            return { success: true, queryResults: results, queryError: undefined };
        } catch (e) {
            return { success: false, queryError: (e as Error).message };
        }
    }
};