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
 * Envía un correo con la oferta encontrada y el análisis de la IA
 * @param {Object} job La oferta de trabajo (título, link, etc)
 * @param {string} jobAnalysis El texto del análisis de match de la IA
 */
async function sendAlert(job, jobAnalysis) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_DESTINATION, // Tu correo donde recibirás la alerta
        subject: `🚨 Nuevo Match [>90%]: ${job.job_title} en ${job.employer_name}`,
        html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <!-- Header -->
            <div style="background-color: #0f172a; color: #ffffff; padding: 30px; text-align: center;">
                <h1 style="margin: 0; font-size: 24px; font-weight: 300; letter-spacing: 1px;">OPORTUNIDAD EJECUTIVA</h1>
                <p style="margin: 10px 0 0 0; font-size: 14px; color: #94a3b8; text-transform: uppercase; letter-spacing: 2px;">JobSeeker AI Match >90%</p>
            </div>
            
            <!-- Body -->
            <div style="padding: 40px 30px;">
                <h2 style="margin: 0 0 15px 0; font-size: 22px; color: #1e293b;">${job.job_title}</h2>
                
                <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px 20px; margin-bottom: 30px;">
                    <p style="margin: 0 0 8px 0; color: #475569; font-size: 15px;"><strong>Empresa:</strong> ${job.employer_name}</p>
                    <p style="margin: 0 0 8px 0; color: #475569; font-size: 15px;"><strong>Ubicación:</strong> ${job.job_city || ''}, ${job.job_country || ''}</p>
                    <p style="margin: 0; color: #475569; font-size: 15px;"><strong>Modalidad:</strong> ${job.job_is_remote ? 'Remoto' : 'Presencial/Híbrido'}</p>
                </div>

                <div style="text-align: center; margin-bottom: 40px;">
                    <a href="${job.job_apply_link}" style="display: inline-block; background-color: #0f172a; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; letter-spacing: 0.5px; transition: background-color 0.3s;">APLICAR AHORA</a>
                </div>

                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 30px;">
                
                <h3 style="margin: 0 0 15px 0; font-size: 16px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px;">Análisis de Inteligencia Artificial</h3>
                <p style="margin: 0 0 20px 0; font-size: 14px; color: #64748b;">Tu reclutador digital ha evaluado esta vacante contra tu perfil ejecutivo:</p>
                
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; color: #1e293b; padding: 25px; border-radius: 8px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">
${jobAnalysis.replace(/```markdown/gi, '').replace(/```/g, '').replace(/\*\*/g, '').replace(/^#+\s/gm, '')}
                </div>
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
        console.log(`✅ Alerta enviada para el puesto: ${job.job_title}`);
    } catch (error) {
        console.error("❌ Error enviando el correo:", error);
    }
}

module.exports = { sendAlert };
