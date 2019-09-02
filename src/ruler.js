
class Ruler {
    constructor(entry){
        this._entry = entry
        this._validators = {}
    }

    load(){

    }
    
    async validate(){

    }

    registerValidator(name, handler) {
        if(!name){
            throw new Error(`register error: name must not be empty`)
        }

        if(!handler instanceof Function){
            throw new Error(`${name} register error: 'handler' must be a callable function`)
        }

        const exists = Object.keys(this._validators).filter(vn => vn === name)
        if(exists.length){
            throw new Error(`validator's name: '${name}' duplicated`)
        }

        this._validators[name] = handler
    }
}

module.exports = Ruler