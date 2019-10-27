
function DataFieldHandler(config, { ruler, query, data, injections }){
    const { allow } = config
    
    if(allow instanceof Array) {
        if(!data) return true
        if(typeof data !== "object") return true

        const keys = Object.keys(data)
        const r = keys.every(key => allow.includes(key))
        return r ? null : `only [${allow.join(',')}] allowed in data, [${keys.join(',')}] given`
    }

    return null
}

module.exports = DataFieldHandler