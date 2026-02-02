import type { PageServerLoad } from './$types';
import DatalogDB from "$lib/datalogts/src/datalogDB";
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
    const { name } = params;
    try {
        const db = await DatalogDB.create("movies.db");
        // Need to get view info to get columns
        const views = await db.listMaterializedViews();
        const viewInfo = views.find(v => v.name === name);

        if (!viewInfo) {
            throw error(404, 'Materialized view not found');
        }

        const data = await db.getMaterializedViewData(name);
        return {
            name,
            columns: viewInfo.columns,
            rows: data
        };
    } catch (e) {
        if ((e as any).status === 404) throw e;
        throw error(500, (e as Error).message);
    }
};
