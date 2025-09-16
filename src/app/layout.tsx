import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#1E3A8A" />
        <title>SaaS RH Côte d'Ivoire</title>
        <meta name="description" content="Plateforme de gestion RH spécialement adaptée aux PME ivoiriennes" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased bg-gray-50" style={{fontSize: '0.4375rem'}}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}