export function mailCheckAdminCo(detailedBody: any) {
  const {
    time,
    mail,
    userAgent,
    userDetails: {ip = 'Non défini', device: {client = {}, os = {}, device = {}} = {}} = {},
  } = detailedBody

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Europe/Paris',
    })
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Alerte de Sécurité - Tentative de Connexion Admin</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap');

        body {
          font-family: 'Roboto', sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f0f2f5;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
        .header {
          background-color: #4a69bd;
          color: white;
          padding: 20px;
          text-align: center;
        }
        h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
        }
        .content {
          background-color: white;
          padding: 30px;
        }
        .alert {
          background-color: #ffeaa7;
          border-left: 4px solid #fdcb6e;
          padding: 15px;
          margin-bottom: 20px;
          border-radius: 4px;
          font-weight: bold;
          color: #2c3e50;
        }
        .info-block {
          background-color: #f8f9fa;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .label {
          font-weight: bold;
          color: #4a69bd;
        }
        .value {
          color: #2c3e50;
        }
        .footer {
          background-color: #4a69bd;
          color: white;
          text-align: center;
          padding: 15px;
          font-size: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚨 Alerte de Sécurité - Connexion Admin</h1>
        </div>
        <div class="content">
          <div class="alert">
            Une tentative de connexion à un compte ADMIN a été détectée.
          </div>

          <div class="info-block">
            <h2>Détails de la connexion</h2>
            <div class="info-item">
              <span class="label">Date et heure :</span>
              <span class="value">${formatDate(time)}</span>
            </div>
            <div class="info-item">
              <span class="label">Adresse IP :</span>
              <span class="value">${ip}</span>
            </div>
            <div class="info-item">
              <span class="label">Email :</span>
              <span class="value">${mail}</span>
            </div>
          </div>

          <div class="info-block">
            <h2>Appareil</h2>
            <div class="info-item">
              <span class="label">Type :</span>
              <span class="value">${device.type || 'Non défini'}</span>
            </div>
          </div>

          <div class="info-block">
            <h2>Système d'exploitation</h2>
            <div class="info-item">
              <span class="label">Nom :</span>
              <span class="value">${os.name || 'Non défini'}</span>
            </div>
            <div class="info-item">
              <span class="label">Version :</span>
              <span class="value">${os.version || 'Non défini'}</span>
            </div>
            <div class="info-item">
              <span class="label">Plateforme :</span>
              <span class="value">${os.platform || 'Non défini'}</span>
            </div>
          </div>

          <div class="info-block">
            <h2>Navigateur</h2>
            <div class="info-item">
              <span class="label">Nom :</span>
              <span class="value">${client.name || 'Non défini'}</span>
            </div>
            <div class="info-item">
              <span class="label">Version :</span>
              <span class="value">${client.version || 'Non défini'}</span>
            </div>
            <div class="info-item">
              <span class="label">Moteur :</span>
              <span class="value">${client.engine || 'Non défini'}</span>
            </div>
            <div class="info-item">
              <span class="label">Version du moteur :</span>
              <span class="value">${client.engineVersion || 'Non défini'}</span>
            </div>
          </div>
          <div class="info-block">
            <h2>User Agent</h2>
            <div class="info-item">
              <span class="value">${userAgent}</span>
            </div>
          </div>
        </div>
        <div class="footer">
          <p>Ceci est un message automatique. Ne pas répondre.</p>
          <p>Si vous n'êtes pas à l'origine de cette connexion, contactez immédiatement l'équipe de sécurité.</p>
        </div>
      </div>
    </body>
    </html>
  `
}
