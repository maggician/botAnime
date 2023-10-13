const mongoose = require('mongoose');

const capituloSchema = new mongoose.Schema({
    numero: Number,  // Número de capítulo
    nombre: String,  // Nombre del capítulo (opcional)
    imagenUrl: String,
    urlAnimeFlv: String,
    servidores: [
        {
            nombreServidor: String,  // Nombre del servidor
            urlServidor: String,
            // URL del servidor
        }
    ],
    anime: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'animeGlobal'
    }
});

module.exports = mongoose.model('Capitulo', capituloSchema);
