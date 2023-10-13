// animeSchema.js
const mongoose = require('mongoose');

const animeGlobalSchema = new mongoose.Schema({
    nombre: String,
    nombresAlternos: [String],
    imgUrl: String,
    tipo: String,
    episodios: [Number],
    fechaDesiguienteCap: Date,
    descripcion: String,
    generos: [String],
    emision: Boolean,
    codigoJkanime: Number,
    codigoAnimeflv: Number,
    urlJkanime: String,
    urlAnimeFlv: String,
    vistaSemanal: {
        type: Number,
        default: 0
    },
    vistaMensual: {
        type: Number,
        default: 0
    },
    relation: [{ nombreRelacion: String, tipoRelacion: String, urlRelacion: String }]
});

module.exports = mongoose.model('animeGlobal', animeGlobalSchema);
