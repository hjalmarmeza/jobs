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
    "Salamanca, Spain", // Restringido solo a la localidad (nada de toda Castilla y León para evitar viajes > 10 mins)
    "Remote Spain",
    "Madrid, Spain" // TEMPORAL: Para forzar una prueba exitosa y demostrar que el correo funciona
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

    // Buscamos iterando sobre los queries y locaciones
    // (En producción real, se pueden unificar o espaciar para no golpear el rate limit)
    // Para simplificar, tomaremos un query representativo combinado o iteraremos.
    
    // Unificamos queries para JSearch de forma más amplia.
    const queryStr = 'Operations Manager OR Director de Operaciones OR Area Manager';

    for (const location of LOCATIONS) {
        console.log(`🔍 Buscando en: ${location}...`);
        const jobs = await searchJobs(queryStr, location);
        
        for (const job of jobs) {
            // Generar una llave compuesta para evitar duplicados multi-plataforma (ej. misma oferta en LinkedIn e InfoJobs)
            const employerNorm = (job.employer_name || "unknown").toLowerCase().trim();
            const titleNorm = (job.job_title || "unknown").toLowerCase().trim();
            const compositeKey = `${employerNorm}_${titleNorm}`;

            // Evitar duplicados (Garantía absoluta, ya sea por ID o por Empresa+Título)
            if (seenJobs.includes(job.job_id) || seenJobs.includes(compositeKey)) {
                continue;
            }

            // Filtro de Antigüedad (Máximo 10 días)
            const jobPostedAt = new Date(job.job_posted_at_datetime_utc || job.job_posted_at_timestamp * 1000 || Date.now());
            const daysOld = (Date.now() - jobPostedAt.getTime()) / (1000 * 3600 * 24);
            if (daysOld > 10) {
                console.log(`⏩ Saltando oferta (Demasiado antigua: ${Math.round(daysOld)} días).`);
                seenJobs.push(job.job_id);
                if (!seenJobs.includes(compositeKey)) seenJobs.push(compositeKey);
                continue;
            }

            console.log(`✨ Nueva oferta encontrada: ${job.job_title} en ${job.employer_name}`);
            
            // ESCUDO DE COSTOS (Pre-filtro)
            // Solo usamos la IA si la descripción menciona responsabilidad de alto nivel
            const jobDescription = (job.job_description || "").toLowerCase();
            const relevantKeywords = [
                "operations manager", "head of operations", "service delivery", "customer success",
                "operational excellence", "digital transformation", "kpi", "sla", "mejora continua",
                "process improvement", "director de operaciones", "bpo", "saas", "telecomunicaciones"
            ];
            const isRelevant = relevantKeywords.some(kw => jobDescription.includes(kw)) || relevantKeywords.some(kw => job.job_title.toLowerCase().includes(kw));

            if (!isRelevant) {
                console.log(`⏩ Saltando oferta (no superó el pre-filtro de relevancia, ahorrando tokens de IA).`);
                seenJobs.push(job.job_id); 
                if (!seenJobs.includes(compositeKey)) seenJobs.push(compositeKey);
                continue;
            }

            try {
                // Adaptar CV (Aquí sí gastamos tokens porque vale la pena)
                console.log(`🧠 Adaptando CV para la oferta...`);
                const adaptedCV = await adaptCV(job.job_description, masterCV);

                // Enviar Alerta
                console.log(`✉️ Enviando alerta premium...`);
                await sendAlert(job, adaptedCV);

                // Marcar como visto usando ambos identificadores
                seenJobs.push(job.job_id);
                if (!seenJobs.includes(compositeKey)) {
                    seenJobs.push(compositeKey);
                }
                newJobsFound++;

                // LÍMITE DE PRUEBA CONTROLADA: Romper el ciclo al encontrar 1 oferta para ahorrar cuota
                console.log(`🛑 Prueba controlada: Se encontró 1 oferta exitosamente. Deteniendo el autómata para ahorrar cuota.`);
                break;
            } catch (error) {
                console.error(`❌ Error procesando la oferta ${job.job_title}:`, error.message);
                // No lo marcamos como visto, para que lo intente de nuevo en la siguiente ejecución
            }

            // Pequeña pausa para no saturar APIs
            await new Promise(r => setTimeout(r, 2000));
        }

        // Romper también el ciclo de locaciones si ya encontramos 1 en la prueba
        if (newJobsFound >= 1) break;
    }

    saveSeenJobs(seenJobs);
    console.log(`🏁 Búsqueda terminada. Ofertas nuevas procesadas: ${newJobsFound}`);
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runJobHunter().catch(console.error);
}

module.exports = { runJobHunter };
