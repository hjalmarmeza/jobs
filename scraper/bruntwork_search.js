const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Extrae las ofertas más recientes de BruntWork Careers y simula la estructura de JSearch.
 * @returns {Array} Array de objetos de trabajo compatibles con el autómata.
 */
async function searchBruntworkJobs() {
    console.log("🔍 Buscando en BruntWork Careers...");
    const jobsList = [];
    try {
        const res = await axios.get('https://www.bruntworkcareers.co/search', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(res.data);
        
        // Recolectar enlaces y títulos de la página de búsqueda
        const links = [];
        $('a[href^="/jobs/"]').each((i, el) => {
            const href = $(el).attr('href');
            const title = $(el).find('p').first().text().trim();
            if (title && !links.some(l => l.href === href)) {
                links.push({ href: `https://www.bruntworkcareers.co${href}`, title });
            }
        });

        console.log(`Extraídos ${links.length} enlaces crudos de BruntWork.`);

        // Limitar a los 15 más recientes para no sobrecargar el sitio
        const topLinks = links.slice(0, 15);

        for (const linkObj of topLinks) {
            try {
                const jobRes = await axios.get(linkObj.href, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                    }
                });
                const job$ = cheerio.load(jobRes.data);
                
                // Extraer el texto principal de la página como descripción
                let description = job$('main').text() || job$('body').text();
                // Limpiar espaciados múltiples para que el prompt de IA no sufra
                description = description.replace(/\s+/g, ' ').trim();

                // Extraer el ID del trabajo desde la URL
                const jobIdMatch = linkObj.href.match(/\/jobs\/(\d+)/);
                const jobId = jobIdMatch ? jobIdMatch[1] : `bw-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                // Formatear al estilo JSearch
                const formattedJob = {
                    job_id: jobId,
                    employer_name: "BruntWork", // Siempre es BruntWork
                    job_title: linkObj.title,
                    job_posted_at_datetime_utc: new Date().toISOString(), // Asumimos que son recientes
                    job_description: description,
                    job_city: "Remoto",
                    job_country: "Global",
                    job_is_remote: true,
                    job_apply_link: linkObj.href
                };

                jobsList.push(formattedJob);
                
                // Pequeña pausa para no ser bloqueados
                await new Promise(r => setTimeout(r, 1000));
            } catch (err) {
                console.log(`⚠️ Error al raspar oferta individual de Bruntwork (${linkObj.href}): ${err.message}`);
            }
        }

    } catch (error) {
        console.error("❌ Error conectando a BruntWork:", error.message);
    }
    
    return jobsList;
}

module.exports = { searchBruntworkJobs };
