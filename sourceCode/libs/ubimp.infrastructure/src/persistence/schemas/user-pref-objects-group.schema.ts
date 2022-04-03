import * as mongoose from 'mongoose';

export const UserPrefObjectsGroupSchema = new mongoose.Schema({

    /**
     * Name of the group
     */
    name: { type: String, required: true  },

    /**
     * Ids of the objects or vehicles
     */
    objectsIds: { type: [String], required: false },
});

UserPrefObjectsGroupSchema.add({

    groups: { type: [UserPrefObjectsGroupSchema], required: false }
});