const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del correo (Ejemplo usando Gmail)
// Para usar Gmail, necesitas una "Contraseña de aplicación" (App Password)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

/**
 * Envía un correo resumen (Daily Digest) con todas las ofertas encontradas y analizadas
 * @param {Array} analyzedJobs Array de objetos { job, analysis }
 */
async function sendDailyDigest(analyzedJobs) {
    if (!analyzedJobs || analyzedJobs.length === 0) return;

    let jobsHtml = '';

    analyzedJobs.forEach((item, index) => {
        const job = item.job;
        const analysis = item.analysis;
        const cleanAnalysis = analysis.replace(/```markdown/gi, '').replace(/```/g, '').replace(/\*\*/g, '').replace(/^#+\s/gm, '');

        jobsHtml += `
            <div style="margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px;">
                    <h2 style="margin: 0 0 10px 0; font-size: 20px; color: #1e293b;">${job.job_title}</h2>
                    <p style="margin: 0 0 5px 0; color: #475569; font-size: 15px;"><strong>Empresa:</strong> ${job.employer_name}</p>
                    <p style="margin: 0 0 5px 0; color: #475569; font-size: 15px;"><strong>Ubicación:</strong> ${job.job_city || ''}, ${job.job_country || ''}</p>
                    <p style="margin: 0 0 15px 0; color: #475569; font-size: 15px;"><strong>Modalidad:</strong> ${job.job_is_remote ? 'Remoto' : 'Presencial/Híbrido'}</p>
                    
                    <a href="${job.job_apply_link}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 13px; transition: background-color 0.3s;">APLICAR AHORA</a>
                </div>
                
                <div style="padding: 20px; background-color: #ffffff;">
                    <h3 style="margin: 0 0 10px 0; font-size: 15px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Análisis de Headhunter AI</h3>
                    <div style="background-color: #f1f5f9; color: #1e293b; padding: 20px; border-radius: 6px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${cleanAnalysis}
                    </div>
                </div>
            </div>
        `;
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_DESTINATION,
        subject: `🚨 JobSeeker AI: ${analyzedJobs.length} Nuevas Oportunidades Ejecutivas`,
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #0f172a; color: #ffffff; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;">RESUMEN DIARIO EJECUTIVO</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">JobSeeker AI encontró ${analyzedJobs.length} ofertas hoy</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px 30px;">
                ${jobsHtml}
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b;">
                Generado automáticamente por JobSeeker AI • Antigravity
            </div>
        </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Daily Digest enviado con ${analyzedJobs.length} ofertas.`);
    } catch (error) {
        console.error("❌ Error enviando el correo:", error);
    }
}

module.exports = { sendDailyDigest };
