"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const types_1 = require("./../types");
const mongodb_1 = require("mongodb");
class MongoAccessor {
    constructor(db, url, options) {
        this.type = 'mongo';
        this.db_name = db;
        this.conn = new mongodb_1.MongoClient(url, options || {});
        this.db = null;
    }
    async init() {
        await this.conn.connect();
        this.db = this.conn.db(this.db_name);
        return;
    }
    async execute(params) {
        const { collection, action, query } = params;
        if (query && query._id) {
            query._id = new mongodb_1.ObjectID(query._id);
        }
        if (action === types_1.ActionType.READ) {
            return await this.read(collection, params);
        }
        if (action === types_1.ActionType.UPDATE) {
            return await this.update(collection, params);
        }
        if (action === types_1.ActionType.ADD) {
            return await this.add(collection, params);
        }
        if (action === types_1.ActionType.REMOVE) {
            return await this.remove(collection, params);
        }
        if (action === types_1.ActionType.COUNT) {
            return await this.count(collection, params);
        }
        throw new Error(`invalid 'action': ${action}`);
    }
    async get(collection, query) {
        if (query && query._id) {
            query._id = new mongodb_1.ObjectID(query._id);
        }
        const coll = this.db.collection(collection);
        return await coll.findOne(query);
    }
    async read(collection, params) {
        const coll = this.db.collection(collection);
        let { query, order, offset, limit, projection } = params;
        query = query || {};
        let options = {
            limit: 100
        };
        if (order)
            options.sort = this.processOrder(order);
        if (offset)
            options.skip = offset;
        if (projection)
            options.projection = projection;
        if (limit) {
            options.limit = limit > 100 ? 100 : limit;
        }
        const data = await coll.find(query, options).toArray();
        return { list: data };
    }
    async update(collection, params) {
        const coll = this.db.collection(collection);
        let { query, data, multi, upsert, merge } = params;
        query = query || {};
        data = data || {};
        let options = {};
        if (upsert)
            options.upsert = upsert;
        const OPTRS = Object.values(types_1.UPDATE_COMMANDS);
        if (!merge) {
            let hasOperator = false;
            const checkMixed = objs => {
                if (typeof objs !== 'object')
                    return;
                for (let key in objs) {
                    if (OPTRS.includes(key)) {
                        hasOperator = true;
                    }
                    else if (typeof objs[key] === 'object') {
                        checkMixed(objs[key]);
                    }
                }
            };
            checkMixed(data);
            assert.ok(!hasOperator, 'data must not contain any operator while `merge` with false');
            let result = await coll.replaceOne(query, data, options);
            return {
                upsert_id: result.upsertedId,
                updated: result.modifiedCount,
                matched: result.matchedCount
            };
        }
        for (let key in data) {
            if (OPTRS.includes(key))
                continue;
            data[types_1.UPDATE_COMMANDS.SET] = {
                [key]: data[key]
            };
            delete data[key];
        }
        let result;
        if (!multi) {
            result = await coll.updateOne(query, data, options);
        }
        else {
            options.upsert = false;
            result = await coll.updateMany(query, data, options);
        }
        return {
            upsert_id: result.upsertedId,
            updated: result.modifiedCount,
            matched: result.matchedCount
        };
    }
    async add(collection, params) {
        const coll = this.db.collection(collection);
        let { data, multi } = params;
        data = data || {};
        let result;
        if (!multi) {
            result = await coll.insertOne(data);
        }
        else {
            data = data instanceof Array ? data : [data];
            result = await coll.insertMany(data);
        }
        return {
            _id: result.insertedIds || result.insertedId,
            insertedCount: result.insertedCount
        };
    }
    async remove(collection, params) {
        const coll = this.db.collection(collection);
        let { query, multi } = params;
        query = query || {};
        let result;
        if (!multi) {
            result = await coll.deleteOne(query);
        }
        else {
            result = await coll.deleteMany(query);
        }
        return {
            deleted: result.deletedCount
        };
    }
    async count(collection, params) {
        const coll = this.db.collection(collection);
        const query = params.query || {};
        const options = {};
        const result = await coll.countDocuments(query, options);
        return {
            count: result
        };
    }
    processOrder(order) {
        if (!(order instanceof Array))
            return undefined;
        return order.map(o => {
            const dir = o.direction === types_1.Direction.DESC ? -1 : 1;
            return [o.field, dir];
        });
    }
}
exports.MongoAccessor = MongoAccessor;
