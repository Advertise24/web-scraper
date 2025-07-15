'use client'
import React, { useState } from 'react';
import { Copy, Download, Globe, Image, FileText, AlertCircle } from 'lucide-react';

export default function WebScraper() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scrapedData, setScrapedData] = useState(null);
  const [copied, setCopied] = useState(false);

  const scrapeWebsite = async () => {
    if (!url) {
      setError('Proszę podać adres URL');
      return;
    }

    setLoading(true);
    setError('');
    setScrapedData(null);

    try {
      // Używamy publicznie dostępnego proxy CORS
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.status.http_code !== 200) {
        throw new Error('Nie udało się pobrać strony');
      }

      // Parsowanie HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      // Usuwanie skryptów i stylów
      const scripts = doc.querySelectorAll('script, style');
      scripts.forEach(el => el.remove());

      // Pobieranie tekstu
      const textContent = [];
      
      // Nagłówki
      const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
      headings.forEach(heading => {
        const text = heading.textContent.trim();
        if (text) {
          textContent.push({
            type: heading.tagName.toLowerCase(),
            text: text
          });
        }
      });

      // Paragrafy
      const paragraphs = doc.querySelectorAll('p');
      paragraphs.forEach(p => {
        const text = p.textContent.trim();
        if (text && text.length > 10) {
          textContent.push({
            type: 'p',
            text: text
          });
        }
      });

      // Listy
      const listItems = doc.querySelectorAll('li');
      listItems.forEach(li => {
        const text = li.textContent.trim();
        if (text) {
          textContent.push({
            type: 'li',
            text: '• ' + text
          });
        }
      });

      // Obrazki
      const images = doc.querySelectorAll('img');
      const imageUrls = [];
      images.forEach(img => {
        let src = img.src || img.dataset.src || img.dataset.lazySrc;
        if (src) {
          // Konwersja względnych URLi na bezwzględne
          if (!src.startsWith('http')) {
            const baseUrl = new URL(url);
            src = new URL(src, baseUrl.origin).href;
          }
          imageUrls.push({
            src: src,
            alt: img.alt || 'Brak opisu'
          });
        }
      });

      // Usuwanie duplikatów
      const uniqueImages = imageUrls.filter((img, index, self) =>
        index === self.findIndex((i) => i.src === img.src)
      );

      setScrapedData({
        text: textContent,
        images: uniqueImages,
        title: doc.title || 'Bez tytułu',
        url: url
      });

    } catch (err) {
      setError('Błąd podczas scrapowania: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAllText = () => {
    if (!scrapedData) return '';
    return scrapedData.text.map(item => item.text).join('\n\n');
  };

  const getAllImageLinks = () => {
    if (!scrapedData) return '';
    return scrapedData.images.map(img => img.src).join('\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-700">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Globe className="text-blue-500" />
            Web Scraper
          </h1>
          <p className="text-gray-400 mb-8">Scrapuj tekst i obrazki z dowolnej strony internetowej</p>

          {/* Input i przycisk */}
          <div className="flex gap-3 mb-8">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://przykład.pl"
              className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && scrapeWebsite()}
            />
            <button
              onClick={scrapeWebsite}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Scrapuję...
                </>
              ) : (
                <>
                  <Download size={20} />
                  Scrapuj
                </>
              )}
            </button>
          </div>

          {/* Błąd */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-lg flex items-center gap-3 text-red-400">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Wyniki */}
          {scrapedData && (
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <h2 className="text-xl font-semibold text-white mb-2">{scrapedData.title}</h2>
                <p className="text-gray-400 text-sm">{scrapedData.url}</p>
              </div>

              {/* Tekst */}
              <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <FileText size={20} className="text-green-500" />
                    Tekst ({scrapedData.text.length} elementów)
                  </h3>
                  <button
                    onClick={() => copyToClipboard(getAllText())}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Copy size={16} />
                    {copied ? 'Skopiowano!' : 'Kopiuj wszystko'}
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto bg-gray-800 rounded-lg p-4 space-y-3">
                  {scrapedData.text.map((item, index) => (
                    <div key={index} className="text-gray-300">
                      {item.type.startsWith('h') && (
                        <div className={`font-semibold ${
                          item.type === 'h1' ? 'text-xl' : 
                          item.type === 'h2' ? 'text-lg' : 
                          'text-base'
                        }`}>
                          {item.text}
                        </div>
                      )}
                      {item.type === 'p' && (
                        <p className="text-sm leading-relaxed">{item.text}</p>
                      )}
                      {item.type === 'li' && (
                        <p className="text-sm ml-4">{item.text}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Obrazki */}
              {scrapedData.images.length > 0 && (
                <div className="bg-gray-700/50 rounded-lg p-6 border border-gray-600">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Image size={20} className="text-purple-500" />
                      Obrazki ({scrapedData.images.length})
                    </h3>
                    <button
                      onClick={() => copyToClipboard(getAllImageLinks())}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                      <Copy size={16} />
                      Kopiuj linki
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {scrapedData.images.map((img, index) => (
                      <div key={index} className="bg-gray-800 rounded-lg p-3 space-y-2">
                        <img 
                          src={img.src} 
                          alt={img.alt}
                          className="w-full h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden bg-gray-700 rounded-lg p-4 text-center text-gray-500">
                          <Image size={32} className="mx-auto mb-2" />
                          Nie można załadować obrazka
                        </div>
                        <p className="text-xs text-gray-400 truncate">{img.alt}</p>
                        <input 
                          type="text" 
                          value={img.src} 
                          readOnly
                          className="w-full px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded border border-gray-600 cursor-text"
                          onClick={(e) => e.target.select()}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
