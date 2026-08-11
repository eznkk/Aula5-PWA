/* =========================================================================
   NEUROBOLINHAS — app.js
   Motor do jogo (bubble shooter) com tema de neuroanatomia, física
   aprimorada (previsão de trajetória, redimensionamento dinâmico),
   e um conjunto amplo de recursos de acessibilidade para idosos.
   ========================================================================= */

/* -------------------------------------------------------------------------
   ÁUDIO: tenta tocar arquivos reais em assets/audio/; se não existirem
   ainda, usa um som sintetizado (Web Audio API) como reserva.
   ------------------------------------------------------------------------- */
const audio = {
    elementos: {
        clique: document.getElementById('som-clique'),
        tiro: document.getElementById('som-tiro'),
        pop: document.getElementById('som-pop'),
        erro: document.getElementById('som-erro'),
        vitoria: document.getElementById('som-vitoria')
    },
    ctx: null,
    initCtx() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    tocar(tipo) {
        if (!a11y.somAtivo) return;
        const el = this.elementos[tipo];
        if (el) {
            try {
                el.currentTime = 0;
                const p = el.play();
                if (p && typeof p.catch === 'function') p.catch(() => this.sintetizar(tipo));
                return;
            } catch (e) { /* segue para o som sintetizado */ }
        }
        this.sintetizar(tipo);
    },
    sintetizar(tipo) {
        try {
            this.initCtx();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            const agora = this.ctx.currentTime;

            if (tipo === 'clique') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(400, agora);
                osc.frequency.exponentialRampToValueAtTime(600, agora + 0.1);
                gain.gain.setValueAtTime(0.1, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.1);
                osc.start(); osc.stop(agora + 0.1);
            } else if (tipo === 'tiro') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(300, agora);
                osc.frequency.linearRampToValueAtTime(100, agora + 0.15);
                gain.gain.setValueAtTime(0.1, agora); gain.gain.linearRampToValueAtTime(0.01, agora + 0.15);
                osc.start(); osc.stop(agora + 0.15);
            } else if (tipo === 'pop') {
                osc.type = 'square'; osc.frequency.setValueAtTime(400, agora);
                osc.frequency.exponentialRampToValueAtTime(800, agora + 0.1);
                gain.gain.setValueAtTime(0.05, agora); gain.gain.exponentialRampToValueAtTime(0.01, agora + 0.1);
                osc.start(); osc.stop(agora + 0.1);
            } else if (tipo === 'erro') {
                osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, agora);
                osc.frequency.linearRampToValueAtTime(100, agora + 0.3);
                gain.gain.setValueAtTime(0.1, agora); gain.gain.linearRampToValueAtTime(0.01, agora + 0.3);
                osc.start(); osc.stop(agora + 0.3);
            } else if (tipo === 'vitoria') {
                osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, agora);
                osc.frequency.setValueAtTime(659.25, agora + 0.1);
                gain.gain.setValueAtTime(0.1, agora); gain.gain.linearRampToValueAtTime(0.01, agora + 0.3);
                osc.start(); osc.stop(agora + 0.3);
            }
        } catch (e) { console.warn('Áudio não suportado neste dispositivo.'); }
    }
};

/* -------------------------------------------------------------------------
   ACESSIBILIDADE: fonte, contraste, som, narração por voz e movimento.
   ------------------------------------------------------------------------- */
const a11y = {
    fatorFonte: 1, somAtivo: true, vozAtiva: true, semMovimento: false,

    init() {
        const salvoFonte = parseFloat(localStorage.getItem('neuro_fatorFonte'));
        if (!isNaN(salvoFonte)) { this.fatorFonte = salvoFonte; this.aplicarFonte(); }

        if (localStorage.getItem('neuro_som') === 'false') this.alternarSom(true);
        if (localStorage.getItem('neuro_voz') === 'false') this.alternarVoz(true);
        if (localStorage.getItem('neuro_tema') === 'escuro') this.alternarTema(true);

        const prefereReduzido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (localStorage.getItem('neuro_semMovimento') === 'true' || prefereReduzido) {
            this.alternarMovimento(true);
        }
    },

    falar(texto) {
        if (!this.vozAtiva || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance(texto);
        msg.lang = 'pt-BR'; msg.rate = 0.9; msg.pitch = 1;
        window.speechSynthesis.speak(msg);
    },

    anunciar(texto) {
        const regiao = document.getElementById('regiao-anuncios');
        if (regiao) regiao.textContent = texto;
    },

    aplicarFonte() {
        document.documentElement.style.setProperty('--fator-usuario', this.fatorFonte);
    },

    mudarFonte(valor) {
        this.fatorFonte = Math.max(0.8, Math.min(1.6, this.fatorFonte + valor));
        this.aplicarFonte();
        localStorage.setItem('neuro_fatorFonte', this.fatorFonte);
        audio.tocar('clique');
    },

    alternarTema(silencioso = false) {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('neuro_tema', document.body.classList.contains('dark-mode') ? 'escuro' : 'claro');
        if (!silencioso) { audio.tocar('clique'); this.falar('Contraste alterado.'); }
    },

    alternarSom(silencioso = false) {
        this.somAtivo = !this.somAtivo;
        const btn = document.getElementById('btn-som');
        btn.innerText = this.somAtivo ? '🔊' : '🔇';
        btn.setAttribute('aria-pressed', String(this.somAtivo));
        localStorage.setItem('neuro_som', this.somAtivo);
        if (!silencioso) { audio.tocar('clique'); this.falar(this.somAtivo ? 'Som ligado' : 'Som desligado'); }
    },

    alternarVoz(silencioso = false) {
        this.vozAtiva = !this.vozAtiva;
        const btn = document.getElementById('btn-voz');
        btn.innerText = this.vozAtiva ? '🗣️' : '🤫';
        btn.setAttribute('aria-pressed', String(this.vozAtiva));
        localStorage.setItem('neuro_voz', this.vozAtiva);
        if (!silencioso) { audio.tocar('clique'); if (this.vozAtiva) this.falar('Voz ativada'); }
    },

    alternarMovimento(silencioso = false) {
        this.semMovimento = !this.semMovimento;
        document.body.classList.toggle('sem-movimento', this.semMovimento);
        document.getElementById('btn-movimento').setAttribute('aria-pressed', String(this.semMovimento));
        localStorage.setItem('neuro_semMovimento', this.semMovimento);
        if (!silencioso) { audio.tocar('clique'); this.falar(this.semMovimento ? 'Animações reduzidas' : 'Animações normais'); }
    }
};

/* -------------------------------------------------------------------------
   INTERFACE: abertura/fechamento de modais com proteção contra toque duplo.
   ------------------------------------------------------------------------- */
const ui = {
    isClicking: false,
    debounce() {
        if (this.isClicking) return true;
        this.isClicking = true;
        setTimeout(() => this.isClicking = false, 350);
        return false;
    },
    abrirModal(id) {
        if (this.debounce()) return;
        document.getElementById(id).style.display = 'flex';
        audio.tocar('clique');
    },
    fecharModal(id) {
        if (this.debounce()) return;
        document.getElementById(id).style.display = 'none';
        audio.tocar('clique');
    }
};

/* =========================================================================
   MOTOR DO JOGO
   ========================================================================= */
const jogo = {
    area: null, container: null, bolhaTiro: null, slotProxima: null,
    linha: null, tetoEl: null, telaJogo: null, camadaTrajetoria: null,

    REGIOES: [
        { id: 'frontal', nome: 'Lobo Frontal', cor: 'var(--cor-frontal)', icone: '★', desc: 'Planejamento, decisões e controle dos movimentos voluntários.' },
        { id: 'parietal', nome: 'Lobo Parietal', cor: 'var(--cor-parietal)', icone: '▲', desc: 'Sensações do corpo, tato e noção de espaço.' },
        { id: 'temporal', nome: 'Lobo Temporal', cor: 'var(--cor-temporal)', icone: '●', desc: 'Memória, audição e compreensão da fala.' },
        { id: 'occipital', nome: 'Lobo Occipital', cor: 'var(--cor-occipital)', icone: '✦', desc: 'Processamento das imagens que os olhos captam.' },
        { id: 'cerebelo', nome: 'Cerebelo', cor: 'var(--cor-cerebelo)', icone: '■', desc: 'Equilíbrio, postura e coordenação dos movimentos.' },
        { id: 'tronco', nome: 'Tronco Encefálico', cor: 'var(--cor-tronco)', icone: '✚', desc: 'Funções vitais, como respiração e batimentos do coração.' }
    ],

    NUM_COLS: 11, diametro: 0, raio: 0, offset: 0,
    grade: {}, pontos: 0, estado: 'parado', estadoAnterior: null,
    tAtual: null, tProximo: null,
    pX: 0, pY: 0, vX: 0, vY: 0, anguloAtual: 0, anim: null,
    tetoY: 0, erros: 0, MAX_ERROS: 5, ultAngulo: 0,
    modoLento: false, controleSimples: false, nivelAnterior: 1,
    _resizeTimer: null,

    recorde: parseInt(localStorage.getItem('neuro_recorde') || '0'),
    partidas: parseInt(localStorage.getItem('neuro_partidas') || '0'),

    init() {
        this.area = document.getElementById('area-jogo');
        this.container = document.getElementById('grade-bolhas');
        this.bolhaTiro = document.getElementById('bolha-carregada');
        this.slotProxima = document.getElementById('proxima-bolha-slot');
        this.linha = document.getElementById('linha-mira');
        this.tetoEl = document.getElementById('teto');
        this.telaJogo = document.getElementById('tela-jogo');
        this.camadaTrajetoria = document.getElementById('pontos-trajetoria');

        document.getElementById('stat-recorde').innerText = this.recorde;
        document.getElementById('stat-partidas').innerText = this.partidas;

        this.modoLento = localStorage.getItem('neuro_modoLento') === 'true';
        this.controleSimples = localStorage.getItem('neuro_controleSimples') === 'true';
        this.atualizarBotoesOpcoes();
        this.popularGuiaRegioes();

        if (this.area) {
            this.area.addEventListener('mousedown', (e) => this.mirarInic(e));
            this.area.addEventListener('touchstart', (e) => this.mirarInic(e.touches[0]), { passive: true });
        }
        window.addEventListener('mousemove', (e) => this.mirarMov(e));
        window.addEventListener('touchmove', (e) => this.mirarMov(e.touches[0]), { passive: false });
        window.addEventListener('mouseup', () => this.atirar());
        window.addEventListener('touchend', () => this.atirar());

        window.addEventListener('resize', () => this.agendarRecalculo());
        window.addEventListener('orientationchange', () => this.agendarRecalculo());
        window.addEventListener('keydown', (e) => this.teclado(e));
    },

    teclado(e) {
        if (!this.telaJogo.classList.contains('ativa')) return;
        if (e.key === 'ArrowLeft') { this.ajustarAnguloBotao(-5); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { this.ajustarAnguloBotao(5); e.preventDefault(); }
        else if (e.key === ' ' || e.key === 'Enter') { this.atirarBotao(); e.preventDefault(); }
        else if (e.key === 'Escape') { if (this.estado !== 'pausado') this.pausar(); }
    },

    popularGuiaRegioes() {
        const lista = document.getElementById('lista-regioes');
        lista.innerHTML = '';
        this.REGIOES.forEach(r => {
            const item = document.createElement('div');
            item.className = 'regiao-item';
            item.innerHTML = `
                <div class="regiao-icone" style="background:${r.cor};">${r.icone}</div>
                <div class="regiao-texto"><strong>${r.nome}</strong>${r.desc}</div>
                <button class="btn icon" aria-label="Ouvir descrição de ${r.nome}">🔊</button>
            `;
            item.querySelector('button').addEventListener('click', () => a11y.falar(`${r.nome}. ${r.desc}`));
            lista.appendChild(item);
        });
    },

    /* ---------------- Ciclo de vida da partida ---------------- */

    iniciar() {
        if (ui.debounce()) return;
        audio.initCtx();

        document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
        this.telaJogo.classList.add('ativa');
        this.telaJogo.classList.add('jogando');
        document.getElementById('btn-voltar').style.display = 'flex';

        a11y.falar('Treino iniciado! Mire e atire.');
        audio.tocar('vitoria');

        this.pontos = 0; this.tetoY = 0; this.erros = 0; this.nivelAnterior = 1;
        document.getElementById('pontos-valor').innerText = this.pontos;
        document.getElementById('nivel-valor').innerText = '1';
        this.tetoEl.style.height = '0px';
        this.atualizaTiros();

        this.grade = {}; this.container.innerHTML = '';

        this.diametro = this.area.clientWidth / this.NUM_COLS;
        this.raio = this.diametro / 2;
        this.offset = this.diametro * 0.866;

        this.gerarNovasLinhas(3);

        const tipos = this.tiposAtivos();
        this.tProximo = tipos[Math.floor(Math.random() * tipos.length)];
        this.recarregar();

        this.partidas++; localStorage.setItem('neuro_partidas', this.partidas);
        document.getElementById('stat-partidas').innerText = this.partidas;

        this.aplicarModoControle();
    },

    voltarInicio() {
        document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
        document.getElementById('tela-inicio').classList.add('ativa');
        this.telaJogo.classList.remove('jogando');
        document.getElementById('btn-voltar').style.display = 'none';
        cancelAnimationFrame(this.anim);
        this.estado = 'parado';
        a11y.falar('Menu principal.');
    },

    pausar() {
        if (this.estado === 'pausado' || this.estado === 'parado' && !this.telaJogo.classList.contains('jogando')) return;
        this.estadoAnterior = this.estado;
        this.estado = 'pausado';
        cancelAnimationFrame(this.anim);
        this.linha.style.opacity = '0';
        this.limparTrajetoria();
        ui.abrirModal('modal-pausa');
        a11y.falar('Jogo pausado.');
    },

    continuar() {
        ui.fecharModal('modal-pausa');
        this.estado = this.estadoAnterior || 'parado';
        if (this.estado === 'atirando') {
            this.anim = requestAnimationFrame(() => this.fisica());
        }
        a11y.falar('Jogo retomado.');
    },

    /* ---------------- Opções ---------------- */

    alternarModoLento() {
        this.modoLento = !this.modoLento;
        localStorage.setItem('neuro_modoLento', this.modoLento);
        this.atualizarBotoesOpcoes();
        audio.tocar('clique');
        a11y.falar(this.modoLento ? 'Velocidade reduzida ativada' : 'Velocidade reduzida desativada');
    },

    alternarControleSimples() {
        this.controleSimples = !this.controleSimples;
        localStorage.setItem('neuro_controleSimples', this.controleSimples);
        this.atualizarBotoesOpcoes();
        this.aplicarModoControle();
        audio.tocar('clique');
        a11y.falar(this.controleSimples ? 'Controles por botão ativados' : 'Controles por arraste ativados');
    },

    atualizarBotoesOpcoes() {
        const bLento = document.getElementById('btn-modo-lento');
        const bSimples = document.getElementById('btn-controle-simples');
        bLento.innerText = this.modoLento ? 'Ligado' : 'Desligado';
        bLento.setAttribute('aria-pressed', String(this.modoLento));
        bSimples.innerText = this.controleSimples ? 'Ligado' : 'Desligado';
        bSimples.setAttribute('aria-pressed', String(this.controleSimples));
    },

    aplicarModoControle() {
        document.getElementById('controles-simples').classList.toggle('oculto', !this.controleSimples);
    },

    /* ---------------- Dificuldade progressiva & Respawn ---------------- */

    tiposAtivos() {
        const n = Math.min(this.REGIOES.length, 3 + Math.floor(this.pontos / 150));
        return this.REGIOES.slice(0, n);
    },

    atualizarNivel() {
        const nivel = this.tiposAtivos().length - 2;
        document.getElementById('nivel-valor').innerText = nivel;
        if (nivel > this.nivelAnterior) {
            const novaRegiao = this.REGIOES[this.tiposAtivos().length - 1];
            this.nivelAnterior = nivel;
            a11y.falar(`Nível ${nivel}! Nova região liberada: ${novaRegiao.nome}.`);
            a11y.anunciar(`Nível ${nivel} alcançado. Região ${novaRegiao.nome} liberada.`);

            // Injeta uma nova linha no topo contendo a nova cor liberada
            this.adicionarLinhaTopo();
        }
    },

    /* Gera uma nova grade inicial ou repovoa a tela quando limpa */
    gerarNovasLinhas(qtd = 3) {
        const tipos = this.tiposAtivos();
        for (let r = 0; r < qtd; r++) {
            let cols = (r % 2 === 0) ? this.NUM_COLS : this.NUM_COLS - 1;
            for (let c = 0; c < cols; c++) {
                this.addBolha(r, c, tipos[Math.floor(Math.random() * tipos.length)]);
            }
        }
    },

    /* Desce a grade existente e insere uma nova linha superior (respawn ao subir nivel) */
    adicionarLinhaTopo() {
        if (Object.keys(this.grade).length === 0) {
            this.gerarNovasLinhas(3);
            return;
        }

        let novaGrade = {};
        this.container.innerHTML = ''; // Reorganiza elementos na DOM

        for (let k in this.grade) {
            let b = this.grade[k];
            let novoR = b.r + 1;
            novaGrade[`${novoR},${b.c}`] = b;
            b.r = novoR;
        }

        this.grade = novaGrade;

        // Reposiciona as bolhas existentes
        for (let k in this.grade) {
            let b = this.grade[k];
            let pos = this.getXY(b.r, b.c);
            b.x = pos.x; b.y = pos.y;
            b.el.style.left = b.x + 'px';
            b.el.style.top = b.y + 'px';
            this.container.appendChild(b.el);
        }

        // Adiciona a nova linha no topo (linha r = 0)
        const tipos = this.tiposAtivos();
        for (let c = 0; c < this.NUM_COLS; c++) {
            this.addBolha(0, c, tipos[Math.floor(Math.random() * tipos.length)]);
        }
    },

    /* ---------------- Geometria da grade hexagonal ---------------- */

    getXY(r, c) {
        return { x: c * this.diametro + (r % 2 === 1 ? this.raio : 0), y: this.tetoY + (r * this.offset) };
    },

    addBolha(r, c, tipo) {
        let pos = this.getXY(r, c);
        let el = document.createElement('div'); el.className = 'bolha';
        el.style.width = this.diametro + 'px'; el.style.height = this.diametro + 'px';
        el.style.background = tipo.cor; el.innerText = tipo.icone;
        el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px';
        this.container.appendChild(el);
        this.grade[`${r},${c}`] = { el, tipo, r, c, x: pos.x, y: pos.y };
    },

    recarregar() {
        this.tAtual = this.tProximo;
        const tipos = this.tiposAtivos();
        this.tProximo = tipos[Math.floor(Math.random() * tipos.length)];

        this.slotProxima.innerHTML = `<div class="bolha" style="width:100%;height:100%;background:${this.tProximo.cor};border:none;box-shadow:none;">${this.tProximo.icone}</div>`;

        this.bolhaTiro.style.width = this.diametro + 'px'; this.bolhaTiro.style.height = this.diametro + 'px';
        this.bolhaTiro.style.background = this.tAtual.cor; this.bolhaTiro.innerText = this.tAtual.icone;

        this.pX = (this.area.clientWidth / 2) - this.raio;
        this.pY = this.area.clientHeight - 120 - this.diametro;

        this.bolhaTiro.style.left = this.pX + 'px'; this.bolhaTiro.style.top = this.pY + 'px';
        this.bolhaTiro.style.display = 'flex';
        this.estado = 'parado';
        this.anguloAtual = 0;
        this.atualizarSpriteAtirador(0);
    },

    atualizaTiros() {
        document.getElementById('tiros-restantes').innerText = this.MAX_ERROS - this.erros;
    },

    /* ---------------- Redimensionamento dinâmico ---------------- */

    agendarRecalculo() {
        clearTimeout(this._resizeTimer);
        this._resizeTimer = setTimeout(() => this.recalcularLayout(), 150);
    },

    recalcularLayout() {
        if (!this.diametro || !this.telaJogo.classList.contains('jogando')) return;
        const novoDiametro = this.area.clientWidth / this.NUM_COLS;
        if (!novoDiametro || Math.abs(novoDiametro - this.diametro) < 0.5) return;

        this.diametro = novoDiametro; this.raio = this.diametro / 2; this.offset = this.diametro * 0.866;

        for (let k in this.grade) {
            let b = this.grade[k];
            let p = this.getXY(b.r, b.c);
            b.x = p.x; b.y = p.y;
            b.el.style.width = this.diametro + 'px'; b.el.style.height = this.diametro + 'px';
            b.el.style.left = b.x + 'px'; b.el.style.top = b.y + 'px';
        }

        if (this.estado === 'parado' || this.estado === 'mirando') {
            this.pX = (this.area.clientWidth / 2) - this.raio;
            this.pY = this.area.clientHeight - 120 - this.diametro;
            this.bolhaTiro.style.left = this.pX + 'px'; this.bolhaTiro.style.top = this.pY + 'px';
        }
        this.bolhaTiro.style.width = this.diametro + 'px'; this.bolhaTiro.style.height = this.diametro + 'px';
    },

    /* ---------------- Mira e Controle do Sprite do Canhão ---------------- */

    mirarInic(e) {
        if (this.estado !== 'parado') return;
        this.estado = 'mirando';
        this.linha.style.opacity = '1';
        this.linha.style.left = (this.area.clientWidth / 2 - 3) + 'px';
        this.linha.style.bottom = (this.area.clientHeight - this.pY - this.raio) + 'px';
        this.mirarMov(e);
    },

    mirarMov(e) {
        if (this.estado !== 'mirando') return;
        if (e.cancelable) e.preventDefault();

        let rect = this.area.getBoundingClientRect();
        let mx = (e.clientX !== undefined ? e.clientX : e.touches[0].clientX) - rect.left;
        let my = (e.clientY !== undefined ? e.clientY : e.touches[0].clientY) - rect.top;

        let dx = mx - (this.pX + this.raio);
        let dy = my - (this.pY + this.raio);
        let ang = Math.atan2(dx, -dy) * 180 / Math.PI;

        ang = (this.ultAngulo * 0.6) + (ang * 0.4);
        this.ultAngulo = ang;

        this.atualizarMira(ang);
    },

    ajustarAnguloBotao(delta) {
        if (this.estado === 'parado') this.iniciarMiraPorBotao();
        if (this.estado !== 'mirando') return;
        this.ultAngulo = this.anguloAtual;
        this.atualizarMira(this.anguloAtual + delta);
        audio.tocar('clique');
    },

    iniciarMiraPorBotao() {
        this.estado = 'mirando';
        this.linha.style.opacity = '1';
        this.linha.style.left = (this.area.clientWidth / 2 - 3) + 'px';
        this.linha.style.bottom = (this.area.clientHeight - this.pY - this.raio) + 'px';
        this.atualizarMira(this.anguloAtual);
    },

    atirarBotao() {
        if (this.estado === 'parado') this.iniciarMiraPorBotao();
        this.atirar();
    },

    atualizarMira(ang) {
        if (ang > 75) ang = 75; if (ang < -75) ang = -75;
        this.anguloAtual = ang;

        this.linha.style.transform = `rotate(${ang}deg)`;
        this.linha.style.height = '1000px';

        let rad = (ang - 90) * Math.PI / 180;
        const velBase = this.diametro * (this.modoLento ? 0.36 : 0.62);
        this.vX = Math.cos(rad) * velBase; this.vY = Math.sin(rad) * velBase;

        this.desenharTrajetoria();
        this.atualizarSpriteAtirador(ang);
    },

    /* Atualiza o quadro da imagem do sprite-atirador.png (6 quadros de 400px cada) */
atualizarSpriteAtirador(ang) {
    const sprite = document.getElementById('atirador-sprite');
    if (!sprite) return;

    let posX = 0; // Coluna (X)
    let posY = 0; // Linha (Y)

    if (ang > 40) {
        // Direita Extrema -> Linha 1, Coluna 3
        posX = -200;
        posY = 0;
    } else if (ang > 10) {
        // Direita Moderada -> Linha 1, Coluna 2
        posX = -100;
        posY = 0;
    } else if (ang < -40) {
        // Esquerda Extrema -> Linha 2, Coluna 1
        posX = 0;
        posY = -100;
    } else if (ang < -10) {
        // Esquerda Moderada -> Linha 2, Coluna 3
        posX = -200;
        posY = -100;
    } else {
        // Centro (Frente) -> Linha 1, Coluna 1
        posX = 0;
        posY = 0;
    }

    sprite.style.backgroundPosition = `${posX}px ${posY}px`;
},

    /* ---------------- Previsão de trajetória ---------------- */

    calcularTrajetoria() {
        let px = this.pX, py = this.pY, vx = this.vX, vy = this.vY;
        const pontos = [];
        for (let i = 0; i < 90; i++) {
            px += vx; py += vy;

            if (px <= 0) { px = 0; vx *= -1; }
            else if (px + this.diametro >= this.area.clientWidth) { px = this.area.clientWidth - this.diametro; vx *= -1; }

            let bateu = false;
            if (py <= this.tetoY) { py = this.tetoY; bateu = true; }
            else {
                let cx = px + this.raio, cy = py + this.raio;
                for (let key in this.grade) {
                    let b = this.grade[key];
                    let dx = cx - (b.x + this.raio), dy = cy - (b.y + this.raio);
                    if (Math.sqrt(dx * dx + dy * dy) < this.diametro * 0.85) { bateu = true; break; }
                }
            }
            if (i % 3 === 0) pontos.push({ x: px + this.raio, y: py + this.raio });
            if (bateu) break;
        }
        return pontos;
    },

    desenharTrajetoria() {
        const pontos = this.calcularTrajetoria();
        this.camadaTrajetoria.innerHTML = '';
        const frag = document.createDocumentFragment();
        pontos.forEach(p => {
            const d = document.createElement('div');
            d.className = 'ponto-trajetoria';
            d.style.left = (p.x - 4) + 'px'; d.style.top = (p.y - 4) + 'px';
            frag.appendChild(d);
        });
        this.camadaTrajetoria.appendChild(frag);
    },

    limparTrajetoria() {
        this.camadaTrajetoria.innerHTML = '';
    },

    /* ---------------- Disparo e física ---------------- */

    atirar() {
        if (this.estado === 'parado') {
            this.iniciarMiraPorBotao();
        }
        if (this.estado !== 'mirando') return;

        this.estado = 'atirando';
        this.linha.style.opacity = '0';
        this.limparTrajetoria();
        audio.tocar('tiro');
        this.anim = requestAnimationFrame(() => this.fisica());
    },

    fisica() {
        if (this.estado !== 'atirando') return;

        this.pX += this.vX; this.pY += this.vY;

        if (this.pX <= 0) { this.pX = 0; this.vX *= -1; }
        else if (this.pX + this.diametro >= this.area.clientWidth) {
            this.pX = this.area.clientWidth - this.diametro; this.vX *= -1;
        }

        this.bolhaTiro.style.left = this.pX + 'px'; this.bolhaTiro.style.top = this.pY + 'px';

        let bateu = false;
        if (this.pY <= this.tetoY) {
            this.pY = this.tetoY; bateu = true;
        } else {
            let cx = this.pX + this.raio; let cy = this.pY + this.raio;
            for (let key in this.grade) {
                let b = this.grade[key];
                let dx = cx - (b.x + this.raio); let dy = cy - (b.y + this.raio);
                if (Math.sqrt(dx * dx + dy * dy) < this.diametro * 0.85) { bateu = true; break; }
            }
        }

        if (bateu) this.colisao(this.pX, this.pY);
        else this.anim = requestAnimationFrame(() => this.fisica());
    },

    colisao(px, py) {
        let mR = 0, mC = 0, mD = Infinity;
        let yV = py - this.tetoY;
        let bR = Math.round(yV / this.offset);

        for (let r = bR - 1; r <= bR + 1; r++) {
            if (r < 0) continue;
            let cols = (r % 2 === 0) ? this.NUM_COLS : this.NUM_COLS - 1;
            for (let c = 0; c < cols; c++) {
                if (!this.grade[`${r},${c}`]) {
                    let pos = this.getXY(r, c);
                    let d = Math.sqrt(Math.pow(pos.x - px, 2) + Math.pow(pos.y - py, 2));
                    if (d < mD) { mD = d; mR = r; mC = c; }
                }
            }
        }

        this.bolhaTiro.style.display = 'none';
        this.addBolha(mR, mC, this.tAtual);
        this.checarComb(mR, mC, this.tAtual);
    },

    getVizinhos(r, c) {
        let p = (r % 2 === 0);
        return [
            { r: r, c: c - 1 }, { r: r, c: c + 1 },
            { r: r - 1, c: p ? c - 1 : c }, { r: r - 1, c: p ? c : c + 1 },
            { r: r + 1, c: p ? c - 1 : c }, { r: r + 1, c: p ? c : c + 1 }
        ];
    },

    desenharFaiscas(grupo) {
        if (a11y.semMovimento || grupo.length < 2) return;
        for (let i = 0; i < grupo.length - 1; i++) {
            const a = grupo[i], b = grupo[i + 1];
            const x1 = a.x + this.raio, y1 = a.y + this.raio;
            const x2 = b.x + this.raio, y2 = b.y + this.raio;
            const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
            const ang = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

            const faisca = document.createElement('div');
            faisca.className = 'faisca-sinapse';
            faisca.style.left = x1 + 'px'; faisca.style.top = y1 + 'px';
            faisca.style.width = dist + 'px';
            faisca.style.transform = `rotate(${ang}deg)`;
            this.container.appendChild(faisca);
            setTimeout(() => faisca.remove(), 320);
        }
    },

    checarComb(row, col, tipo) {
        let fila = [{ r: row, c: col }], vis = new Set(), grupo = [];

        while (fila.length > 0) {
            let a = fila.pop(), k = `${a.r},${a.c}`;
            if (vis.has(k)) continue; vis.add(k);

            if (this.grade[k] && this.grade[k].tipo.id === tipo.id) {
                grupo.push(this.grade[k]);
                this.getVizinhos(a.r, a.c).forEach(v => fila.push(v));
            }
        }

        if (grupo.length >= 3) {
            this.pontos += grupo.length * 10; this.erros = 0;
            audio.tocar('pop');
            this.desenharFaiscas(grupo);
            a11y.falar(`${tipo.nome} conectado! Mais ${grupo.length * 10} pontos.`);
            a11y.anunciar(`${grupo.length} bolinhas de ${tipo.nome} estouradas. Pontuação: ${this.pontos}.`);
            grupo.forEach(b => {
                b.el.classList.add('estourando');
                delete this.grade[`${b.r},${b.c}`];
                setTimeout(() => b.el.remove(), 220);
            });
            setTimeout(() => this.limparSoltas(), 260);
        } else {
            this.erros++; audio.tocar('erro');
            if (this.erros >= this.MAX_ERROS) this.descer();
            else this.verifFim();
        }
        document.getElementById('pontos-valor').innerText = this.pontos;
        this.atualizaTiros();
        this.atualizarNivel();
    },

    limparSoltas() {
        let presas = new Set(), fila = [];
        for (let c = 0; c < this.NUM_COLS; c++) { if (this.grade[`0,${c}`]) fila.push({ r: 0, c: c }); }

        while (fila.length > 0) {
            let a = fila.pop(), k = `${a.r},${a.c}`;
            if (presas.has(k)) continue; presas.add(k);

            this.getVizinhos(a.r, a.c).forEach(v => {
                let vk = `${v.r},${v.c}`;
                if (this.grade[vk] && !presas.has(vk)) fila.push(v);
            });
        }

        let caiu = false;
        for (let k in this.grade) {
            if (!presas.has(k)) {
                let b = this.grade[k];
                b.el.style.transition = 'top 0.5s ease-in, opacity 0.5s';
                b.el.style.top = (this.area.clientHeight + 100) + 'px';
                b.el.style.opacity = '0';
                delete this.grade[k];
                setTimeout(() => b.el.remove(), 500);
                this.pontos += 15; caiu = true;
            }
        }
        if (caiu) { document.getElementById('pontos-valor').innerText = this.pontos; audio.tocar('pop'); }
        this.verifFim();
    },

    descer() {
        this.erros = 0; this.tetoY += this.offset;
        this.tetoEl.style.height = this.tetoY + 'px';

        for (let k in this.grade) {
            let b = this.grade[k], p = this.getXY(b.r, b.c);
            b.x = p.x; b.y = p.y; b.el.style.top = b.y + 'px';
        }
        audio.tocar('erro');
        a11y.anunciar('O teto desceu. Cuidado!');
        setTimeout(() => this.verifFim(), 300);
    },

    verifFim() {
        // Se todas as bolinhas foram limpas, repovoa o campo
        if (Object.keys(this.grade).length === 0) {
            this.gerarNovasLinhas(3);
            this.recarregar();
            return;
        }

        let lim = this.area.clientHeight - 150;
        for (let k in this.grade) {
            if (this.grade[k].y > lim) { this.fim(); return; }
        }
        this.recarregar();
    },

    fim() {
        document.getElementById('pontuacao-final').innerText = this.pontos;
        document.getElementById('btn-voltar').style.display = 'none';
        this.telaJogo.classList.remove('jogando');

        if (this.pontos > this.recorde) {
            this.recorde = this.pontos;
            localStorage.setItem('neuro_recorde', this.recorde);
            document.getElementById('stat-recorde').innerText = this.recorde;
        }

        let m = (this.pontos < 100) ? 'Bom aquecimento. Continue praticando!' : 'Excelente! Ótimos reflexos e memória.';
        document.getElementById('msg-neuro').innerText = m;

        audio.tocar('vitoria');
        a11y.falar(`Treino concluído. ${m} Você fez ${this.pontos} pontos.`);
        ui.abrirModal('modal-fim');
    }
};

/* -------------------------------------------------------------------------
   INICIALIZAÇÃO E PWA
   ------------------------------------------------------------------------- */
window.onload = () => {
    a11y.init();
    jogo.init();

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {
            console.warn('Não foi possível registrar o service worker (modo offline indisponível).');
        });
    }
};