import Dexie, { type EntityTable } from "dexie"
import type { ConversationType } from "$lib/types/types"

const db = new Dexie("grade-ai") as Dexie & {
    conversations: EntityTable<ConversationType, "id">
};

db.version(1).stores({
    conversations: '++id, name, slug, content'
})

export { db }