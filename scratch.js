const axios = require('axios');
const cheerio = require('cheerio');

async function testSingleJob() {
    try {
        const url = 'https://www.bruntworkcareers.co/jobs/43325382012';
        const res = await axios.get(url);
        const $ = cheerio.load(res.data);
        const title = $('h1').text().trim() || $('title').text();
        
        // Buscar el contenedor de la descripción
        let description = '';
        // Heurística simple: buscar un div con mucha clase de texto o simplemente el texto de main
        $('div').each((i, el) => {
             const text = $(el).text();
             if (text.includes('Responsibilities') || text.includes('Requirements')) {
                 if (text.length > description.length && text.length < 10000) {
                     description = text;
                 }
             }
        });
        
        // Si no funciona, tomamos el main
        if (!description) description = $('main').text();
        
        // Limpiamos un poco
        description = description.replace(/\s+/g, ' ').trim().substring(0, 500);
        
        console.log({ title, description });
    } catch(e) {
        console.error(e.message);
    }
}
testSingleJob();
