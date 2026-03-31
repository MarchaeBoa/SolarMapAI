/* ============================================================
   SOLZINHO — Assistente IA Solar
   Personagem animado + Chat com respostas sobre energia solar
   ============================================================ */

(function() {
  // ══ CREATE HTML ══
  const html = `
  <div class="solzinho-wrap" id="solzinhoWrap">
    <div class="sol-speech" id="solSpeech"></div>
    <div class="sol-chat" id="solChat">
      <div class="sol-chat-header">
        <div class="sol-chat-header-icon">☀</div>
        <div class="sol-chat-header-text">
          <h4>MapSol</h4>
          <span>● Online — Especialista Solar</span>
        </div>
        <button class="sol-chat-close" onclick="solzinho.toggle()">✕</button>
      </div>
      <div class="sol-chat-messages" id="solMessages"></div>
      <div class="sol-chat-input">
        <input type="text" id="solInput" placeholder="Pergunte sobre energia solar..." autocomplete="off">
        <button onclick="solzinho.send()">➤</button>
      </div>
    </div>
    <div class="solzinho idle" id="solChar">
      <div class="sol-rays">
        <div class="sol-ray"></div><div class="sol-ray"></div><div class="sol-ray"></div>
        <div class="sol-ray"></div><div class="sol-ray"></div><div class="sol-ray"></div>
        <div class="sol-ray"></div><div class="sol-ray"></div><div class="sol-ray"></div>
        <div class="sol-ray"></div><div class="sol-ray"></div><div class="sol-ray"></div>
      </div>
      <div class="sol-face">
        <div class="sol-eyes"><div class="sol-eye"></div><div class="sol-eye"></div></div>
        <div class="sol-mouth"></div>
      </div>
      <div class="sol-think-bubbles">
        <div class="sol-bubble"></div><div class="sol-bubble"></div><div class="sol-bubble"></div>
      </div>
      <div class="sol-badge" id="solBadge" style="display:none;">!</div>
    </div>
    <div class="sol-tooltip" id="solTooltip">Olá! Meu nome é MapSol ☀</div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);

  // ══ STATE ══
  const chat = document.getElementById('solChat');
  const messages = document.getElementById('solMessages');
  const input = document.getElementById('solInput');
  const character = document.getElementById('solChar');
  const tooltip = document.getElementById('solTooltip');
  const badge = document.getElementById('solBadge');
  let isOpen = false;
  let hasGreeted = false;

  // ══ REACTIONS ══
  function setState(state, duration) {
    character.className = 'solzinho ' + state;
    if (duration) setTimeout(() => { if (!isOpen) character.className = 'solzinho idle'; }, duration);
  }

  function bounce() {
    character.classList.add('bounce');
    setTimeout(() => character.classList.remove('bounce'), 500);
  }

  // ══ TOGGLE CHAT ══
  function toggle() {
    isOpen = !isOpen;
    chat.classList.toggle('open', isOpen);
    badge.style.display = 'none';
    tooltip.classList.remove('visible');

    if (isOpen) {
      setState('happy', 1500);
      bounce();
      if (!hasGreeted) {
        hasGreeted = true;
        addBotMsg('Olá! Eu sou o MapSol ☀\n\nSou seu assistente especialista em energia solar! Pode me perguntar sobre:\n\n• Custos e economia\n• Tipos de painéis\n• Instalação\n• Financiamento\n• Legislação\n• Manutenção\n\nVamos trabalhar? Como posso te ajudar? 💪');
      }
      setTimeout(() => input.focus(), 300);
    } else {
      setState('idle');
    }
  }

  // ══ SEND MESSAGE ══
  function send() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addUserMsg(text);
    setState('thinking');
    showTyping();

    setTimeout(() => {
      removeTyping();
      const reply = getAnswer(text);
      setState('talking');
      addBotMsg(reply);
      setTimeout(() => {
        setState('happy', 2000);
        bounce();
      }, 500);
    }, 800 + Math.random() * 1200);
  }

  // Enter key
  input.addEventListener('keypress', e => { if (e.key === 'Enter') send(); });

  // ══ MESSAGES ══
  function addBotMsg(text) {
    const div = document.createElement('div');
    div.className = 'sol-msg';
    div.innerHTML = `<div class="sol-msg-avatar bot">☀</div><div class="sol-msg-bubble">${text.replace(/\n/g, '<br>')}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function addUserMsg(text) {
    const div = document.createElement('div');
    div.className = 'sol-msg user';
    div.innerHTML = `<div class="sol-msg-avatar user-av">U</div><div class="sol-msg-bubble">${escHtml(text)}</div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'sol-msg';
    div.id = 'solTyping';
    div.innerHTML = `<div class="sol-msg-avatar bot">☀</div><div class="sol-msg-bubble"><div class="sol-typing"><span></span><span></span><span></span></div></div>`;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function removeTyping() {
    const t = document.getElementById('solTyping');
    if (t) t.remove();
  }

  function escHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ══ KNOWLEDGE BASE ══
  const KB = [
    { keys: ['quanto custa', 'preço', 'valor', 'custo', 'investimento'], answer: 'O investimento em energia solar varia conforme o tamanho do sistema:\n\n• Residencial (3-5 kWp): R$ 15.000 a R$ 30.000\n• Comercial (10-30 kWp): R$ 50.000 a R$ 150.000\n• Industrial (100+ kWp): A partir de R$ 400.000\n\nO payback médio é de 3 a 5 anos, e os painéis duram 25+ anos!' },
    { keys: ['economia', 'economizar', 'conta de luz', 'redução', 'reduzir'], answer: 'Com energia solar você pode reduzir até 95% da sua conta de luz!\n\n• Sistema de 5 kWp economiza ~R$ 500/mês\n• Sistema de 10 kWp economiza ~R$ 1.000/mês\n• Em 25 anos, a economia total pode ultrapassar R$ 200.000!\n\nAlém disso, o imóvel valoriza de 3% a 6% com painéis instalados.' },
    { keys: ['tipo', 'painel', 'monocristalino', 'policristalino', 'bifacial'], answer: 'Existem 3 tipos principais de painéis solares:\n\n☀ Monocristalino — Eficiência de 20-22%. Melhor custo-benefício. O mais usado no Brasil.\n\n☀ Policristalino — Eficiência de 15-17%. Mais barato, mas ocupa mais espaço.\n\n☀ Bifacial — Eficiência de 22-25%. Capta luz dos dois lados. Ideal para terrenos com superfície reflexiva.\n\nRecomendo o monocristalino para residências!' },
    { keys: ['instala', 'demora', 'tempo', 'prazo', 'quanto tempo'], answer: 'O processo completo leva de 30 a 90 dias:\n\n📋 Projeto técnico: 5-10 dias\n🏗️ Instalação física: 1-3 dias\n⚡ Conexão com a rede: 15-45 dias (depende da distribuidora)\n📝 Homologação: 5-15 dias\n\nA instalação em si é rápida — o que demora mais é a aprovação da distribuidora.' },
    { keys: ['financ', 'parcela', 'crédito', 'banco', 'empréstimo'], answer: 'Existem várias linhas de financiamento para energia solar:\n\n🏦 Bancos: BNB (FNE Sol), BB, Caixa, Santander — juros de 0,5% a 1,5% ao mês\n💳 CDC Solar: Parcelas que cabem no bolso, até 120x\n🔄 Leasing: Sem entrada, parcela menor que a economia\n\nDica: Em muitos casos, a parcela do financiamento é MENOR que a economia na conta de luz!' },
    { keys: ['legisla', 'lei', 'marco legal', 'taxação', 'taxa'], answer: 'A legislação solar no Brasil (Marco Legal - Lei 14.300/2022):\n\n✅ Geração distribuída permitida até 5 MW\n✅ Compensação de créditos por 60 meses\n✅ Isenção de ICMS na maioria dos estados\n⚠️ Taxação gradual do "fio B" para novos sistemas (a partir de 2023)\n\nSistemas instalados antes de 2023 têm isenção até 2045!' },
    { keys: ['manuten', 'limpa', 'lavar', 'durabili', 'garantia'], answer: 'A manutenção de painéis solares é simples:\n\n🧹 Limpeza: 2-4 vezes por ano com água e pano macio\n🔍 Inspeção: 1 vez por ano (conexões elétricas)\n💡 Inversor: Trocar a cada 10-15 anos (~R$ 3.000-5.000)\n\nGarantias:\n• Painéis: 25 anos de performance (80% de eficiência)\n• Inversor: 5-12 anos\n• Estrutura: 10-15 anos' },
    { keys: ['noite', 'nublado', 'chuva', 'funciona', 'escuro'], answer: 'Ótima pergunta! Sobre funcionamento em diferentes condições:\n\n🌧️ Dias nublados: Gera 10-30% do normal\n🌙 À noite: Não gera, mas usa créditos acumulados\n☀️ Calor extremo: Painéis perdem ~0,4% por grau acima de 25°C\n❄️ Frio com sol: Melhor eficiência!\n\nO sistema é projetado para a média anual da sua região.' },
    { keys: ['telhado', 'orientação', 'direção', 'norte', 'inclinação'], answer: 'Para melhor aproveitamento solar no Brasil:\n\n🧭 Direção ideal: Face NORTE (capta sol o dia todo)\n📐 Inclinação ideal: Igual à latitude local (ex: SP = 23°)\n📏 Área necessária: ~7m² por kWp instalado\n\nTelhados voltados para Leste/Oeste geram ~15% menos.\nEvite sombras de árvores e prédios!' },
    { keys: ['inversor', 'micro', 'string', 'otimizador'], answer: 'Tipos de inversores:\n\n🔌 String (centralizado): Mais barato, 1 inversor para vários painéis. Bom quando não há sombreamento.\n\n🔌 Microinversor: 1 por painel. Mais caro, mas melhor com sombra parcial. Monitoramento individual.\n\n🔌 Híbrido: Funciona com e sem rede + bateria. Ideal para backup.\n\nPara residências, o string é o mais custo-efetivo!' },
    { keys: ['bateria', 'armazen', 'off-grid', 'independ'], answer: 'Sobre armazenamento de energia:\n\n🔋 On-grid (sem bateria): 90% dos sistemas. Mais barato, usa a rede como "bateria virtual".\n\n🔋 Híbrido (com bateria): Backup para quedas de energia. Bateria de lítio custa R$ 15.000-40.000.\n\n🔋 Off-grid: 100% independente. Precisa de banco de baterias grande. Caro, mas necessário em locais remotos.' },
    { keys: ['kwp', 'kwh', 'watt', 'potência', 'geração'], answer: 'Entendendo as unidades:\n\n⚡ kWp (kilowatt-pico): Potência máxima do sistema. Ex: 5 kWp = ~13 painéis de 400W.\n\n⚡ kWh (kilowatt-hora): Energia gerada. 1 kWp gera ~120-170 kWh/mês dependendo da região.\n\n📊 Para calcular: Sua conta ÷ tarifa = consumo em kWh. Divida pelo fator solar da sua região para achar o kWp necessário.' },
    { keys: ['vantagem', 'benefício', 'vale a pena', 'compensa'], answer: 'Vantagens da energia solar:\n\n✅ Economia de até 95% na conta de luz\n✅ Payback de 3-5 anos\n✅ Valorização do imóvel em 3-6%\n✅ Vida útil de 25+ anos\n✅ Baixa manutenção\n✅ Créditos de carbono\n✅ Proteção contra aumentos da tarifa\n✅ Energia limpa e renovável\n\nDefinitivamente vale a pena! O retorno é garantido.' },
    { keys: ['crédito', 'compensação', 'excedente', 'injetar'], answer: 'O sistema de compensação funciona assim:\n\n☀️ De dia: Seus painéis geram energia. O que sobra vai para a rede.\n🌙 De noite: Você usa energia da rede.\n💰 Balanço: O excedente vira créditos que abatam sua conta por até 60 meses.\n\nVocê só paga a taxa mínima da distribuidora (custo de disponibilidade).' },
    { keys: ['oi', 'olá', 'ola', 'hey', 'bom dia', 'boa tarde', 'boa noite', 'e aí', 'eai'], answer: 'Olá! Que bom ter você aqui! ☀\n\nEu sou o Solzinho, seu assistente especialista em energia solar. Pode me perguntar qualquer coisa sobre:\n\n• Custos e investimento\n• Tipos de painéis\n• Instalação e prazo\n• Financiamento\n• Economia na conta\n• Legislação\n\nComo posso te ajudar hoje?' },
    { keys: ['obrigad', 'valeu', 'thanks', 'agradeç'], answer: 'De nada! Fico feliz em ajudar! ☀\n\nSe tiver mais dúvidas sobre energia solar, estou sempre aqui. Você também pode usar nosso simulador para calcular a economia do seu imóvel!\n\nBom proveito! 🌟' },
  ];

  function getAnswer(question) {
    const q = question.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let bestMatch = null;
    let bestScore = 0;

    for (const item of KB) {
      let score = 0;
      for (const key of item.keys) {
        const k = key.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (q.includes(k)) score += k.length;
      }
      if (score > bestScore) { bestScore = score; bestMatch = item; }
    }

    if (bestMatch && bestScore > 2) return bestMatch.answer;

    // Default response
    const defaults = [
      'Boa pergunta! Sobre energia solar, posso te ajudar com custos, tipos de painéis, instalação, financiamento e legislação. Pode reformular sua dúvida? ☀',
      'Hmm, não tenho certeza sobre isso, mas posso te ajudar com tudo sobre energia solar! Tente perguntar sobre preços, economia, tipos de painel ou instalação. ☀',
      'Interessante! Para te dar a melhor resposta, tente perguntar sobre: custos, economia na conta, tipos de painéis, financiamento ou manutenção. Estou aqui pra ajudar! ☀',
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  // ══ SPEECH BUBBLE ══
  const speech = document.getElementById('solSpeech');
  const PHRASES = [
    'Olá! 👋',
    'Como posso ajudar? ☀',
    'Vamos trabalhar? 💪',
    'Meu nome é MapSol! 🌞',
    'Energia solar é o futuro! ⚡',
    'Clica em mim! 😄',
    'Quer economizar na conta de luz? 💰',
    'Tô aqui pra te ajudar! 🤝',
    'Bora simular? 🚀',
    'Sol tá brilhando! ☀',
  ];
  const FACES = ['happy', 'wink', 'surprised', 'crazy', 'love', 'tongue', 'dizzy', 'angry', 'thinking'];
  let speechTimer, faceTimer, phraseIndex = 0;

  function speak(text, duration) {
    speech.textContent = text;
    speech.classList.add('visible');
    clearTimeout(speechTimer);
    speechTimer = setTimeout(() => speech.classList.remove('visible'), duration || 3000);
  }

  function randomFace() {
    if (isOpen) return;
    const face = FACES[Math.floor(Math.random() * FACES.length)];
    setState(face);
    bounce();
    // Some faces also speak
    if (Math.random() > 0.4) {
      speak(PHRASES[phraseIndex % PHRASES.length]);
      phraseIndex++;
    }
    setTimeout(() => { if (!isOpen) setState('idle'); }, 2500);
  }

  // Random face every 8-15 seconds
  function startRandomFaces() {
    faceTimer = setInterval(() => {
      if (!isOpen && Math.random() > 0.3) randomFace();
    }, 8000 + Math.random() * 7000);
  }
  startRandomFaces();

  // ══ DRAG TO MOVE ══
  const wrap = document.getElementById('solzinhoWrap');
  let isDragging = false, dragStartX, dragStartY, origLeft, origTop, hasMoved;

  character.addEventListener('mousedown', function(e) {
    isDragging = true; hasMoved = false;
    dragStartX = e.clientX; dragStartY = e.clientY;
    const rect = wrap.getBoundingClientRect();
    origLeft = rect.left; origTop = rect.top;
    wrap.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', function(e) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    wrap.style.left = (origLeft + dx) + 'px';
    wrap.style.top = (origTop + dy) + 'px';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
  });

  document.addEventListener('mouseup', function() {
    if (isDragging) {
      isDragging = false;
      wrap.classList.remove('dragging');
      if (!hasMoved) toggle(); // Click without drag = toggle chat
    }
  });

  // Touch drag
  character.addEventListener('touchstart', function(e) {
    isDragging = true; hasMoved = false;
    const t = e.touches[0];
    dragStartX = t.clientX; dragStartY = t.clientY;
    const rect = wrap.getBoundingClientRect();
    origLeft = rect.left; origTop = rect.top;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    if (!isDragging) return;
    const t = e.touches[0];
    const dx = t.clientX - dragStartX;
    const dy = t.clientY - dragStartY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) hasMoved = true;
    wrap.style.left = (origLeft + dx) + 'px';
    wrap.style.top = (origTop + dy) + 'px';
    wrap.style.right = 'auto';
    wrap.style.bottom = 'auto';
  }, { passive: true });

  document.addEventListener('touchend', function() {
    if (isDragging) {
      isDragging = false;
      if (!hasMoved) toggle();
    }
  });

  // ══ INITIAL GREETING ══
  setTimeout(() => {
    speak('Olá! Meu nome é MapSol! ☀', 4000);
    badge.style.display = 'flex';
    bounce();
    setState('happy', 2500);
  }, 2000);

  setTimeout(() => {
    speak('Como posso ajudar? 😊', 3000);
    setState('wink', 2000);
    bounce();
  }, 7000);

  setTimeout(() => {
    speak('Vamos trabalhar? 💪', 3000);
    setState('surprised', 2000);
    bounce();
  }, 12000);

  // ══ SLEEP after inactivity ══
  let sleepTimer;
  function resetSleep() {
    clearTimeout(sleepTimer);
    if (!isOpen) {
      sleepTimer = setTimeout(() => { setState('sleeping'); speak('Zzz... 😴', 2000); }, 60000);
    }
  }
  document.addEventListener('mousemove', resetSleep);
  document.addEventListener('click', resetSleep);
  resetSleep();

  // ══ EXPOSE API ══
  window.solzinho = { toggle, send, setState, bounce, speak, randomFace };
})();
