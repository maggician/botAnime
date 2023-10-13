const mongoose = require('mongoose');

const capituloSchema = new mongoose.Schema({

    nombre: String,  // Nombre del stado
    numero: String,
    extension: {
        type: String,
        default: '@c.us' // Valor predeterminado para la extensión
    }
});

module.exports = mongoose.model('Status', capituloSchema);
