import type { PageServerLoad, Actions } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";

export const load: PageServerLoad = async ({ params }) => {
    const db = await DatalogDB.create("movies.db");
    const entityId = isNaN(parseInt(params.entityid)) ? params.entityid : parseInt(params.entityid);

    const datoms = await db.query({
        find: ["?entity", "?attr", "?value"],
        where: [
            [entityId as any, "?attr", "?value"]
        ]
    });

    return {
        entityId,
        datoms
    }
}

export const actions: Actions = {
    updateAttribute: async ({ request, params }) => {
        const data = await request.formData();
        const attr = data.get('attr') as string;
        const value = data.get('value') as string;

        const entityId = isNaN(parseInt(params.entityid)) ? params.entityid : parseInt(params.entityid);

        const db = await DatalogDB.create("movies.db");

        if (attr && value !== undefined) {
            await db.deleteAttribute(entityId, attr);
            const newVal = isNaN(Number(value)) ? value : Number(value);
            await db.transact([[entityId as any, attr, newVal as any]]);
            return { success: true };
        }
        return { success: false, error: "Missing attribute or value" };
    },
    addAttribute: async ({ request, params }) => {
        const data = await request.formData();
        const attr = data.get('attr') as string;
        const value = data.get('value') as string;

        const entityId = isNaN(parseInt(params.entityid)) ? params.entityid : parseInt(params.entityid);

        if (attr && value !== undefined) {
            const db = await DatalogDB.create("movies.db");
            const val = isNaN(Number(value)) ? value : Number(value);
            await db.transact([[entityId as any, attr, val as any]]);
            return { success: true };
        }
        return { success: false, error: "Missing attribute or value" };
    }
};