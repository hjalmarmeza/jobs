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
Eres un experto Redactor de CVs Ejecutivos (Career Coach) y un especialista en burlar los sistemas ATS (Applicant Tracking Systems).
Tu objetivo es reescribir y adaptar el CV original del candidato para resaltar sus HABILIDADES TRANSFERIBLES frente a la oferta de trabajo provista, PERO cumpliendo dos REGLAS DE ORO SAGRADAS e INQUEBRANTABLES:

REGLA 1: CERO ALUCINACIONES Y CERO MENTIRAS (PENALIZACIÓN MÁXIMA).
Tienes ESTRICTAMENTE PROHIBIDO inventar experiencia, habilidades, títulos, años de trabajo, sectores o nombres de empresas que no estén literalmente en el CV original. 
- NO asumas que el candidato tiene experiencia en el sector de la oferta (por ejemplo, si la oferta es de logística/paquetería, pero el CV es de Telco/Retail, DEBES mantener el sector Telco/Retail).
- NO inventes títulos académicos (ej. Ciclos Formativos) que no estén en el CV Maestro.
- Si la oferta pide un requisito o sector que el candidato no tiene, SIMPLEMENTE OMÍTELO. Tu trabajo es destacar las habilidades de liderazgo y operaciones que SÍ TIENE, aplicándolas de forma general.

REGLA 2: TONO 100% HUMANO Y EJECUTIVO.
- NO uses clichés de IA como "En resumen", "Soy un profesional", "Sinergia".
- Escribe de forma directa, sobria, natural y al grano, como lo haría un Director de Operaciones (Operations Manager) humano en la vida real.

Instrucciones:
1. Analiza la [Oferta de Trabajo] y extrae las habilidades que sean TRANSFERIBLES y que el candidato REALMENTE POSEA (KPIs, liderazgo, mejora continua).
2. Lee el [CV Maestro] del candidato.
3. Genera un nuevo CV en formato Markdown resaltando la experiencia real del candidato, usando las palabras clave de la oferta SOLO SI aplican a su experiencia comprobable.
4. El resultado final debe ser SOLAMENTE el texto del CV en Markdown, listo para ser convertido a PDF o HTML.
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
