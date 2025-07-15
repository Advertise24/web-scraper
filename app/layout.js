import './globals.css'

export const metadata = {
  title: 'Web Scraper - Narzędzie do scrapowania stron',
  description: 'Scrapuj tekst i obrazki z dowolnej strony internetowej',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  )
}
