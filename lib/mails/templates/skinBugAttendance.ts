export function mailBugAttendance({ _id, teacher, session, date }: any) {
  return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Détails de l'enregistrement d'assiduité</title>
        <style>
          body { font-family: 'Courier New', monospace; line-height: 1.6; color: #333; background-color: #f4f4f4; }
          .container { width: 100%; max-width: 800px; margin: 20px auto; padding: 20px; background-color: #fff; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
          h1 { color: #e53e3e; }
          .record { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; font-size: 14px; }
          .field { margin-bottom: 10px; }
          .label { font-weight: bold; color: #000; }
          .objectId { color: #e74c3c; }
          .date { color: #2980b9; }
        </style>
      </head>
      <body>
        <div class="container">
           <h1>Bug d'assiduité détecté</h1>
        <p>Un problème a été détecté dans la collection attendances</p>
          <div class="record">
            <div class="field"><span class="label">_id:</span> <span class="objectId">ObjectId('${_id}')</span></div>
            <div class="field"><span class="label">teacher:</span> <span class="objectId">ObjectId('${teacher}')</span></div>
            <div class="field"><span class="label">session:</span> <span class="objectId">ObjectId('${session}')</span></div>
            <div class="field"><span class="label">date:</span> <span class="date">${new Date(date).toISOString()}</span></div>
          </div>

        </div>
      </body>
      </html>
    `
}
