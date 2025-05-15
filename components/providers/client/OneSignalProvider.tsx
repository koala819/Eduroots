'use client'

import Script from 'next/script'

export const OneSignalProvider = () => {
  return (
    <>
      <Script
        src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
        defer
      />
      <Script id="onesignalinit" strategy="afterInteractive">
        {`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID_MERE}",
              safari_web_id: "${process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID}",
              notifyButton: {
                enable: true,
              },
            });
          });
        `}
      </Script>
    </>
  )
}
