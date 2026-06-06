const fs = require('fs');
const path = require('path');
const { searchJobs } = require('./scraper/job_search');
const { adaptCV } = require('./scraper/cv_adapter');
const { sendAlert } = require('./scraper/notifier');

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

    // Buscamos roles exclusivamente directivos/gerenciales para evitar puestos técnicos
    const queryStr = 'Director de Operaciones OR Operations Manager OR Customer Success';

    for (const location of LOCATIONS) {
        console.log(`🔍 Buscando en: ${location}...`);
        const jobs = await searchJobs(queryStr, location);
        console.log(`Encontrados ${jobs.length} trabajos crudos en la API.`);
        
        for (const job of jobs) {
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
                "operations manager", "director", "head of", "customer success",
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
                console.log(`🧠 Adaptando CV para la oferta...`);
                const adaptedCV = await adaptCV(job.job_description, masterCV);

                console.log(`✉️ Enviando alerta premium...`);
                await sendAlert(job, adaptedCV);

                seenJobs.push(job.job_id);
                if (!seenJobs.includes(compositeKey)) {
                    seenJobs.push(compositeKey);
                }
                newJobsFound++;
            } catch (error) {
                console.error(`❌ Error procesando la oferta ${job.job_title}:`, error.message);
            }

            await new Promise(r => setTimeout(r, 2000));
        }
    }

    saveSeenJobs(seenJobs);
    console.log(`🏁 Búsqueda terminada. Ofertas nuevas procesadas: ${newJobsFound}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runJobHunter().catch(console.error);
}

module.exports = { runJobHunter };
