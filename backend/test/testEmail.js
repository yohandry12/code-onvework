// test/testEmail.js
// Script pour tester l'envoi d'emails SendGrid

require("dotenv").config();
const sgMail = require("@sendgrid/mail");

// Configuration
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function testSendEmail() {
  console.log("🧪 Test d'envoi d'email SendGrid...\n");

  // Vérifications préalables
  console.log("📋 Vérification de la configuration :");
  console.log(
    `   - SENDGRID_API_KEY : ${
      process.env.SENDGRID_API_KEY ? "✅ Définie" : "❌ Manquante"
    }`
  );
  console.log(`   - EMAIL_FROM : ${process.env.EMAIL_FROM || "❌ Manquante"}`);
  console.log(
    `   - EMAIL_FROM_NAME : ${process.env.EMAIL_FROM_NAME || "❌ Manquante"}`
  );
  console.log(
    `   - FRONTEND_URL : ${process.env.FRONTEND_URL || "❌ Manquante"}\n`
  );

  if (!process.env.SENDGRID_API_KEY) {
    console.error("❌ SENDGRID_API_KEY n'est pas définie dans .env");
    process.exit(1);
  }

  // Message de test
  const msg = {
    to: "bienvenueleroi0@gmail.com", // ⚠️ REMPLACEZ PAR VOTRE EMAIL
    from: {
      email: process.env.EMAIL_FROM,
      name: process.env.EMAIL_FROM_NAME,
    },
    subject: "🧪 Test d'envoi depuis OnveWork",
    text: "Si vous recevez cet email, SendGrid fonctionne correctement !",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px; }
            .content { padding: 20px; background-color: #f9fafb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Test réussi !</h1>
            </div>
            <div class="content">
              <p>Si vous recevez cet email, votre configuration SendGrid est <strong>opérationnelle</strong> !</p>
              <p>Configuration détectée :</p>
              <ul>
                <li><strong>Expéditeur</strong> : ${process.env.EMAIL_FROM}</li>
                <li><strong>Nom</strong> : ${process.env.EMAIL_FROM_NAME}</li>
                <li><strong>Frontend URL</strong> : ${process.env.FRONTEND_URL}</li>
              </ul>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  try {
    console.log("📤 Envoi de l'email de test...");
    const response = await sgMail.send(msg);

    console.log("\n✅ Email envoyé avec succès !");
    console.log(`   - Status Code : ${response[0].statusCode}`);
    console.log(`   - Destinataire : ${msg.to}`);
    console.log(`   - Expéditeur : ${msg.from.email}`);
    console.log(
      "\n💡 Vérifiez votre boîte de réception (et les spams si besoin)"
    );
  } catch (error) {
    console.error("\n❌ Erreur lors de l'envoi :");

    if (error.response) {
      console.error(`   - Code : ${error.response.statusCode}`);
      console.error(`   - Message : ${error.response.body.errors[0].message}`);

      // Messages d'erreur courants
      if (error.response.statusCode === 401) {
        console.error(
          "\n💡 Solution : Vérifiez que votre SENDGRID_API_KEY est correcte"
        );
      } else if (error.response.statusCode === 403) {
        console.error(
          "\n💡 Solution : Vérifiez que l'adresse EMAIL_FROM est autorisée dans SendGrid"
        );
        console.error(
          "   Allez dans Settings → Sender Authentication → Single Sender Verification"
        );
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Exécution
testSendEmail();

// Usage : node test/testEmail.js
