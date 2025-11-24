const bycript = require('bcryptjs')


const encrypt =async (passwordPlain) => {
    const hash = await bycript.hash(passwordPlain,10)
    return hash
}

const compare = async (passwordPlain,hashPassword) => {
    return await bycript.compare(passwordPlain,hashPassword)
}

module.exports = {
    encrypt,
    compare
}