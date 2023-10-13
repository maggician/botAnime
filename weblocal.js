// server/app.js
/*
npm uninstall glob
npm i glob@8.0.3*/
const mongoose = require('mongoose');
; // Añadir esta línea para trabajar con archivos
const express = require('express');
const app = express();
const session = require('express-session');
const fs = require('fs');

const path = require('path');



//bot discord
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const { Guilds, GuildMembers, GuildMessages } = GatewayIntentBits;
const { User, Message, GuildMember, ThreadMember } = Partials;


const client = new Client({
    intents: [Guilds, GuildMembers, GuildMessages],
    Partials: [User, Message, GuildMember, ThreadMember]
});

const { loadEvents } = require('./Handlers/eventHandler');

client.config = require('./config.json');
client.events = new Collection();
client.commands = new Collection();

loadEvents(client);


client.login(client.config.token);

//schema
const animeSchema = require('./server/schemas/animeGlobalSchema');
const capiSchema = require('./server/schemas/capiSchema');
const Anime = require('./server/schemas/nuevosCapiSchema');

const axios = require('axios');
const cheerio = require('cheerio');

const URL = 'https://www3.animeflv.net';
const TOPIC = 'new_movies';

//whatsapp










mongoose.connect('mongodb+srv://NAKAMA97:JqxpO3bbW4QMj9ni@cluster0.qxni5f4.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});






// ...

// Función para realizar el web scraping
async function scrapeWebsite() {
    try {
        //console.log('leyendo url')
        const response = await axios.get(URL);
        const $ = cheerio.load(response.data);
        const scrapedData = [];

        const ulElement = $('ul.ListEpisodios.AX.Rows.A06.C04.D03');
        const listItems = ulElement.find('li');

        listItems.each((index, element) => {
            const urlPlay = URL + $(element).find('a.fa-play').attr("href");
            const imageElement = $(element).find('.Image img');
            const urlImg = URL + imageElement.attr('src');
            const title = $(element).find('.Title').text().trim();
            const capitulo = $(element).find('.Capi').text().trim();


            scrapedData.push({ title, urlPlay, urlImg, capitulo });
        });

        const reverseScrape = [...scrapedData].reverse();

        return reverseScrape;
    } catch (error) {
        console.error('Error en el web scraping:', error);
    }
}

async function scrapeAndNotify() {
    try {
        const scrapedData = await scrapeWebsite();
        await sendNotificationsAndSave(scrapedData);
        //console.log(scrapedData)
    } catch (error) {
        console.error('Error general:', error);
    }
}

// Ejecutar la función de web scraping cada 30 segundos
const scrapingInterval = 45 * 1000; // 30 segundos en milisegundos
setInterval(scrapeAndNotify, scrapingInterval);

async function sendNotificationsAndSave(animes) {
    const storedAnimes = await Anime.find({}, 'urlPlay');

    const newAnimes = animes.filter(data => {
        return !storedAnimes.some(storedAnime => storedAnime.urlPlay == data.urlPlay);
    });

    if (newAnimes.length > 0) {
        console.log('Tamaño de nuevos:', newAnimes.length);

        for (const data of newAnimes) {
            // Importar el módulo de fecha
            const fechaActual = new Date();

            // Obtener la hora, minutos y segundos
            const horas = fechaActual.getHours();
            const minutos = fechaActual.getMinutes();
            const segundos = fechaActual.getSeconds();
            //   console.log('Nuevo anime ', data.title, "hora", horas + ":" + minutos + ":" + segundos, ` y tinee url ${data.urlPlay} capitulu: ${data.capitulo}`);
            const capiNumerSplit = data.capitulo.split(' ');
            if (capiNumerSplit[1] == '1') {
                console.log('anime nuevo');
                var urlref = data.urlPlay.replace('/ver/', '/anime/')
                const lastIndex = urlref.lastIndexOf('-');

                if (lastIndex !== -1) {
                    // Si se encuentra un guion, elimina todo lo que viene después de él
                    urlref = urlref.slice(0, lastIndex);
                    //        console.log(urlref);
                } else {
                    // Si no se encuentra un guion, la URL permanece sin cambios
                    //       console.log(urlref);
                }
                const resultado = await animeSchema.findOne({ urlAnimeFlv: urlref }, 'nombre');
                //  console.log(resultado);
                try {
                    if (resultado) {
                        const episodio = capiNumerSplit[1];
                        const anime_id = resultado._id;
                        const servidores = [];

                        try {


                            const response = await axios.get(data.urlPlay);
                            const $ = cheerio.load(response.data);
                            var imagenUrl = '';
                            // Buscar el script
                            const script = $('script[type="text/javascript"]').text();

                            // Extraer el valor de la variable "videos"
                            const videosValue = script.match(/var videos = (.*?);/);

                            if (videosValue) {
                                const videosObject = JSON.parse(videosValue[1]);
                                // console.log(videosObject);

                                // Obtén el código del servidor "ws"
                                const servidorWS = videosObject.SUB.find(servidor => servidor.server === 'sw');
                                if (servidorWS) {
                                    const codigoWS = servidorWS.code;
                                    //console.log('Código del servidor "ws":', codigoWS);
                                    const partesURL = codigoWS.split('/');
                                    const codigo = partesURL[partesURL.length - 1];
                                    //   console.log(codigo);
                                    // URL a la que deseas realizar la solicitud GET
                                    const urlSw = `https://api.streamwish.com/api/file/direct_link?key=3361uslim3ux23z5bavt&file_code=${codigo}`;
                                    //  console.log(urlSw)


                                    servidores.push({
                                        nombreServidor: 'Júpiter',  // Nombre del servidor
                                        urlServidor: codigoWS,

                                    })
                                    const nuvo_cap = new capiSchema({
                                        anime: anime_id,
                                        imagenUrl: null,
                                        numero: capiNumerSplit[1],
                                        nombre: data.capitulo,
                                        urlAnimeFlv: data.urlPlay,
                                        servidores: servidores
                                    })
                                    // Guardar el nuevo capítulo en la base de datos
                                    nuvo_cap.save()
                                        .then(async (capituloGuardado) => {
                                            // console.log(`${episodio} guardado con exito ${data.title}`);
                                            const anime = new Anime({
                                                title: data.title,
                                                urlImg: data.urlImg,
                                                urlPlay: data.urlPlay,
                                                capitulo: data.capitulo,
                                                code: resultado._id,
                                            });

                                            try {
                                                await anime.save();

                                                const dataPar = data.urlImg.split('/');
                                                const codecons = dataPar[dataPar.length - 1];
                                                const rutaGuardar = `server/pic/${codecons}`;
                                                //   console.log("Notificación enviada exitosamente:",);
                                                enviarMensajeDM(`Salio el capitulo ${capiNumerSplit} de ${data.title}`, data.urlImg, rutaGuardar)

                                            } catch (error) {
                                                console.error("Error al guardar anime o enviar notificación:", error);
                                            }


                                        })
                                        .catch(error => {
                                            console.error("Error al guardar el capítulo:", error);
                                        });


                                } else {
                                    console.log('No se encontró el servidor "ws" en la lista.');
                                }

                                // Obtén el código del servidor "stape"
                                const servidorStape = videosObject.SUB.find(servidor => servidor.server === 'stape');


                            } else {
                                console.log('No se encontró la variable "videos" en el script.');
                            }




                        } catch (error) {
                            console.error(error)
                        }

                    } else {
                        try {
                            try {

                                //console.log('\x1b[36m%s\x1b[0m', urlref, 'no existe'); // Cian
                                const response3 = await axios.get(urlref);
                                const $3 = cheerio.load(response3.data);

                                //<h1 class="Title">
                                const titulo = $3('h1.Title').text();
                                const elemetTxtAlt = $3('span.TxtAlt');
                                const nombresAlternos = [];
                                elemetTxtAlt.each((index, element) => {
                                    nombresAlternos.push($3(element).text());
                                });

                                const tipo = $3('div.Ficha.fchlt').find("div.Container").find('span').eq(0).text();
                                //console.log('titulo', tipo);

                                const status = $3('span.fa-tv').text();
                                //    console.log('stado: ', status);
                                let prox_epi = '';
                                let id_anime = '';


                                // Encuentra los scripts dentro de la página
                                const scripts = $3('script');

                                // Encuentra el script que contiene las variables anime_info y episodes
                                let targetScript = null;
                                scripts.each((index, script) => {
                                    const scriptContent = $3(script).html();
                                    if (scriptContent && scriptContent.includes('var anime_info') && scriptContent.includes('var episodes')) {
                                        targetScript = scriptContent;
                                        return false; // Termina la iteración
                                    }
                                });
                                let episodios_list = [];

                                if (targetScript) {
                                    const sanitizedScript = targetScript.replace(/\$\(document\)\.ready\(function\(\)\s*{([\s\S]*?)}\s*\);?/, '');
                                    // console.log(sanitizedScript)

                                    eval(sanitizedScript); // Ejecuta el script modificado

                                    // Ahora puedes acceder a las variables anime_info y episodes
                                    episodios_list = episodes.map(subarray => subarray[0]);
                                    if (status == 'En emision') {
                                        prox_epi = anime_info[anime_info.length - 1];


                                    }
                                    id_anime = anime_info[0];
                                    //  console.log(prox_epi);
                                    /*
                                    console.log('Valor de anime_info:', anime_info);
                                    console.log('Valor de episodes:', anime_info[anime_info.length - 1]);
                                    */
                                } else {
                                    console.log('No se encontró el script con anime_info y episodes en la página.');
                                }

                                const generos = [];
                                const imageElement = $3('nav.Nvgnrs a');
                                const elementNvgnrs = $3('div.Image figure img');
                                const urlImg = 'https://www3.animeflv.net' + elementNvgnrs.attr('src');
                                imageElement.each((index, element) => {
                                    var genero = $3(element).attr('href');
                                    generos.push(genero.replace('/browse?genre=', ''));
                                });
                                const emision = status == 'En emision' ? true : false;
                                const descripcion = $3('div.Description').text();
                                // console.log(emision);

                                //  console.log(id_anime, emision);

                                const nuevo_user = new animeSchema({
                                    nombre: titulo,
                                    nombresAlternos: nombresAlternos,
                                    generos: generos,
                                    descripcion: descripcion,
                                    codigoAnimeflv: id_anime,
                                    codigoJkanime: '',
                                    imgUrl: urlImg,
                                    emision: emision,
                                    episodios: episodios_list,
                                    fechaDesiguienteCap: prox_epi,
                                    tipo: tipo,
                                    urlAnimeFlv: urlref,
                                    urlJkanime: '',
                                });

                                try {
                                    const resultado = await nuevo_user.save();
                                    if (resultado) {
                                        const episodio = capiNumerSplit[1];
                                        const anime_id = resultado._id;
                                        const servidores = [];

                                        try {


                                            const response = await axios.get(data.urlPlay);
                                            const $ = cheerio.load(response.data);
                                            var imagenUrl = '';
                                            // Buscar el script
                                            const script = $('script[type="text/javascript"]').text();

                                            // Extraer el valor de la variable "videos"
                                            const videosValue = script.match(/var videos = (.*?);/);

                                            if (videosValue) {
                                                const videosObject = JSON.parse(videosValue[1]);
                                                // console.log(videosObject);

                                                // Obtén el código del servidor "ws"
                                                const servidorWS = videosObject.SUB.find(servidor => servidor.server === 'sw');
                                                if (servidorWS) {
                                                    const codigoWS = servidorWS.code;
                                                    //console.log('Código del servidor "ws":', codigoWS);
                                                    const partesURL = codigoWS.split('/');
                                                    const codigo = partesURL[partesURL.length - 1];
                                                    //   console.log(codigo);
                                                    // URL a la que deseas realizar la solicitud GET
                                                    const urlSw = `https://api.streamwish.com/api/file/direct_link?key=3361uslim3ux23z5bavt&file_code=${codigo}`;
                                                    //  console.log(urlSw)


                                                    servidores.push({
                                                        nombreServidor: 'Júpiter',  // Nombre del servidor
                                                        urlServidor: codigoWS,

                                                    })
                                                    const nuvo_cap = new capiSchema({
                                                        anime: anime_id,
                                                        imagenUrl: null,
                                                        numero: capiNumerSplit[1],
                                                        nombre: data.capitulo,
                                                        urlAnimeFlv: data.urlPlay,
                                                        servidores: servidores
                                                    })
                                                    // Guardar el nuevo capítulo en la base de datos
                                                    nuvo_cap.save()
                                                        .then(async (capituloGuardado) => {
                                                            //     console.log(`${episodio} guardado con exito ${data.title}`);
                                                            const anime = new Anime({
                                                                title: data.title,
                                                                urlImg: data.urlImg,
                                                                urlPlay: data.urlPlay,
                                                                capitulo: data.capitulo,
                                                                code: anime_id,
                                                            });

                                                            try {
                                                                await anime.save();


                                                                console.log("Notificación enviada exitosamente:",);
                                                                const dataPar = data.urlImg.split('/');
                                                                const codecons = dataPar[dataPar.length - 1];
                                                                const rutaGuardar = `server/pic/${codecons}`;
                                                                //   console.log("Notificación enviada exitosamente:",);
                                                                enviarMensajeDM(`Salio el capitulo ${capiNumerSplit} de ${data.title}`, data.urlImg, rutaGuardar)


                                                            } catch (error) {
                                                                console.error("Error al guardar anime o enviar notificación:", error);
                                                            }


                                                        })
                                                        .catch(error => {
                                                            console.error("Error al guardar el capítulo:", error);
                                                        });


                                                } else {
                                                    console.log('No se encontró el servidor "ws" en la lista.');
                                                }

                                                // Obtén el código del servidor "stape"
                                                const servidorStape = videosObject.SUB.find(servidor => servidor.server === 'stape');


                                            } else {
                                                console.log('No se encontró la variable "videos" en el script.');
                                            }




                                        } catch (error) {
                                            console.error(error)
                                        }

                                    }


                                } catch (error) {
                                    console.error('Error al guardar los datos:', error);
                                }

                            } catch (error) {
                                console.error({ name: data.title, url: urlref }, error);
                            }
                        } catch (error) {

                            console.error(error)
                        }
                    }

                } catch (error) {
                    console.error(error)
                }


            } else {
                var urlref = data.urlPlay.replace('/ver/', '/anime/')
                const lastIndex = urlref.lastIndexOf('-');

                if (lastIndex !== -1) {
                    // Si se encuentra un guion, elimina todo lo que viene después de él
                    urlref = urlref.slice(0, lastIndex);
                    //  console.log(urlref);
                } else {
                    // Si no se encuentra un guion, la URL permanece sin cambios
                    //  console.log(urlref);
                }
                const resultado = await animeSchema.findOne({ urlAnimeFlv: urlref });
                //  console.log(resultado);
                try {
                    if (resultado) {
                        const episodio = capiNumerSplit[1];
                        const anime_id = resultado._id;
                        const servidores = [];

                        try {


                            const response = await axios.get(data.urlPlay);
                            const $ = cheerio.load(response.data);
                            var imagenUrl = '';
                            // Buscar el script
                            const script = $('script[type="text/javascript"]').text();

                            // Extraer el valor de la variable "videos"
                            const videosValue = script.match(/var videos = (.*?);/);

                            if (videosValue) {
                                const videosObject = JSON.parse(videosValue[1]);
                                // console.log(videosObject);

                                // Obtén el código del servidor "ws"
                                const servidorWS = videosObject.SUB.find(servidor => servidor.server === 'sw');
                                if (servidorWS) {
                                    const codigoWS = servidorWS.code;
                                    //console.log('Código del servidor "ws":', codigoWS);
                                    const partesURL = codigoWS.split('/');
                                    const codigo = partesURL[partesURL.length - 1];
                                    //   console.log(codigo);
                                    // URL a la que deseas realizar la solicitud GET
                                    const urlSw = `https://api.streamwish.com/api/file/direct_link?key=3361uslim3ux23z5bavt&file_code=${codigo}`;
                                    //  console.log(urlSw)


                                    servidores.push({
                                        nombreServidor: 'Júpiter',  // Nombre del servidor
                                        urlServidor: codigoWS,

                                    })
                                    const nuvo_cap = new capiSchema({
                                        anime: anime_id,
                                        imagenUrl: null,
                                        numero: capiNumerSplit[1],
                                        nombre: data.capitulo,
                                        urlAnimeFlv: data.urlPlay,
                                        servidores: servidores
                                    })
                                    // Guardar el nuevo capítulo en la base de datos
                                    nuvo_cap.save()
                                        .then(async (capituloGuardado) => {
                                            // console.log(`${episodio} guardado con exito ${data.title}`);
                                            const anime = new Anime({
                                                title: data.title,
                                                urlImg: data.urlImg,
                                                urlPlay: data.urlPlay,
                                                capitulo: data.capitulo,
                                                code: anime_id,
                                            });

                                            try {
                                                await anime.save();

                                                if (!resultado.episodios.includes(capiNumerSplit[1])) {
                                                    var capiList = [capiNumerSplit[1], ...resultado.episodios]
                                                    resultado.episodios = capiList;
                                                    try {
                                                        await resultado.save();
                                                    } catch (error) {
                                                        console.log(error);
                                                    }
                                                }
                                                //   console.log("Notificación enviada exitosamente:",);
                                                const dataPar = data.urlImg.split('/');
                                                const codecons = dataPar[dataPar.length - 1];
                                                const rutaGuardar = `server/pic/${codecons}`;
                                                //   console.log("Notificación enviada exitosamente:",);
                                                enviarMensajeDM(`Salio el capitulo ${capiNumerSplit} de ${data.title}`, data.urlImg, rutaGuardar)


                                            } catch (error) {
                                                console.error("Error al guardar anime o enviar notificación:", error);
                                            }


                                        })
                                        .catch(error => {
                                            console.error("Error al guardar el capítulo:", error);
                                        });


                                } else {
                                    console.log('No se encontró el servidor "ws" en la lista.');
                                }

                                // Obtén el código del servidor "stape"
                                const servidorStape = videosObject.SUB.find(servidor => servidor.server === 'stape');


                            } else {
                                console.log('No se encontró la variable "videos" en el script.');
                            }




                        } catch (error) {
                            console.error(error)
                        }

                    } else {
                        console.log('no hay resultado de ', urlref)
                    }

                } catch (error) {
                    console.error(error)
                }
            }

        }

        const numRecords = await Anime.countDocuments();
        if (numRecords > 40) {
            try {
                const oldestAnimes = await Anime.find({}, '_id').sort({ _id: 1 }).limit(numRecords - 20);
                const idsToDelete = oldestAnimes.map(anime => anime._id);
                await Anime.deleteMany({ _id: { $in: idsToDelete } });
            } catch (error) {
                console.error("Error al eliminar animes antiguos:", error);
            }
        }
    }
}

function enviarMensajeDM(msj, url, imageUrl) {
    descargarYGuardarImagenSiNoExiste(url, imageUrl)
        .then(() => {
            const urlpar = imageUrl.split('/');
            const code = urlpar[urlpar.length - 1];
            const imagePath = path.join(__dirname, 'server', 'pic', code);
            const full = './' + imageUrl;
            const id_chnnel = '1162239654041485385';
            const channel = client.channels.cache.get(id_chnnel);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor('#0099ff') // Color del embed
                    .setTitle('Nuevo capitulo') // Título del embed
                    .setDescription(msj).setThumbnail(`attachment://anime.jpg`);
                console.log(code);
                // Agregar una imagen al embed

                // Enviar el embed al canal
                channel.send({
                    embeds: [embed], files: [
                        {
                            attachment: `./server/pic/${code}`,
                            name: `anime.jpg`
                        }
                    ]
                })
                    .then(() => console.log('Embed enviado con éxito'))
                    .catch(error => console.error(`Error al enviar el embed: ${error.message}`));
            } else {
                console.error("no se q pasa XD");
            }
        })
        .catch(error => console.error('Error:', error));

    /*const id_chnnel = '1162239654041485385';
    const channel = client.channels.cache.get(id_chnnel);
    if (channel) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff') // Color del embed
            .setTitle('Nuevo capitulo') // Título del embed
            .setDescription(msj).setThumbnail(imageUrl);
        console.log(imageUrl);
        // Agregar una imagen al embed

        // Enviar el embed al canal
        channel.send({ embeds: [embed] })
            .then(() => console.log('Embed enviado con éxito'))
            .catch(error => console.error(`Error al enviar el embed: ${error.message}`));
    } else {
        console.error("no se q pasa XD");
    }*/

}
async function descargarYGuardarImagenSiNoExiste(url, rutaGuardar) {
    if (!imagenExiste(rutaGuardar)) {
        const respuesta = await axios({
            method: 'GET',
            url: url,
            responseType: 'stream',
        });

        respuesta.data.pipe(fs.createWriteStream(rutaGuardar));

        return new Promise((resolve, reject) => {
            respuesta.data.on('end', () => resolve());
            respuesta.data.on('error', (error) => reject(error));
        });
    } else {
        console.log('La imagen ya existe. No es necesario descargarla nuevamente.');
        return Promise.resolve();
    }
}
// Función para verificar si la imagen ya existe
function imagenExiste(ruta) {
    return fs.existsSync(ruta);
}

// Ejemplo de cómo usar la función
// Reemplaza 'ID_DEL_USUARIO' con el ID real del usuario al que deseas enviar el DM
//mi ID: 959167242401091644
// Pon tu token aquí
//canal animes nuevs: 1162239654041485385


//datos bot
//aplication id: 1162172945259569266
//publick key 4f512a496c88235d1d4e4910ec8669a7897d1459f154bd7f2beb4a16bebcb9eb
//client id: 1162172945259569266
//url https://discord.com/api/oauth2/authorize?client_id=1162172945259569266&permissions=8&scope=bot
//token: MTE2MjE3Mjk0NTI1OTU2OTI2Ng.G5GHNI.Tfe9S8g7NoEA0WdvvpHgHzcfo_2Jauf0Bxedkk



// ...
