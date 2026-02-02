import type { PageServerLoad, Actions } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const { name } = params;
    const db = await DatalogDB.create("movies.db");
    const views = await db.listMaterializedViews();
    const view = views.find(v => v.name === name);

    if (!view) {
        throw error(404, 'Materialized view not found');
    }

    return {
        view
    };
};

export const actions: Actions = {
    update: async ({ request, params }) => {
        const oldName = params.name;
        const data = await request.formData();
        const newName = data.get('name') as string;
        const query = data.get('query') as string;

        if (!newName || !query) {
            return { success: false, error: "Name and Query are required" };
        }

        try {
            const db = await DatalogDB.create("movies.db");
            await db.updateMaterializedView(oldName as string, newName, query);
        } catch (e) {
            return { success: false, error: (e as Error).message };
        }

        throw redirect(303, `/views/${newName}`);
    }
};
