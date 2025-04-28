export const mailMessage = (
  subject: string | undefined,
  sender: string | undefined,
  messageLink: string,
  usage: string,
) => {
  const greeting =
    usage === 'bureau' ? 'Salam Aleykum,' : 'Salam Aleykum cher parent,'

  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nouvelle Notification</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

      body {
        font-family: 'Inter', sans-serif;
        background-color: #f4f6f9;
        margin: 0;
        padding: 0;
        line-height: 1.6;
      }

      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: white;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        overflow: hidden;
      }

      .email-header {
        background: linear-gradient(135deg, #00466a 0%, #0077b6 100%);
        color: white;
        padding: 20px;
        text-align: center;
      }

      .email-content {
        padding: 30px;
      }

      .cta-button {
        display: inline-block;
        background-color: #00466a;
        color: white !important;
        text-decoration: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        transition: background-color 0.3s ease;
      }

      .cta-button:hover {
        background-color: #0077b6;
      }

      .social-links {
        display: flex;
        justify-content: center;
        gap: 15px;
        padding: 20px;
        background-color: #f4f6f9;
      }

      .social-icon {
        width: 40px;
        height: 40px;
        background-color: #e9ecef;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;
      }

      .social-icon:hover {
        background-color: #dee2e6;
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header" style="display: flex; align-items: center; padding: 20px; background: linear-gradient(135deg, #00466a 0%, #0077b6 100%); color: white;">
  <div style="flex-shrink: 0;">
    <img src="https://raw.githubusercontent.com/koala819/Unlimitd_front/refs/heads/develop/Al-Ihsane-logo-blanc.png" alt="Al-Ihsane Logo" style="width: 250px; height: auto; margin-right: 20px; background-color: transparent;">
  </div>
  <div>
    <h1 style="margin: 0; font-size: 24px;">Nouvelle Notification</h1>
  </div>
</div>


      <div class="email-content">
        <p style="font-size: 16px; color: #333;">${greeting}</p>

        <p style="font-size: 16px; color: #555;">Vous avez reçu une <strong>nouvelle notification</strong> :</p>

        <p style="font-size: 16px; color: #555;">
          <strong>${sender}</strong> vous a envoyé un message avec pour titre :
          <span style="color: #00466a; font-weight: 600;">${subject}</span>
        </p>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${messageLink}" class="cta-button">Découvrir le message</a>
        </div>
      </div>

    <div style="background-color: #f4f6f9; padding: 10px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd;">
  <p style="margin: 0;">Développé avec ❤️ par
    <a href="https://www.dix31.com/" target="_blank" style="color: #00466a; text-decoration: none; font-weight: 600;">Xavier</a>, Freelance Web & Mobile.
  </p>
</div>

    </div>
  </body>
  </html>
    `
}
