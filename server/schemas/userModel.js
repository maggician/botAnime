// userModel.js
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    isVIP: { type: Boolean, default: false },
    banned: { type: Boolean, default: false },
    vipExpirationDate: Date, // Fecha de vencimiento del estado VIP
    history: [
        {
            animeId: { type: mongoose.Schema.Types.ObjectId, ref: 'animeGlobal' },
            capiNumeber: String,
            lastWatched: Date,
            durationWatched: { type: Number, default: 0 },
            durationTotal: { type: Number, default: 0 } // Duración total vista en segundos
        },
    ],
    favorites: [{ animeId: { type: mongoose.Schema.Types.ObjectId, ref: 'animeGlobal' } }],
});


module.exports = mongoose.model('User', userSchema);