export function skinUpdateStudentEmail({
  studentId,
  firstname,
  lastname,
  teacherFirstname,
  teacherLastname,
  newEmail,
}: any) {
  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mise à jour d'email étudiant</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { width: 100%; max-width: 600px; margin: 20px auto; background-color: #fff; box-shadow: 0 0 20px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(45deg, #FF6B6B, #4ECDC4); color: white; padding: 20px; text-align: center; }
        h1 { margin: 0; font-size: 28px; }
        .content { padding: 30px; }
        .card { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .student-info, .teacher-info { display: flex; justify-content: space-between; flex-wrap: wrap; }
        .info-item { flex-basis: 48%; margin-bottom: 10px; }
        .label { font-weight: 600; color: #5a67d8; display: block; margin-bottom: 5px; }
        .value { color: #2d3748; background-color: white; padding: 8px; border-radius: 4px; display: block; }
        .new-email { background: linear-gradient(45deg, #4ECDC4, #45B7D8); color: white; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center; }
        .highlight { font-weight: 600; font-size: 18px; }
        .icon { width: 20px; height: 20px; margin-right: 10px; vertical-align: middle; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 Mise à jour d'email étudiant</h1>
        </div>
        <div class="content">
          <p style="text-align: center; margin-top: 20px; color: #718096;">Veuillez vérifier et mettre à jour l'adresse email de cet étudiant dans le système.</p>
          <div class="new-email">
            <h2>📧 Nouvelle adresse email proposée</h2>
            <p class="highlight">${newEmail}</p>
          </div>

          <div class="card">
            <h2>📚 Informations de l'étudiant</h2>
            <div class="student-info">
              <div class="info-item">
                <span class="label">ID Étudiant</span>
                <span class="value">${studentId}</span>
              </div>
              <div class="info-item">
                <span class="label"></span>
                <span class="value"></span>
              </div>
              <div class="info-item">
                <span class="label">Prénom</span>
                <span class="value">${firstname}</span>
              </div>
              <div class="info-item">
                <span class="label">Nom</span>
                <span class="value">${lastname}</span>
              </div>
            </div>
          </div>
          <div class="card">
            <h2>👨‍🏫 Enseignant demandeur</h2>
            <div class="teacher-info">
              <div class="info-item">
                <span class="label">Prénom</span>
                <span class="value">${teacherFirstname}</span>
              </div>
              <div class="info-item">
                <span class="label">Nom</span>
                <span class="value">${teacherLastname}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </body>
    </html>
  `
}
