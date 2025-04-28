export const sendOTP = (otp: number | undefined) => {
  return `<!DOCTYPE html>
<html>

<head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8">
    <style>
        .circle {
                      width: 50px;
                      height: 50px;
                      border: 2px solid #797979;
                      border-radius: 50%;
                      background-color: white;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                  }.tdLink {
                      text-align: center;
                      vertical-align: middle;
                  }
    </style>
</head>

<body style="background-color: #FFFFFF; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust:
      none;">
    <table class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
        background-color: #FFFFFF;" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tbody>
            <tr>
                <td>
                    <table class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
                background-color: #FFF;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace:
                        0pt; color: #000000; width: 650px" width="650" cellspacing="0" cellpadding="0" border="0" align="center">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight:
                              400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;
                              border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%"><br>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
                background-color: #FFF;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" role="presentation" style="background-color: rgb(236, 236, 236);
                        color: rgb(0, 0, 0); border-radius: 50px 50px 0px 0px;" width="650" height="72" cellspacing="0" cellpadding="0" border="0" align="center">
                                        <tbody>
                                            <tr>
                                                <td> <br>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
                background-color: #FFF;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" role="presentation" style="background-color: rgb(236, 236, 236);
                        color: rgb(0, 0, 0);" width="650" height="386" cellspacing="0" cellpadding="0" border="0" align="center">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" style="margin-top: 5px; background-image:
                              url(https://raw.githubusercontent.com/koala819/Unlimitd_front/develop/mosquee-colomiers.jpg);
                              background-size: cover; background-position: center; background-color: rgb(236, 236, 236);
                              color: rgb(0, 0, 0); border-radius: 50px 50px 0px 0px;"><br>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
                background-color: #FFF;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td>
                                    <table style="background-color: rgb(236, 236, 236); color: rgb(0, 0, 0); " width="650" height="196" cellspacing="0" cellpadding="0" border="0" align="center">
                                        <tbody>
                                            <tr>
                                                <td> </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table style="background-color: white; color: rgb(0, 0, 0); border-radius: 50px" width="550" height="386" cellspacing="0" cellpadding="0" border="0" align="center">
                                                        <tbody>
                                                            <tr>
                                                                <td style="padding-top: 5px" valign="top" align="center"> <a href="https://mawaqit.net/fr/m/alihsane-colomiers" style="outline:none" tabindex="-1" target="_blank" moz-do-not-send="true"><img alt="" src="https://mosqueedecolomiers.com/wp-content/uploads/2021/04/logo-white.png" style="display: block; max-width: 60%;" title="Logo Mosquee Colomiers" moz-do-not-send="true" width="100" height="35" border="0"></a> </td>
                                                            </tr>
                                                            <tr>
                                                                <td style="overflow-wrap:break-word;word-break:break-word;padding:60px 50px
                                      20px;font-family:'Raleway',sans-serif;" valign="top" align="left">
                                                                    <div style="font-family: Helvetica,Arial,sans-serif; overflow:auto;line-height:2">
                                                                        <div style="margin:50px auto;width:70%;padding:20px 0">
                                                                            <div style="border-bottom:1px solid #eee"> <a href="" style="font-size:1.4em;color:
                                              #00466a;text-decoration:none;font-weight:600">Code Temporaire</a> </div>
                                                                            <p style="font-size:1.1em">Salam Aleykum,</p>
                                                                            <p>Voici le code pour compléter la procédure de changement du mot de passe. Ce
                                                                                code est valide pendant 5 minutes</p>
                                                                            <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0
                                            10px;color: #fff;border-radius: 4px;">${otp}</h2>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;
                background-color: #fff;" width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
                    </table>
                    <table style="background-color: rgb(236, 236, 236); color: rgb(0, 0, 0); text-align: center;" width="650" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td>
                                    <table width="400" align="center">
                                        <tbody>
                                            <tr align="center">
                                                <td> <a href="${process.env.YOUTUBE_LINK}" title="Youtube ${process.env.DEFAULT_NAME}" target="_blank">
                                                        <div class="circle">
                                                            <svg style="color: rgb(121, 121, 121);" class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                                <path fill-rule="evenodd" d="M21.7 8.037a4.26 4.26 0 0 0-.789-1.964 2.84 2.84 0 0 0-1.984-.839c-2.767-.2-6.926-.2-6.926-.2s-4.157 0-6.928.2a2.836 2.836 0 0 0-1.983.839 4.225 4.225 0 0 0-.79 1.965 30.146 30.146 0 0 0-.2 3.206v1.5a30.12 30.12 0 0 0 .2 3.206c.094.712.364 1.39.784 1.972.604.536 1.38.837 2.187.848 1.583.151 6.731.2 6.731.2s4.161 0 6.928-.2a2.844 2.844 0 0 0 1.985-.84 4.27 4.27 0 0 0 .787-1.965 30.12 30.12 0 0 0 .2-3.206v-1.516a30.672 30.672 0 0 0-.202-3.206Zm-11.692 6.554v-5.62l5.4 2.819-5.4 2.801Z" clip-rule="evenodd"></path>
                                                            </svg>
                                                        </div>
                                                    </a> <br>
                                                </td>
                                                <td> <a href="${process.env.WEBSITE_URL}" title="App ${process.env.DEFAULT_NAME}" target="_blank">
                                                        <div class="circle"><svg style="color: rgb(121, 121, 121); class=" w-6="" h-6="" text-gray-800="" dark:text-white"="" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                                                                <path fill-rule="evenodd" d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4Zm16 7H4v7h16v-7ZM5 8a1 1 0 0 1 1-1h.01a1 1 0 0 1 0 2H6a1 1 0 0 1-1-1Zm4-1a1 1 0 0 0 0 2h.01a1 1 0 0 0 0-2H9Zm2 1a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H12a1 1 0 0 1-1-1Z" clip-rule="evenodd"></path>
                                                            </svg></div>
                                                    </a><br>
                                                </td>
                                                <td> <a href="${process.env.WEBSITE_SCHOOL}" title="site web de ${process.env.DEFAULT_NAME}" target="_blank">
                                                        <div class="circle"><svg style="color: rgb(121, 121, 121); class=" w-6="" h-6="" text-gray-800="" dark:text-white"="" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961"></path>
                                                            </svg>
                                                        </div>
                                                    </a><br>
                                                </td>
                                                <td> <a href="mailto:${process.env.DEFAULT_SENDER}" title="ecrire un mail à ${process.env.DEFAULT_NAME}">
                                                        <div class="circle">
                                                            <svg style="color: rgb(121, 121, 121); class=" w-6="" h-6="" text-gray-800="" dark:text-white"="" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 8v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8m18 0-8.029-4.46a2 2 0 0 0-1.942 0L3 8m18 0-9 6.5L3 8"></path>
                                                            </svg>
                                                        </div>
                                                        <br>
                                                    </a> </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table style="background-color: rgb(236, 236, 236); color: rgb(0, 0, 0);" width="650" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td style="width:100%;">
                                    <div style="font-family: Helvetica,Arial,sans-serif" align="center">
                                        <p style="font-size:0.8em">Réalisé et maintenu par <a href='https://www.dix31.com/'><b>Xavier de DIX31</b></a></p>
                                        <p style="font-size:0.7em">Développeur Indépendant Xavier</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table style="background-color: rgb(236, 236, 236); color: rgb(0, 0, 0);" width="650" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td> <br>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row-content stack" role="presentation" style="background-color: rgb(236, 236, 236); color:
                rgb(0, 0, 0); border-radius: 0px 0px 50px 50px;" width="650" height="72" cellspacing="0" cellpadding="0" border="0" align="center">
                        <tbody>
                            <tr>
                                <td> <br>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table>
    <!-- End -->




</body>

</html>`
}
