import type { PageServerLoad, Actions } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";

export const load: PageServerLoad = async () => {
    const db = await DatalogDB.create("movies.db");
    const views = await db.listMaterializedViews();
    return {
        views
    };
};

export const actions: Actions = {
    create: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name') as string;
        const query = data.get('query') as string;

        if (!name || !query) {
            return { success: false, error: "Name and Query are required" };
        }

        try {
            const db = await DatalogDB.create("movies.db");
            await db.createMaterializedView(name, query);
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    },
    delete: async ({ request }) => {
        const data = await request.formData();
        const name = data.get('name') as string;

        if (!name) {
            return { success: false, error: "Name is required" };
        }

        try {
            const db = await DatalogDB.create("movies.db");
            await db.deleteMaterializedView(name);
            return { success: true };
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }
    }
};
