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
Tu objetivo es reescribir y adaptar el CV original del candidato para que haga un "match" superior al 90% con la oferta de trabajo provista, PERO cumpliendo dos REGLAS DE ORO SAGRADAS:

REGLA 1: CERO ALUCINACIONES Y CERO MENTIRAS. 
Tienes ESTRICTAMENTE PROHIBIDO inventar experiencia, habilidades, títulos, años de trabajo o nombres de empresas que no estén en el CV original. Solo puedes reordenar, reescribir y enfatizar lo que ya existe. Si la oferta pide algo que el candidato no tiene, IGNÓRALO.

REGLA 2: TONO 100% HUMANO Y EJECUTIVO.
Tienes ESTRICTAMENTE PROHIBIDO sonar como un robot o una Inteligencia Artificial. 
- NO uses clichés de IA como "En resumen", "Soy un profesional apasionado", "Impulsado por resultados", "Sinergia", o palabras rebuscadas.
- Escribe de forma directa, sobria, natural y al grano, como lo haría un Director de Operaciones (Operations Manager) humano en la vida real.
- Usa voz activa.

Instrucciones:
1. Analiza la [Oferta de Trabajo] y extrae las palabras clave (KPIs, Customer Success, SLA, etc.).
2. Lee el [CV Maestro] del candidato.
3. Genera un nuevo CV en formato Markdown donde el perfil, los logros y las habilidades usen las palabras clave exactas de la oferta (si aplican a la experiencia real del candidato).
4. El resultado final debe ser SOLAMENTE el texto del CV en Markdown, listo para ser convertido a PDF o HTML. No añadas introducciones como "Aquí está tu CV" ni conclusiones.
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
