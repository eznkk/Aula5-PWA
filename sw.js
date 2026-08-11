/* =========================================================================
   NEUROBOLINHAS — sw.js
   Service Worker: guarda o "esqueleto" do aplicativo em cache para uso
   offline (importante em conexões instáveis) e guarda em cache, sob
   demanda, os arquivos de imagem/áudio à medida que forem adicionados
   nas pastas assets/. Se um arquivo de asset ainda não existir, a
   instalação do app NÃO é interrompida — cada requisição é tratada
   individualmente.
   ========================================================================= */

const VERSAO_CACHE = 'neurobolinhas-v1';

const ARQUIVOS_ESSENCIAIS = [
    './',
    'index.html',
    'style.css',
    'app.js',
    'manifest.json'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(
        caches.open(VERSAO_CACHE).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys().then((nomes) =>
            Promise.all(
                nomes
                    .filter((nome) => nome !== VERSAO_CACHE)
                    .map((nome) => caches.delete(nome))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
    // Só trata requisições do próprio site (GET), para não interferir no VLibras ou em outros domínios
    if (evento.request.method !== 'GET' || !evento.request.url.startsWith(self.location.origin)) return;

    evento.respondWith(
        caches.match(evento.request).then((respostaCache) => {
            if (respostaCache) return respostaCache;

            return fetch(evento.request)
                .then((respostaRede) => {
                    // Guarda em cache silenciosamente arquivos válidos (ex.: assets adicionados depois)
                    if (respostaRede && respostaRede.status === 200) {
                        const copia = respostaRede.clone();
                        caches.open(VERSAO_CACHE).then((cache) => cache.put(evento.request, copia));
                    }
                    return respostaRede;
                })
                .catch(() => respostaCache); // offline e sem cache: deixa o navegador tratar o erro
        })
    );
});
