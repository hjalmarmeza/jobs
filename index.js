const fs = require('fs');
const path = require('path');
const { searchJobs } = require('./scraper/job_search');
const { searchBruntworkJobs } = require('./scraper/bruntwork_search');
const { analyzeJob } = require('./scraper/job_analyzer');
const { sendDailyDigest } = require('./scraper/notifier');

// Rutas de archivos de datos
const SEEN_JOBS_FILE = path.join(__dirname, 'data', 'seen_jobs.json');
const MASTER_CV_FILE = path.join(__dirname, 'data', 'master_cv.md');

// Prompts y ubicaciones (Configurables)
const SEARCH_QUERIES = [
    "Operations Manager", 
    "Business Operations Manager", 
    "Head of Operations", 
    "Service Delivery Manager", 
    "Customer Experience Manager", 
    "Customer Success Manager", 
    "Operational Excellence Manager", 
    "Digital Transformation Manager", 
    "Process Improvement Manager", 
    "Responsable de Operaciones", 
    "Jefe de Operaciones", 
    "Responsable de Atención al Cliente"
];

const LOCATIONS = [
    "Salamanca, España", 
    "Remoto España"
];

// Función para cargar los trabajos ya vistos
function loadSeenJobs() {
    if (fs.existsSync(SEEN_JOBS_FILE)) {
        return JSON.parse(fs.readFileSync(SEEN_JOBS_FILE, 'utf8'));
    }
    return [];
}

// Función para guardar los trabajos vistos
function saveSeenJobs(jobs) {
    fs.writeFileSync(SEEN_JOBS_FILE, JSON.stringify(jobs, null, 2));
}

// Función para cargar el CV Maestro
function loadMasterCV() {
    if (fs.existsSync(MASTER_CV_FILE)) {
        return fs.readFileSync(MASTER_CV_FILE, 'utf8');
    }
    throw new Error("Master CV no encontrado en data/master_cv.md");
}

async function runJobHunter() {
    console.log("🚀 Iniciando JobSeeker AI...");
    
    const seenJobs = loadSeenJobs();
    const masterCV = loadMasterCV();
    let newJobsFound = 0;
    
    // Aquí guardaremos todas las ofertas válidas junto con su análisis individual
    let dailyDigestJobs = [];

    // Buscamos con términos más amplios en la API para no perder sinónimos
    const queryStr = 'Operaciones OR Operations OR Customer Success';

    // Recopilar todos los trabajos en un solo array
    let allRawJobs = [];

    for (const location of LOCATIONS) {
        console.log(`🔍 Buscando en: ${location}...`);
        const jobs = await searchJobs(queryStr, location);
        console.log(`Encontrados ${jobs.length} trabajos crudos en la API para ${location}.`);
        allRawJobs = allRawJobs.concat(jobs);
    }

    // Agregar BruntWork
    const bwJobs = await searchBruntworkJobs();
    console.log(`Encontrados ${bwJobs.length} trabajos crudos en BruntWork.`);
    allRawJobs = allRawJobs.concat(bwJobs);
        
    for (const job of allRawJobs) {
            const employerNorm = (job.employer_name || "unknown").toLowerCase().trim();
            const titleNorm = (job.job_title || "unknown").toLowerCase().trim();
            const compositeKey = `${employerNorm}_${titleNorm}`;

            if (seenJobs.includes(job.job_id) || seenJobs.includes(compositeKey)) {
                continue;
            }

            const jobPostedAt = new Date(job.job_posted_at_datetime_utc || job.job_posted_at_timestamp * 1000 || Date.now());
            const daysOld = (Date.now() - jobPostedAt.getTime()) / (1000 * 3600 * 24);
            if (daysOld > 10) {
                console.log(`⏩ Saltando oferta (Demasiado antigua: ${Math.round(daysOld)} días).`);
                seenJobs.push(job.job_id);
                if (!seenJobs.includes(compositeKey)) seenJobs.push(compositeKey);
                continue;
            }

            console.log(`✨ Nueva oferta encontrada: ${job.job_title} en ${job.employer_name}`);
            
            // ESCUDO EJECUTIVO Y DE SECTOR
            const jobDescription = (job.job_description || "").toLowerCase();
            const title = job.job_title.toLowerCase();
            
            // 1. Debe ser un rol de liderazgo o estar en los sectores clave
            const executiveKeywords = [
                "operations manager", "director", "head of", "customer success", "gerente", "jefe", "jefatura", "líder", "leader", "manager",
                "supervisor", "supervisión", "coordinador", "responsable",
                "service delivery", "digital transformation", "transformación digital",
                "saas", "retail", "telecomunicaciones", "telco", "bpo", "tecnología", "cx"
            ];
            
            // 2. Filtro estricto para IGNORAR puestos técnicos, logística pesada o almacén
            const forbiddenKeywords = [
                "técnico", "tecnico", "conductor", "almacén", "almacen", "repartidor", 
                "paquetería", "paletería", "carretillero", "operario"
            ];

            const isExecutive = executiveKeywords.some(kw => jobDescription.includes(kw) || title.includes(kw));
            const isForbidden = forbiddenKeywords.some(kw => title.includes(kw));

            if (!isExecutive || isForbidden) {
                console.log(`⏩ Saltando oferta (no superó el escudo ejecutivo o pertenece a logística básica).`);
                seenJobs.push(job.job_id); 
                if (!seenJobs.includes(compositeKey)) seenJobs.push(compositeKey);
                continue;
            }

            try {
                console.log(`🧠 Analizando match con IA...`);
                // Análisis INDIVIDUAL para este puesto específico
                const jobAnalysis = await analyzeJob(job.job_description, masterCV);

                // Extraer el porcentaje de la respuesta de la IA
                const matchRegex = jobAnalysis.match(/NIVEL DE MATCH:\s*(\d+)%/i);
                const matchPercentage = matchRegex ? parseInt(matchRegex[1], 10) : 100; // Si falla la lectura, por seguridad lo dejamos pasar

                if (matchPercentage >= 70) {
                    // Guardamos el trabajo y su análisis en la bolsa del día
                    dailyDigestJobs.push({
                        job: job,
                        analysis: jobAnalysis
                    });
                    newJobsFound++;
                    console.log(`✅ Aprobada para envío (Match: ${matchPercentage}%)`);
                } else {
                    console.log(`🗑️ Descartando oferta por bajo match: ${matchPercentage}%`);
                }

                seenJobs.push(job.job_id);
                if (!seenJobs.includes(compositeKey)) {
                    seenJobs.push(compositeKey);
                }

            } catch (error) {
                console.error(`❌ Error procesando la oferta ${job.job_title}:`, error.message);
            }

            await new Promise(r => setTimeout(r, 2000));
        }

    saveSeenJobs(seenJobs);
    console.log(`🏁 Búsqueda terminada. Ofertas nuevas procesadas: ${newJobsFound}`);

    // Si encontramos ofertas hoy, enviamos 1 SOLO correo consolidado
    if (dailyDigestJobs.length > 0) {
        console.log(`✉️ Enviando Daily Digest con ${dailyDigestJobs.length} ofertas...`);
        await sendDailyDigest(dailyDigestJobs);
    } else {
        console.log(`😴 No se encontraron ofertas relevantes hoy. No se enviará correo.`);
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runJobHunter().catch(console.error);
}

module.exports = { runJobHunter };
