import * as assert from 'assert'
import { AccessorInterface, ReadResult, UpdateResult, AddResult, RemoveResult, CountResult } from "./accessor"
import { Params, ActionType, UPDATE_COMMANDS, Order, Direction } from './../types'
import { MongoClient, ObjectID, MongoClientOptions, Db } from 'mongodb'


export class MongoAccessor implements AccessorInterface {

    readonly type: string = 'mongo'
    readonly db_name: string
    readonly conn: MongoClient
    db: Db

    /**
     * @see https://mongodb.github.io/node-mongodb-native/3.3/reference/connecting/connection-settings/
     */
    constructor(db: string, url: string, options?: MongoClientOptions) {
        this.db_name = db
        this.conn = new MongoClient(url, options || {})
        this.db = null as Db
    }

    async init() {
        await this.conn.connect()
        this.db = this.conn.db(this.db_name)
        return
    }

    async execute(params: Params): Promise<ReadResult | UpdateResult | AddResult | RemoveResult | CountResult | never> {
        const { collection, action, query } = params

        if (query && query._id) {
            query._id = new ObjectID(query._id)
        }

        if (action === ActionType.READ) {
            return await this.read(collection, params)
        }

        if (action === ActionType.UPDATE) {
            return await this.update(collection, params)
        }

        if (action === ActionType.ADD) {
            return await this.add(collection, params)
        }

        if (action === ActionType.REMOVE) {
            return await this.remove(collection, params)
        }

        if (action === ActionType.COUNT) {
            return await this.count(collection, params)
        }

        throw new Error(`invalid 'action': ${action}`)
    }

    async get(collection: string, query: any): Promise<any> {
        if (query && query._id) {
            query._id = new ObjectID(query._id)
        }
        const coll = this.db.collection(collection)
        return await coll.findOne(query)
    }

    protected async read(collection: string, params: Params): Promise<ReadResult> {
        const coll = this.db.collection(collection)

        let { query, order, offset, limit, projection } = params
        query = query || {}
        let options: any = {
            limit: 100
        }
        if (order) options.sort = this.processOrder(order)
        if (offset) options.skip = offset
        if (projection) options.projection = projection

        if (limit) {
            options.limit = limit > 100 ? 100 : limit
        }
        const data = await coll.find(query, options).toArray()
        return { list: data }
    }

    protected async update(collection: string, params: Params): Promise<UpdateResult> {
        const coll = this.db.collection(collection)

        let { query, data, multi, upsert, merge } = params

        query = query || {}
        data = data || {}

        let options = {} as any
        if (upsert) options.upsert = upsert

        const OPTRS = Object.values(UPDATE_COMMANDS)

        // process update operators
        if (!merge) {
            // check if any operator exists
            let hasOperator = false
            const checkMixed = objs => {
                if (typeof objs !== 'object') return

                for (let key in objs) {
                    if (OPTRS.includes(key)) {
                        hasOperator = true
                    } else if (typeof objs[key] === 'object') {
                        checkMixed(objs[key])
                    }
                }
            }
            checkMixed(data)

            assert.ok(!hasOperator, 'data must not contain any operator while `merge` with false')
            let result: any = await coll.replaceOne(query, data, options)
            return {
                upsert_id: result.upsertedId,
                updated: result.modifiedCount,
                matched: result.matchedCount
            }
        }

        // add default operator($set) for non-operator-object if merge === true
        for (let key in data) {
            if (OPTRS.includes(key))
                continue

            data[UPDATE_COMMANDS.SET] = {
                [key]: data[key]
            }
            delete data[key]
        }

        let result: any
        if (!multi) {
            result = await coll.updateOne(query, data, options)
        } else {
            options.upsert = false
            result = await coll.updateMany(query, data, options)
        }

        return {
            upsert_id: result.upsertedId,
            updated: result.modifiedCount,
            matched: result.matchedCount
        }
    }

    protected async add(collection: string, params: Params): Promise<AddResult> {
        const coll = this.db.collection(collection)
        let { data, multi } = params
        data = data || {}
        let result: any
        if (!multi) {
            result = await coll.insertOne(data)
        } else {
            data = data instanceof Array ? data : [data]
            result = await coll.insertMany(data)
        }

        return {
            _id: result.insertedIds || result.insertedId,
            insertedCount: result.insertedCount
        }
    }

    protected async remove(collection: string, params: Params): Promise<RemoveResult> {
        const coll = this.db.collection(collection)
        let { query, multi } = params
        query = query || {}
        let result: any
        if (!multi) {
            result = await coll.deleteOne(query)
        } else {
            result = await coll.deleteMany(query)
        }
        return {
            deleted: result.deletedCount
        }
    }

    protected async count(collection: string, params: Params): Promise<CountResult> {
        const coll = this.db.collection(collection)

        const query = params.query || {}
        const options = {}
        const result = await coll.countDocuments(query, options)
        return {
            count: result
        }
    }

    protected processOrder(order: Order[]) {
        if (!(order instanceof Array))
            return undefined

        return order.map(o => {
            const dir = o.direction === Direction.DESC ? -1 : 1
            return [o.field, dir]
        })
    }
}