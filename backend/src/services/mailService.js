const sgMail = require("@sendgrid/mail");
const { logger } = require("../utils/logger");

// Configuration de SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Vérifier la clé API au démarrage
if (!process.env.SENDGRID_API_KEY) {
  logger.error(
    "Erreur: SENDGRID_API_KEY n'est pas définie dans les variables d'environnement"
  );
} else {
  logger.info("Service email SendGrid configuré et prêt");
}

/**
 * Template email - Candidat accepté
 */
const emailTemplates = {
  candidateAccepted: (
    candidateName,
    jobTitle,
    clientName,
    duration,
    startDate
  ) => ({
    subject: `🎉 Félicitations ! Votre candidature a été acceptée pour "${jobTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #4F46E5; }
            .button { display: inline-block; background-color: #4F46E5; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Bienvenue dans votre nouvelle mission !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${candidateName}</strong>,</p>
              
              <p>Excellente nouvelle ! <strong>${clientName}</strong> a accepté votre candidature pour la mission :</p>
              
              <div class="detail">
                <h3 style="margin: 0; color: #4F46E5;">${jobTitle}</h3>
                <p style="margin: 10px 0 0 0;">
                  <strong>Durée :</strong> ${duration}<br/>
                  <strong>Date de début :</strong> ${new Date(
                    startDate
                  ).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              
              <p>Connectez-vous à votre dashboard pour consulter les détails complets de la mission et commencer dès que possible.</p>
              
              <a href="${
                process.env.FRONTEND_URL
              }/dashboard" class="button">Accéder à ma mission</a>
              
              <p style="margin-top: 25px; color: #666;">
                Bonne chance ! Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
            </div>
            <div class="footer">
              <p>OnveWork - Plateforme de missions freelance</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Template email - Candidat a marqué la mission comme terminée
   */
  missionCompletedByCandidate: (
    clientName,
    candidateName,
    jobTitle,
    completionDate
  ) => ({
    subject: `📋 ${candidateName} a marqué la mission "${jobTitle}" comme terminée`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #F59E0B; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #F59E0B; }
            .button { display: inline-block; background-color: #F59E0B; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Demande de validation</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${clientName}</strong>,</p>
              
              <p><strong>${candidateName}</strong> a marqué la mission suivante comme terminée :</p>
              
              <div class="detail">
                <h3 style="margin: 0; color: #F59E0B;">${jobTitle}</h3>
                <p style="margin: 10px 0 0 0;">
                  <strong>Date d'achèvement :</strong> ${new Date(
                    completionDate
                  ).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              
              <p>Veuillez vérifier que le travail correspond à vos attentes et valider l'achèvement de la mission ou demander des modifications si nécessaire.</p>
              
              <a href="${
                process.env.FRONTEND_URL
              }/manage-applications" class="button">Valider la mission</a>
              
              <p style="margin-top: 25px; color: #666;">
                Vous avez reçu ce message car une candidature a été complétée.
              </p>
            </div>
            <div class="footer">
              <p>OnveWork - Plateforme de missions freelance</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Template email - Mission approuvée et complétée (pour le candidat)
   */
  missionApprovedCandidate: (
    candidateName,
    jobTitle,
    clientName,
    completionDate
  ) => ({
    subject: `✅ Bravo ! Votre mission "${jobTitle}" a été complétée et approuvée`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #10B981; }
            .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mission complétée et approuvée !</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${candidateName}</strong>,</p>
              
              <p><strong>${clientName}</strong> a validé l'achèvement de votre mission :</p>
              
              <div class="detail">
                <h3 style="margin: 0; color: #10B981;">${jobTitle}</h3>
                <p style="margin: 10px 0 0 0;">
                  <strong>Date de validation :</strong> ${new Date(
                    completionDate
                  ).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              
              <p>Félicitations ! Vous pouvez maintenant laisser une recommandation à votre client et consulter votre profil pour voir votre mission complétée.</p>
              
              <a href="${
                process.env.FRONTEND_URL
              }/profile" class="button">Voir mon profil</a>
              
              <p style="margin-top: 25px; color: #666;">
                Merci de votre participation ! Nous espérons travailler avec vous à nouveau bientôt.
              </p>
            </div>
            <div class="footer">
              <p>OnveWork - Plateforme de missions freelance</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  /**
   * Template email - Mission approuvée et complétée (pour le client)
   */
  missionApprovedClient: (
    clientName,
    candidateName,
    jobTitle,
    completionDate
  ) => ({
    subject: `✅ Mission "${jobTitle}" complétée et archivée`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10B981; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #10B981; }
            .button { display: inline-block; background-color: #10B981; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Mission complétée et archivée</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${clientName}</strong>,</p>
              
              <p>La mission suivante a été complétée avec succès :</p>
              
              <div class="detail">
                <h3 style="margin: 0; color: #10B981;">${jobTitle}</h3>
                <p style="margin: 10px 0 0 0;">
                  <strong>Exécuté par :</strong> ${candidateName}<br/>
                  <strong>Date d'achèvement :</strong> ${new Date(
                    completionDate
                  ).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              
              <p>Vous pouvez maintenant laisser une recommandation au candidat et consulter l'historique de votre mission.</p>
              
              <a href="${
                process.env.FRONTEND_URL
              }/job-history" class="button">Consulter l'historique</a>
              
              <p style="margin-top: 25px; color: #666;">
                Merci d'avoir utilisé OnveWork !
              </p>
            </div>
            <div class="footer">
              <p>OnveWork - Plateforme de missions freelance</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }),

  // --- NOUVEAUX TEMPLATES POUR LA PROPOSITION DE MISSION ---

  jobProposalReceived: (candidateName, clientName, jobTitle, message) => ({
    subject: `🚀 ${clientName} vous propose une mission !`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #6366f1; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .detail { margin: 15px 0; padding: 10px; background-color: white; border-left: 4px solid #6366f1; }
            .message-box { background-color: #eef2ff; padding: 15px; border-radius: 5px; font-style: italic; color: #4338ca; margin: 15px 0; }
            .button { display: inline-block; background-color: #6366f1; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><h1>🚀 Nouvelle opportunité !</h1></div>
            <div class="content">
              <p>Bonjour <strong>${candidateName}</strong>,</p>
              <p>Le recruteur <strong>${clientName}</strong> a été impressionné par votre profil et souhaite vous proposer la mission suivante :</p>
              
              <div class="detail">
                <h3 style="margin: 0; color: #6366f1;">${jobTitle}</h3>
              </div>

              ${message ? `<div class="message-box">" ${message} "</div>` : ""}

              <p>Connectez-vous pour accepter ou refuser cette offre.</p>
              
              <a href="${
                process.env.FRONTEND_URL
              }/my-applications" class="button">Voir la proposition</a>
            </div>
            <div class="footer"><p>OnveWork - Plateforme de missions freelance</p></div>
          </div>
        </body>
      </html>
    `,
  }),

  proposalResponse: (clientName, candidateName, jobTitle, decision) => ({
    subject: `Réponse de ${candidateName} pour "${jobTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: ${
              decision === "accepted" ? "#10B981" : "#EF4444"
            }; color: white; padding: 20px; border-radius: 5px 5px 0 0; text-align: center; }
            .content { background-color: #f9fafb; padding: 20px; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; background-color: #333; color: white; padding: 12px 30px; border-radius: 5px; text-decoration: none; margin-top: 15px; }
            .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${
                decision === "accepted"
                  ? "🎉 Proposition Acceptée !"
                  : "Proposition Déclinée"
              }</h1>
            </div>
            <div class="content">
              <p>Bonjour <strong>${clientName}</strong>,</p>
              <p>Le candidat <strong>${candidateName}</strong> a 
                 <strong style="color: ${
                   decision === "accepted" ? "green" : "red"
                 }">
                   ${decision === "accepted" ? "ACCEPTÉ" : "DÉCLINÉ"}
                 </strong> 
                 votre proposition pour la mission "<strong>${jobTitle}</strong>".
              </p>
              ${
                decision === "accepted"
                  ? "<p>La mission est maintenant en cours. Vous pouvez contacter le candidat pour commencer.</p>"
                  : "<p>Ne vous découragez pas, d'autres talents sont disponibles sur la plateforme.</p>"
              }
              <a href="${
                process.env.FRONTEND_URL
              }/dashboard" class="button">Accéder au Dashboard</a>
            </div>
            <div class="footer"><p>OnveWork - Plateforme de missions freelance</p></div>
          </div>
        </body>
      </html>
    `,
  }),
};

/**
 * Fonction pour envoyer un email de candidature acceptée
 */
const sendCandidateAcceptedEmail = async (
  candidateEmail,
  candidateName,
  jobTitle,
  clientName,
  duration,
  startDate
) => {
  try {
    const template = emailTemplates.candidateAccepted(
      candidateName,
      jobTitle,
      clientName,
      duration,
      startDate
    );

    const msg = {
      to: candidateEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(`Email de candidature acceptée envoyé à ${candidateEmail}`);
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de l'email candidature acceptée:",
      error
    );
    throw error;
  }
};

/**
 * Fonction pour envoyer un email quand le candidat marque la mission comme terminée
 */
const sendMissionCompletedByCandidateEmail = async (
  clientEmail,
  clientName,
  candidateName,
  jobTitle,
  completionDate
) => {
  try {
    const template = emailTemplates.missionCompletedByCandidate(
      clientName,
      candidateName,
      jobTitle,
      completionDate
    );

    const msg = {
      to: clientEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(`Email de fin de mission envoyé à ${clientEmail}`);
  } catch (error) {
    logger.error("Erreur lors de l'envoi de l'email fin de mission:", error);
    throw error;
  }
};

/**
 * Fonction pour envoyer un email quand le client approuve la fin de mission (au candidat)
 */
const sendMissionApprovedCandidateEmail = async (
  candidateEmail,
  candidateName,
  jobTitle,
  clientName,
  approvalDate
) => {
  try {
    const template = emailTemplates.missionApprovedCandidate(
      candidateName,
      jobTitle,
      clientName,
      approvalDate
    );

    const msg = {
      to: candidateEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(
      `Email de validation de mission envoyé au candidat ${candidateEmail}`
    );
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de l'email validation mission (candidat):",
      error
    );
    throw error;
  }
};

/**
 * Fonction pour envoyer un email quand le client approuve la fin de mission (au client)
 */
const sendMissionApprovedClientEmail = async (
  clientEmail,
  clientName,
  candidateName,
  jobTitle,
  approvalDate
) => {
  try {
    const template = emailTemplates.missionApprovedClient(
      clientName,
      candidateName,
      jobTitle,
      approvalDate
    );

    const msg = {
      to: clientEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(
      `Email de validation de mission envoyé au client ${clientEmail}`
    );
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de l'email validation mission (client):",
      error
    );
    throw error;
  }
};

const sendJobProposalEmail = async (
  candidateEmail,
  candidateName,
  clientName,
  jobTitle,
  message
) => {
  try {
    const template = emailTemplates.jobProposalReceived(
      candidateName,
      clientName,
      jobTitle,
      message
    );

    const msg = {
      to: candidateEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(`Email de proposition de mission envoyé à ${candidateEmail}`);
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de l'email proposition de mission:",
      error
    );
    // On ne throw pas l'erreur pour ne pas bloquer le flux métier si le mail échoue
  }
};

/**
 * Envoi de la réponse à la proposition (Candidat -> Client)
 */
const sendProposalResponseEmail = async (
  clientEmail,
  clientName,
  candidateName,
  jobTitle,
  decision
) => {
  try {
    const template = emailTemplates.proposalResponse(
      clientName,
      candidateName,
      jobTitle,
      decision
    );

    const msg = {
      to: clientEmail,
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
      subject: template.subject,
      html: template.html,
    };

    await sgMail.send(msg);
    logger.info(
      `Email de réponse à la proposition (${decision}) envoyé à ${clientEmail}`
    );
  } catch (error) {
    logger.error(
      "Erreur lors de l'envoi de l'email réponse proposition:",
      error
    );
  }
};

module.exports = {
  sendCandidateAcceptedEmail,
  sendMissionCompletedByCandidateEmail,
  sendMissionApprovedCandidateEmail,
  sendMissionApprovedClientEmail,
  sendJobProposalEmail,
  sendProposalResponseEmail,
};
