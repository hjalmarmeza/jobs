const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeJob(jobDescription, masterCV) {
    const systemPrompt = `
Eres un Analista de Adquisición de Talento Ejecutivo y Headhunter Tecnológico.
Tu objetivo es analizar una vacante gerencial y compararla con el CV Maestro del candidato para decirle rápidamente si vale la pena postularse.

Tu respuesta DEBE tener este formato EXACTO en texto plano (sin markdown de bloques de código):

RESUMEN DEL PUESTO:
[Un resumen ejecutivo de máximo 3 líneas sobre el core del puesto y lo que la empresa realmente busca]

NIVEL DE MATCH: [X]%

PUNTOS A FAVOR:
- [Punto 1 conectando la experiencia real del candidato con la vacante]
- [Punto 2...]
- [Punto 3...]

POSIBLES BRECHAS:
- [Qué pide exactamente la vacante que el candidato NO tiene o no menciona explícitamente en su CV]
- [Otra brecha si existe, o "Ninguna brecha crítica detectada" si cumple todo]

REGLA 1: CERO MENTIRAS. Basa todo el análisis estrictamente en el CV Maestro proporcionado.
REGLA 2: SÉ DIRECTO. El candidato es un Director, no uses lenguaje comercial barato. Sé un analista crudo y preciso.
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
            model: "gpt-4o", 
            temperature: 0.2, 
        });

        return completion.choices[0].message.content;
    } catch (error) {
        console.error("Error al analizar la oferta:", error);
        throw error;
    }
}

module.exports = { analyzeJob };
