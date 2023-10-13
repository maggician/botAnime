const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
    title: String,
    capitulo: String,
    urlPlay: String,
    urlImg: String,
    code:String,
    // Otros campos relevantes
});

module.exports = mongoose.model('AnimesNuevos', animeSchema);