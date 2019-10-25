
function DataFieldHandler(config, { ruler, query, data, injections }){
    const { allow } = config
    
    if(allow instanceof Array) {
        if(!data) return true
        if(typeof data !== "object") return true

        const keys = Object.keys(data)
        return keys.every(key => allow.includes(key))
    }

    return false
}

module.exports = DataFieldHandler