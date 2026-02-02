import DatalogDB from "./datalogDB";
import type { Datom } from "./datom";

describe('Materialized Views', () => {
    let db: DatalogDB;

    beforeEach(async () => {
        db = await DatalogDB.create("test_mv.db");
        await db.truncate();
    });

    afterAll(async () => {
        // Cleanup if necessary
    });

    it('should create a materialized view and populate it', async () => {
        await db.loadDatoms([
            [1, "name", "Alice"],
            [2, "name", "Bob"]
        ]);

        const queryStr = `{
            find: ["?name"]
            where: [
                ["?e", "name", "?name"]
            ]
        }`;

        await db.createMaterializedView("all_names", queryStr);

        const views = await db.listMaterializedViews();
        expect(views.length).toBe(1);
        expect(views[0].name).toBe("all_names");

        const data = await db.getMaterializedViewData("all_names");
        expect(data.length).toBe(2);
        expect(data.map(r => (r as any).name)).toContain("Alice");
        expect(data.map(r => (r as any).name)).toContain("Bob");
    });

    it('should refresh materialized view on transaction', async () => {
        const queryStr = `{
            find: ["?name"]
            where: [
                ["?e", "name", "?name"]
            ]
        }`;

        await db.createMaterializedView("all_names", queryStr);

        await db.transact([[3, "name", "Charlie"]]);

        const data = await db.getMaterializedViewData("all_names");
        expect(data.length).toBe(1);
        expect((data[0] as any).name).toBe("Charlie");
    });

    it('should handle updates and deletions in materialized views', async () => {
        await db.loadDatoms([
            [1, "movie/title", "The Matrix"],
            [2, "movie/title", "Inception"]
        ]);

        const queryStr = `{
            find: ["?title"]
            where: [
                ["?e", "movie/title", "?title"]
            ]
        }`;

        await db.createMaterializedView("movies", queryStr);

        let data = await db.getMaterializedViewData("movies");
        expect(data.length).toBe(2);

        // Add a new movie
        await db.transact([[3, "movie/title", "Interstellar"]]);
        data = await db.getMaterializedViewData("movies");
        expect(data.length).toBe(3);
        expect(data.map(r => (r as any).title)).toContain("Interstellar");

        // Delete a movie
        await db.deleteEntity(1);

        data = await db.getMaterializedViewData("movies");
        expect(data.length).toBe(2);
        expect(data.map(r => (r as any).title)).not.toContain("The Matrix");
    });

    it('should delete a materialized view and its table', async () => {
        await db.createMaterializedView("temp_view", `{find:["?e"] where:[["?e","a","v"]]}`);

        const viewsBefore = await db.listMaterializedViews();
        expect(viewsBefore.length).toBe(1);

        await db.deleteMaterializedView("temp_view");

        const viewsAfter = await db.listMaterializedViews();
        expect(viewsAfter.length).toBe(0);

        // Verify table is gone
        await expect(db.getMaterializedViewData("temp_view")).rejects.toThrow();
    });

    it('should update a materialized view name and query', async () => {
        await db.loadDatoms([
            [1, "name", "Alice"],
            [1, "age", 30]
        ]);

        await db.createMaterializedView("old_view", `{find:["?name"] where:[["?e","name","?name"]]}`);

        // Update name and query (add age)
        await db.updateMaterializedView("old_view", "new_view", `{find:["?name", "?age"] where:[["?e","name","?name"], ["?e","age","?age"]]}`);

        const views = await db.listMaterializedViews();
        expect(views.length).toBe(1);
        expect(views[0].name).toBe("new_view");
        expect(views[0].columns).toContain("name");
        expect(views[0].columns).toContain("age");

        const data = await db.getMaterializedViewData("new_view");
        expect(data.length).toBe(1);
        expect((data[0] as any).name).toBe("Alice");
        expect((data[0] as any).age).toBe("30"); // Age might be stored as string in mv if not careful, but BLOB/TEXT in sqlite...

        // Verify old view info is gone
        await expect(db.getMaterializedViewData("old_view")).rejects.toThrow();
    });
});
