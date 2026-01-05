const nodemailer = require("nodemailer");
const { logger } = require("../utils/logger");

// --- 1. CONFIGURATION DU TRANSPORTEUR ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    logger.error("❌ Erreur Config Email (Nodemailer):", error);
  } else {
    logger.info("✅ Service Email (Gmail) Prêt.");
  }
});

// --- 2. FONCTION GÉNÉRIQUE D'ENVOI ---
const sendEmail = async (to, subject, htmlContent) => {
  if (!to) {
    logger.warn("Tentative d'envoi d'email sans destinataire.");
    return null;
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
    to: to,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email envoyé à ${to} : ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Erreur d'envoi d'email à ${to}:`, error);
    return null;
  }
};

// --- 3. DESIGN SYSTEM & HELPERS ---
const styles = {
  body: "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; width: 100%; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;",
  container:
    "max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);",
  header:
    "background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 20px; text-align: center;",
  headerTitle:
    "color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;",
  content:
    "padding: 40px 30px; color: #374151; font-size: 16px; line-height: 1.6;",
  card: "background-color: #F9FAFB; border-left: 4px solid #4F46E5; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;",
  h2: "color: #111827; font-size: 20px; font-weight: 700; margin-top: 0;",
  p: "margin: 0 0 15px 0;",
  detailLabel:
    "color: #6B7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700;",
  detailValue:
    "color: #1F2937; font-size: 16px; font-weight: 600; margin-bottom: 12px; display: block;",
  buttonContainer: "text-align: center; margin-top: 35px; margin-bottom: 20px;",
  button:
    "background-color: #4F46E5; color: #ffffff; padding: 14px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);",
  footer:
    "background-color: #F9FAFB; padding: 20px; text-align: center; font-size: 12px; color: #9CA3AF; border-top: 1px solid #E5E7EB;",
  link: "color: #4F46E5; text-decoration: none;",
};

// Helper pour formater les dates
const formatDate = (date) => {
  if (!date) return "Date non spécifiée";
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Helper pour gérer les valeurs nulles
const safe = (val, fallback = "Non spécifié") => val || fallback;

// --- 4. TEMPLATES EMAILS ---

const emailTemplates = {
  // 1. Bienvenue
  welcome: (name, role) => {
    let message = "Bienvenue dans la communauté des talents.";
    let cta = "Accéder à mon espace";
    const userRole =
      role === "candidate"
        ? "Candidat"
        : role === "client"
        ? "Recruteur"
        : "Formateur";

    if (role === "candidate")
      message =
        "Votre profil est votre meilleur atout. Complétez-le dès maintenant pour décrocher vos premières missions.";
    if (role === "client")
      message =
        "Trouvez les meilleurs freelances pour vos projets dès aujourd'hui.";
    if (role === "trainer")
      message = "Partagez votre expertise et commencez à créer vos formations.";

    return {
      subject: `Bienvenue sur OnveWork, ${safe(name)} ! 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="${styles.body}">
            <div style="${styles.container}">
              <div style="${styles.header}">
                <h1 style="${styles.headerTitle}">Bienvenue à bord !</h1>
              </div>
              <div style="${styles.content}">
                <p style="${styles.p}">Bonjour <strong>${safe(
        name
      )}</strong>,</p>
                <p style="${
                  styles.p
                }">Nous sommes ravis de vous accueillir en tant que <strong>${userRole}</strong>.</p>
                <div style="${styles.card}">
                  <p style="margin:0;">${message}</p>
                </div>
                <div style="${styles.buttonContainer}">
                  <a href="${process.env.FRONTEND_URL}/login" style="${
        styles.button
      }">${cta}</a>
                </div>
              </div>
              <div style="${styles.footer}">
                <p>&copy; ${new Date().getFullYear()} OnveWork. Tous droits réservés.</p>
              </div>
            </div>
          </body>
        </html>
      `,
    };
  },

  // 2. Candidature Acceptée
  candidateAccepted: (
    candidateName,
    jobTitle,
    clientCompany,
    duration,
    startDate
  ) => ({
    subject: `🎉 Félicitations ! Mission acceptée : "${safe(jobTitle)}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <div style="${styles.header}">
              <h1 style="${styles.headerTitle}">C'est un OUI ! 🎉</h1>
            </div>
            <div style="${styles.content}">
              <p style="${styles.p}">Félicitations <strong>${safe(
      candidateName
    )}</strong>,</p>
              <p style="${
                styles.p
              }">Votre candidature a retenu l'attention de <strong>${safe(
      clientCompany,
      "l'entreprise"
    )}</strong>.</p>
              
              <div style="${styles.card}">
                <h2 style="${styles.h2}">${safe(jobTitle)}</h2>
                <div style="margin-top: 15px;">
                  <span style="${styles.detailLabel}">DURÉE</span>
                  <span style="${styles.detailValue}">${safe(duration)}</span>
                  
                  <span style="${styles.detailLabel}">DÉBUT DE LA MISSION</span>
                  <span style="${styles.detailValue}">${formatDate(
      startDate
    )}</span>
                </div>
              </div>

              <div style="${styles.buttonContainer}">
                <a href="${process.env.FRONTEND_URL}/dashboard" style="${
      styles.button
    }">Accéder à la mission</a>
              </div>
            </div>
            <div style="${styles.footer}">OnveWork - Plateforme Freelance</div>
          </div>
        </body>
      </html>
    `,
  }),

  // 3. Mission Terminée par Candidat (Envoyé au Client)
  missionCompletedByCandidate: (
    clientName,
    candidateName,
    jobTitle,
    completionDate
  ) => ({
    subject: `✅ Mission terminée : "${safe(jobTitle)}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <div style="${styles.header} background: #F59E0B;">
              <h1 style="${styles.headerTitle}">Mission Terminée</h1>
            </div>
            <div style="${styles.content}">
              <p style="${styles.p}">Bonjour <strong>${safe(
      clientName
    )}</strong>,</p>
              <p style="${styles.p}"><strong>${safe(
      candidateName
    )}</strong> indique avoir terminé la mission suivante :</p>
              
              <div style="${styles.card} border-color: #F59E0B;">
                <h2 style="${styles.h2}">${safe(jobTitle)}</h2>
                <span style="${styles.detailLabel}">DATE DE SOUMISSION</span>
                <span style="${styles.detailValue}">${formatDate(
      completionDate
    )}</span>
              </div>

              <p style="${
                styles.p
              }">Merci de vérifier le travail et de valider la fin de mission.</p>
              
              <div style="${styles.buttonContainer}">
                <a href="${
                  process.env.FRONTEND_URL
                }/manage-applications" style="${
      styles.button
    } background-color: #F59E0B;">Vérifier & Valider</a>
              </div>
            </div>
            <div style="${styles.footer}">OnveWork Notification</div>
          </div>
        </body>
      </html>
    `,
  }),

  // 4. Mission Approuvée (Envoyé au Candidat)
  missionApprovedCandidate: (
    candidateName,
    jobTitle,
    clientCompany,
    completionDate
  ) => ({
    subject: `🌟 Mission validée : "${safe(jobTitle)}"`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <div style="${styles.header} background: #10B981;">
              <h1 style="${styles.headerTitle}">Mission Validée !</h1>
            </div>
            <div style="${styles.content}">
              <p style="${styles.p}">Bravo <strong>${safe(
      candidateName
    )}</strong>,</p>
              <p style="${styles.p}">Le client <strong>${safe(
      clientCompany
    )}</strong> a validé votre travail.</p>
              
              <div style="${styles.card} border-color: #10B981;">
                <h2 style="${styles.h2}">${safe(jobTitle)}</h2>
                <span style="${styles.detailLabel}">DATE DE VALIDATION</span>
                <span style="${styles.detailValue}">${formatDate(
      completionDate
    )}</span>
              </div>

              <div style="${styles.buttonContainer}">
                <a href="${process.env.FRONTEND_URL}/profile" style="${
      styles.button
    } background-color: #10B981;">Voir mon profil</a>
              </div>
            </div>
            <div style="${styles.footer}">L'équipe OnveWork</div>
          </div>
        </body>
      </html>
    `,
  }),

  // 5. Proposition de Mission (Offre directe)
  jobProposalReceived: (candidateName, clientCompany, jobTitle, message) => ({
    subject: `🚀 Nouvelle opportunité avec ${safe(clientCompany)}`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            <div style="${styles.header} background: #6366f1;">
              <h1 style="${styles.headerTitle}">Proposition de Mission</h1>
            </div>
            <div style="${styles.content}">
              <p style="${styles.p}">Bonjour <strong>${safe(
      candidateName
    )}</strong>,</p>
              <p style="${styles.p}"><strong>${safe(
      clientCompany
    )}</strong> souhaite collaborer avec vous sur un projet :</p>
              
              <div style="${styles.card} border-color: #6366f1;">
                <h2 style="${styles.h2}">${safe(jobTitle)}</h2>
                ${
                  message
                    ? `<p style="margin-top:10px; font-style:italic; color:#666;">"${message}"</p>`
                    : ""
                }
              </div>

              <div style="${styles.buttonContainer}">
                <a href="${process.env.FRONTEND_URL}/my-applications" style="${
      styles.button
    } background-color: #6366f1;">Voir l'offre</a>
              </div>
            </div>
            <div style="${styles.footer}">OnveWork</div>
          </div>
        </body>
      </html>
    `,
  }),

  // 6. Réponse à une proposition
  proposalResponse: (clientCompany, candidateName, jobTitle, decision) => {
    const isAccepted = decision === "accepted";
    const color = isAccepted ? "#10B981" : "#EF4444";
    const title = isAccepted
      ? "Proposition Acceptée ! 🤝"
      : "Proposition Déclinée";

    return {
      subject: `Réponse de ${safe(candidateName)} : ${
        isAccepted ? "Accepté" : "Décliné"
      }`,
      html: `
        <!DOCTYPE html>
        <html>
          <body style="${styles.body}">
            <div style="${styles.container}">
              <div style="${styles.header} background: ${color};">
                <h1 style="${styles.headerTitle}">${title}</h1>
              </div>
              <div style="${styles.content}">
                <p style="${styles.p}">Bonjour <strong>${safe(
        clientCompany
      )}</strong>,</p>
                <p style="${styles.p}">
                  Le candidat <strong>${safe(
                    candidateName
                  )}</strong> a répondu à votre offre pour 
                  <strong>"${safe(jobTitle)}"</strong>.
                </p>
                
                <div style="${
                  styles.card
                } border-color: ${color}; text-align:center;">
                  <h2 style="${
                    styles.h2
                  } color: ${color}; text-transform: uppercase;">
                    ${isAccepted ? "ACCEPTÉE" : "DÉCLINÉE"}
                  </h2>
                </div>

                ${
                  isAccepted
                    ? `<p style="${styles.p}">Vous pouvez maintenant échanger avec le candidat pour démarrer la mission.</p>`
                    : ""
                }

                <div style="${styles.buttonContainer}">
                  <a href="${process.env.FRONTEND_URL}/dashboard" style="${
        styles.button
      } background-color: ${color};">Accéder au Dashboard</a>
                </div>
              </div>
              <div style="${styles.footer}">OnveWork</div>
            </div>
          </body>
        </html>
      `,
    };
  },

  jobCreatedPendingValidation: (clientName, companyName, jobTitle) => ({
    subject: `🕒 Votre mission "${safe(jobTitle)}" est en cours de validation`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="${styles.body}">
          <div style="${styles.container}">
            
            <!-- Header Orange pour signifier l'attente -->
            <div style="${
              styles.header
            } background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);">
              <h1 style="${
                styles.headerTitle
              }">Mission en cours de validation ⏳</h1>
            </div>
            
            <div style="${styles.content}">
              <p style="${styles.p}">Bonjour <strong>${safe(
      clientName,
      "cher client"
    )}</strong>,</p>
              
              <p style="${styles.p}">
                Votre mission a bien été créée ${
                  companyName
                    ? `pour l’entreprise <strong>${safe(companyName)}</strong>`
                    : ""
                } et enregistrée dans notre système.
              </p>
              
              <!-- Carte Détail -->
              <div style="${styles.card} border-left-color: #F59E0B;">
                <span style="${styles.detailLabel}">TITRE DE LA MISSION</span>
                <h2 style="${styles.h2} margin-bottom: 0;">${safe(
      jobTitle
    )}</h2>
              </div>

              <div style="background-color: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <p style="margin: 0; color: #92400E; font-size: 14px;">
                  🔍 <strong>Prochaine étape :</strong> Notre équipe de modération va vérifier la conformité de votre offre.
                </p>
              </div>

              <p style="${styles.p}">
                Cette étape permet de garantir la qualité des missions sur OnveWork. 
                Vous serez notifié par email dès qu’elle sera mise en ligne (généralement sous quelques heures).
              </p>

              <div style="${styles.buttonContainer}">
                <a href="${process.env.FRONTEND_URL}/dashboard" style="${
      styles.button
    } background-color: #F59E0B; box-shadow: 0 4px 6px rgba(245, 158, 11, 0.2);">
                  Voir mes missions
                </a>
              </div>
            </div>
            
            <div style="${styles.footer}">OnveWork - Équipe Modération</div>
          </div>
        </body>
      </html>
    `,
  }),
};

// --- 5. FONCTIONS D'ENVOI (WRAPPER) ---

const sendWelcomeEmail = async (email, name, role) =>
  sendEmail(email, ...Object.values(emailTemplates.welcome(name, role)));

const sendCandidateAcceptedEmail = async (
  email,
  name,
  title,
  company,
  duration,
  start
) =>
  sendEmail(
    email,
    ...Object.values(
      emailTemplates.candidateAccepted(name, title, company, duration, start)
    )
  );

const sendMissionCompletedByCandidateEmail = async (
  email,
  client,
  candidate,
  title,
  date
) =>
  sendEmail(
    email,
    ...Object.values(
      emailTemplates.missionCompletedByCandidate(client, candidate, title, date)
    )
  );

const sendMissionApprovedCandidateEmail = async (
  email,
  candidate,
  title,
  client,
  date
) =>
  sendEmail(
    email,
    ...Object.values(
      emailTemplates.missionApprovedCandidate(candidate, title, client, date)
    )
  );

const sendMissionApprovedClientEmail = async (
  email,
  client,
  candidate,
  title,
  date
) => {
  // Note: Utilise le template générique ou un template spécifique si besoin
  // Ici on réutilise une structure simple pour le client
  const html = `
      <!DOCTYPE html><html><body style="${styles.body}"><div style="${
    styles.container
  }"><div style="${styles.header}"><h1 style="${
    styles.headerTitle
  }">Mission Archivée</h1></div><div style="${
    styles.content
  }"><p>La mission <strong>${safe(title)}</strong> avec <strong>${safe(
    candidate
  )}</strong> est terminée.</p></div></div></body></html>
    `;
  return sendEmail(email, `Mission terminée : ${safe(title)}`, html);
};

const sendJobProposalEmail = async (email, candidate, company, title, msg) =>
  sendEmail(
    email,
    ...Object.values(
      emailTemplates.jobProposalReceived(candidate, company, title, msg)
    )
  );

const sendProposalResponseEmail = async (
  email,
  company,
  candidate,
  title,
  decision
) =>
  sendEmail(
    email,
    ...Object.values(
      emailTemplates.proposalResponse(company, candidate, title, decision)
    )
  );

const sendJobCreatedEmail = async (
  email,
  clientName,
  companyName,
  jobTitle
) => {
  try {
    const template = emailTemplates.jobCreatedPendingValidation(
      clientName,
      companyName,
      jobTitle
    );
    return sendEmail(email, template.subject, template.html);
  } catch (error) {
    logger.error("Erreur envoi email création job:", error);
  }
};

module.exports = {
  sendWelcomeEmail,
  sendCandidateAcceptedEmail,
  sendMissionCompletedByCandidateEmail,
  sendMissionApprovedCandidateEmail,
  sendMissionApprovedClientEmail,
  sendJobProposalEmail,
  sendProposalResponseEmail,
  sendJobCreatedEmail,
};
