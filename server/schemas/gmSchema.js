const mongoose = require('mongoose');

const capituloSchema = new mongoose.Schema({

    usuario: { type: String, unique: true },  // Nombre del sgm
    email: { type: String, unique: true },
    password: String,
    lvlAdmin: Number,
});

module.exports = mongoose.model('gmList', capituloSchema);
