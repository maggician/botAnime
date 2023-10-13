const mongoose = require('mongoose');

const capituloSchema = new mongoose.Schema({

    nombre: String,  // Nombre del stado
    status: Boolean,
});

module.exports = mongoose.model('Status', capituloSchema);
