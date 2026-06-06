const { OpenAI } = require("openai");
require("dotenv").config();

// Configuración de OpenAI (puede ser DeepInfra cambiando el baseURL)
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    // Si usas DeepInfra, descomenta la siguiente línea y pon su URL
    // baseURL: "https://api.deepinfra.com/v1/openai",
});

async function adaptCV(jobDescription, masterCV) {
    const systemPrompt = `
Eres un experto Redactor de CVs Ejecutivos (Career Coach).
Tu objetivo es reescribir el CV original del candidato para resaltar sus HABILIDADES TRANSFERIBLES frente a la oferta, cumpliendo estas REGLAS DE ORO INQUEBRANTABLES:

REGLA 1: CERO MENTIRAS. 
Tienes ESTRICTAMENTE PROHIBIDO inventar experiencia, habilidades, títulos o sectores. Si la oferta pide un requisito que el candidato no tiene, SIMPLEMENTE OMÍTELO. Tu trabajo es destacar las habilidades que SÍ TIENE.

REGLA 2: ESTRUCTURA OBLIGATORIA (PLANTILLA EXECUTIVE PROFILE).
Debes respetar estrictamente las secciones del "Executive Profile" original del candidato. NO inventes nuevas secciones. 
Tu respuesta DEBE estructurarse exactamente así:

# HJALMAR MEZA CORTEZ
**[Ajustar el subtítulo para que resuene con la oferta, ej. Líder de Operaciones & Transformación Digital]**

## ACERCA DE MÍ
[Adaptar el perfil ejecutivo de 18 años de experiencia, enfatizando habilidades transferibles a la oferta]

## Experiencia & Legado
[Seleccionar y copiar TEXTUALMENTE (palabra por palabra) las experiencias del CV original que aplican a la oferta. NO reescribir, NO exagerar, y NO cambiar el tono profesional.]

## LOGROS CORPORATIVOS
[Copiar TEXTUALMENTE los logros del CV original sin cambiar la redacción. Solo incluir los que apliquen a la oferta. NO agregar palabras como "el mayor hito" si no están en el original.]

## COMPETENCIAS & APTITUDES (ÁREAS DE DOMINIO TÉCNICO Y OPERATIVO)
[Mantener TODAS las categorías de habilidades del CV original (Liderazgo, Transformación & IA, Operaciones, Comercial, CX, Humanas, Ecosistema Tech). Resaltar en negrita las más relevantes para la oferta, pero NO ELIMINAR NINGUNA categoría.]

## PORTAFOLIO DE INNOVACIÓN TECNOLÓGICA (DESARROLLO & IA)
[Listar SIEMPRE los proyectos de innovación del candidato (Firebase, Automatización, IA, Telemetría, etc.). Resaltar los que más conecten con la oferta para demostrar valor diferencial]

## FORMACIÓN & CERTIFICACIONES
[Mantener SIEMPRE todos los grados y certificaciones reales (Administración, IA, Azure, Liderazgo, etc.). NO INVENTAR NADA y NO OMITIR NADA]

REGLA 3: FORMATO LIMPIO.
- NO uses bloques de código markdown (\`\`\`markdown). Devuelve el texto directamente.
`;

    const userPrompt = `
[OFERTA DE TRABAJO]:
${jobDescription}

---------------------------------------
[CV MAESTRO]:
${masterCV}
`;

    try {
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "gpt-4o", // Cambiar al modelo de DeepInfra deseado si se usa DeepInfra
            temperature: 0.2, // Baja temperatura para evitar alucinaciones
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error al adaptar CV:", error);
        throw error;
    }
}

module.exports = { adaptCV };
