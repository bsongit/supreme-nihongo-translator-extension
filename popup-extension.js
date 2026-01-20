(function() {
    // Previne múltiplas inicializações se o script for injetado mais de uma vez
    if (window.NihongoExtensionController) return;

    class NihongoExtensionController {
        constructor() {
            this.isActive = true; // Estado inicial: ativado
            this.dataset = null;
            this.popup = null;
            this.toast = null;
            
            // Serviços
            this.dictionaryService = null;
            this.grammarScanner = null;
            this.katakanaChecker = null;
            this.speaker = null;
            this.currentData = { kanji: [], grammar: [], katakana: [] };

            this.init();
        }

        async init() {
            try {
                // Carrega o dataset do arquivo local da extensão
                const dataUrl = chrome.runtime.getURL('nerver_read_files_here/main_dataset.json');
                const response = await fetch(dataUrl);
                this.dataset = await response.json();

                // Inicializa os serviços com as classes existentes
                this.dictionaryService = new DictionaryService(this.dataset);
                this.grammarScanner = new JapaneseGrammarScanner();
                this.katakanaChecker = new KatakanaChecker();
                // Tenta usar a instância global criada pelo speaker.js ou cria uma nova
                this.speaker = window.reader || new JapaneseTextReader();

                this.createDOM();
                this.setupEventListeners();

                console.log("Nihongo Extension carregada. Pressione Ctrl+Alt+V para ativar.");
            } catch (error) {
                console.error("Erro ao inicializar Nihongo Extension:", error);
                alert("Nihongo Extension: Erro fatal ao carregar dados. Verifique o console (F12) para detalhes.");
            }
        }

        createDOM() {
            // Cria o elemento do Popup (inicialmente oculto)
            this.popup = document.createElement('div');
            this.popup.id = 'nihongo-translator-popup';
            // Estilos inline para garantir isolamento e aparência
            this.popup.style.cssText = `
                position: absolute;
                z-index: 2147483647;
                background: #ffffff;
                border: none;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                padding: 20px;
                border-radius: 0;
                width: 420px;
                height: 500px;
                overflow-y: auto;
                font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                display: none;
                text-align: left;
            `;
            document.body.appendChild(this.popup);

            // Cria um Toast para avisar quando ativa/desativa
            this.toast = document.createElement('div');
            this.toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 2147483647;
                background: #333;
                color: white;
                padding: 10px 20px;
                border-radius: 4px;
                opacity: 0;
                transition: opacity 0.3s;
                pointer-events: none;
                font-family: sans-serif;
            `;
            document.body.appendChild(this.toast);
        }

        setupEventListeners() {
            // Atalho de Teclado: Ctrl + Alt + V
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.altKey && e.key.toLowerCase() === 'v') {
                    this.toggleActiveState();
                }
            });

            // Seleção de Texto
            document.addEventListener('mouseup', (e) => {
                if (!this.isActive) return;
                
                // Evita fechar/reabrir se clicar dentro do próprio popup
                if (this.popup.contains(e.target)) return;

                this.handleSelection();
            });

            // Fechar popup ao clicar fora
            document.addEventListener('mousedown', (e) => {
                if (this.popup.style.display !== 'none' && !this.popup.contains(e.target)) {
                    this.popup.style.display = 'none';
                    this.speaker.stopReading();
                }
            });

            // Event Delegation para interatividade do texto (Display Text)
            this.popup.addEventListener('mouseover', (e) => {
                // Se houver texto selecionado no popup, evita sobrescrever a info box com o hover
                const selection = window.getSelection();
                if (selection.toString().length > 0 && selection.anchorNode && this.popup.contains(selection.anchorNode)) {
                    return;
                }

                const target = e.target.closest('.interactive-segment');
                const infoBox = document.getElementById('nihongo-info-box');
                
                if (target && infoBox) {
                    const type = target.dataset.type;
                    const index = parseInt(target.dataset.index);
                    let content = '';

                    if (type === 'kanji') {
                        const data = this.currentData.kanji[index];
                        const char = data.char || '?';
                        const reading = data.on ? data.on.join(', ') : (data.kun ? data.kun.join(', ') : '');
                        const meaning = data.description || '';
                        content = `
                            <div style="color: #e91e63; font-weight: bold; font-size: 1.5em; margin-bottom: 5px;">Kanji: ${char}</div>
                            <div style="font-weight: bold; font-size: 1.1em; margin-bottom: 5px;">${meaning}</div>
                            <div style="color: #555; margin-bottom: 5px;">${reading}</div>
                            <div style="font-size: 0.85em; color: #888;">JLPT N${data.jlpt || '-'} | Traços: ${data.strokes || '-'}</div>
                        `;
                    } else if (type === 'katakana') {
                        const data = this.currentData.katakana[index];
                        content = `
                            <div style="color: #ff9800; font-weight: bold; font-size: 1.2em; margin-bottom: 5px;">Katakana</div>
                            <div style="font-size: 1.1em;">${data.text} → <strong>${data.romaji}</strong></div>
                        `;
                    } else if (type === 'grammar') {
                        const data = this.currentData.grammar[index];
                        content = `
                            <div style="color: #2196f3; font-weight: bold; font-size: 1.2em; margin-bottom: 5px;">Gramática</div>
                            <div style="font-size: 1.1em; margin-bottom: 5px;">${data.match || data.text || ''}</div>
                            <div style="color: #555;">
                                <span style="background: #e3f2fd; color: #1565c0; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-weight: bold;">${data.level}</span>
                                <span style="margin-left: 8px;">${data.description}</span>
                            </div>
                        `;
                    }
                    infoBox.innerHTML = content;
                }
            });

            // Listener para seleção de texto (Vocabulário composto)
            this.popup.addEventListener('mouseup', () => {
                setTimeout(() => {
                    const selection = window.getSelection();
                    const text = selection.toString().trim();
                    
                    // Verifica se a seleção está dentro do popup e tem tamanho suficiente
                    if (text.length >= 2 && selection.rangeCount > 0 && selection.anchorNode && this.popup.contains(selection.anchorNode)) {
                        this.findAndDisplayVariant(text);
                    }
                }, 10);
            });
        }

        findAndDisplayVariant(text) {
            const infoBox = document.getElementById('nihongo-info-box');
            if (!infoBox || !this.dataset) return;

            let foundMeaning = null;
            if (this.dataset[text]) {
                foundMeaning = this.dataset[text].description;
            }

            if (foundMeaning) {
                infoBox.innerHTML = `
                    <div style="color: #673ab7; font-weight: bold; font-size: 1.2em; margin-bottom: 5px;">Vocabulário Selecionado</div>
                    <div style="font-size: 1.5em; font-weight: bold; margin-bottom: 5px;">${text}</div>
                    <div style="font-size: 1.1em; color: #333;">${foundMeaning}</div>
                `;
            }
        }

        toggleActiveState() {
            this.isActive = !this.isActive;
            const msg = this.isActive ? "Nihongo Ext: ATIVADO" : "Nihongo Ext: DESATIVADO";
            
            // Feedback visual
            this.toast.textContent = msg;
            this.toast.style.opacity = '1';
            setTimeout(() => { this.toast.style.opacity = '0'; }, 2000);

            if (!this.isActive) {
                this.popup.style.display = 'none';
                this.speaker.stopReading();
            }
        }

        handleSelection() {
            const selection = window.getSelection();
            const text = selection.toString().trim();

            if (text.length === 0) return;

            // Calcula posição do popup
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const x = rect.left + window.scrollX;
            const y = rect.bottom + window.scrollY + 10;

            this.processText(text, x, y);
        }

        processText(text, x, y) {
            const isJP = this.dictionaryService.isJapanese(text);
            let contentHTML = '';
            let textToRead = '';
            let kanjiData = [];
            let grammarData = [];
            let katakanaData = [];

            if (isJP) {
                // === JP -> PT ===
                textToRead = text;
                const translation = this.dictionaryService.translateToPT(text);
                kanjiData = translation.kanjiBreakdown;
                grammarData = this.grammarScanner.scanTextOptimized(text);
                katakanaData = this.katakanaChecker.scan(text);

                // Header
                contentHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 1px;">Japonês Detectado</span>
                    <button id="nihongo-close-btn" style="background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: #aaa; padding: 0;">&times;</button>
                </div>`;
            } else {
                // === PT -> JP ===
                const translation = this.dictionaryService.translateToJP(text);
                textToRead = translation.translatedText;
                kanjiData = translation.matches;
                // Analisa a gramática do resultado em japonês
                grammarData = this.grammarScanner.scanTextOptimized(textToRead);
                katakanaData = this.katakanaChecker.scan(textToRead);

                // Header
                contentHTML += `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <span style="font-size: 0.8em; color: #888; text-transform: uppercase; letter-spacing: 1px;">Português -> Japonês</span>
                    <button id="nihongo-close-btn" style="background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: #aaa; padding: 0;">&times;</button>
                </div>`;
            }

            // Atualiza dados atuais para o event listener
            this.currentData = { kanji: kanjiData, grammar: grammarData, katakana: katakanaData };

            // === CONSTRUÇÃO DO TEXTO DE DISPLAY INTERATIVO ===
            // Mapeia cada caractere para um tipo (Kanji, Katakana)
            const charMap = new Array(textToRead.length).fill().map((_, i) => ({ char: textToRead[i], type: null, index: -1 }));

            // Marca Gramática (Prioridade baixa - base)
            if (grammarData) {
                grammarData.forEach((g, idx) => {
                    const str = g.match || g.text;
                    if (str) {
                        const start = textToRead.indexOf(str);
                        if (start !== -1) {
                            for (let i = start; i < start + str.length; i++) {
                                charMap[i].type = 'grammar';
                                charMap[i].index = idx;
                            }
                        }
                    }
                });
            }

            // Marca Katakana (Prioridade média)
            if (katakanaData) {
                katakanaData.forEach((k, idx) => {
                    const start = textToRead.indexOf(k.text);
                    if (start !== -1) {
                        for (let i = start; i < start + k.text.length; i++) {
                            charMap[i].type = 'katakana';
                            charMap[i].index = idx;
                        }
                    }
                });
            }

            // Marca Kanji (Prioridade alta - sobrescreve se necessário)
            if (kanjiData) {
                kanjiData.forEach((k, idx) => {
                    const char = k.char || '';
                    for (let i = 0; i < textToRead.length; i++) {
                        if (textToRead[i] === char) {
                            charMap[i].type = 'kanji';
                            charMap[i].index = idx;
                        }
                    }
                });
            }

            // Gera HTML do Display Text
            let displayTextHTML = '<div style="font-size: 2em; font-weight: 500; line-height: 1.4; color: #333; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">';
            let lastType = null;
            let lastIndex = -1;

            for (let i = 0; i < charMap.length; i++) {
                const curr = charMap[i];
                if (curr.type !== lastType || curr.index !== lastIndex) {
                    if (lastType !== null) displayTextHTML += '</span>';
                    if (curr.type !== null) {
                        let color = '#333';
                        if (curr.type === 'kanji') color = '#e91e63';
                        if (curr.type === 'katakana') color = '#ff9800';
                        if (curr.type === 'grammar') color = '#2196f3';
                        displayTextHTML += `<span class="interactive-segment" data-type="${curr.type}" data-index="${curr.index}" style="color: ${color}; cursor: pointer; border-bottom: 2px solid ${color}33; transition: background 0.2s;">`;
                    }
                }
                displayTextHTML += curr.char;
                lastType = curr.type;
                lastIndex = curr.index;
            }
            if (lastType !== null) displayTextHTML += '</span>';
            displayTextHTML += '</div>';

            contentHTML += displayTextHTML;

            // Área de Explicação (Info Box)
            contentHTML += `
                <div id="nihongo-info-box" style="background: #fff; padding: 15px; border-radius: 8px; min-height: 120px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.05); margin-bottom: 15px; display: flex; flex-direction: column; justify-content: center;">
                    <div style="color: #999; text-align: center; font-style: italic;">
                        Passe o mouse sobre os itens coloridos (Kanji/Katakana) para ver detalhes.
                    </div>
                </div>
            `;

            // Botão de Áudio
            contentHTML += `
                <button id="nihongo-speak-btn" style="width: 100%; background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2em;">🔊</span> Ouvir Pronúncia
                </button>
            `;

            // Renderiza e exibe
            this.popup.innerHTML = contentHTML;
            this.popup.style.display = 'block';
            this.popup.style.left = `${x}px`;
            this.popup.style.top = `${y}px`;

            // Attach evento de clique no botão de áudio recém-criado
            const btn = document.getElementById('nihongo-speak-btn');
            if (btn) btn.onclick = () => this.speaker.readText(textToRead);

            // Attach evento de fechar
            const closeBtn = document.getElementById('nihongo-close-btn');
            if (closeBtn) closeBtn.onclick = (e) => {
                e.stopPropagation();
                this.popup.style.display = 'none';
                this.speaker.stopReading();
            };
        }
    }

    // Inicializa o controlador globalmente
    window.NihongoExtensionController = new NihongoExtensionController();
})();