(function() {
    // Previne múltiplas inicializações se o script for injetado mais de uma vez
    if (window.NihongoExtensionController) return;

    class NihongoExtensionController {
        constructor() {
            this.isActive = false; // Estado inicial: desativado
            this.dataset = null;
            this.popup = null;
            this.toast = null;
            
            // Serviços
            this.dictionaryService = null;
            this.grammarScanner = null;
            this.katakanaChecker = null;
            this.speaker = null;

            this.init();
        }

        async init() {
            try {
                // Carrega o dataset do arquivo local da extensão
                const dataUrl = chrome.runtime.getURL('nerver_read_files_here/main_dataset_pt.json');
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
                background: white;
                border: 1px solid #ccc;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                padding: 15px;
                border-radius: 8px;
                max-width: 450px;
                max-height: 500px;
                overflow-y: auto;
                font-family: Arial, sans-serif;
                font-size: 14px;
                line-height: 1.5;
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

                contentHTML = `
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">
                        <strong>🇯🇵 Japonês Detectado</strong>
                    </div>
                `;
            } else {
                // === PT -> JP ===
                const translation = this.dictionaryService.translateToJP(text);
                textToRead = translation.translatedText;
                kanjiData = translation.matches;
                // Analisa a gramática do resultado em japonês
                grammarData = this.grammarScanner.scanTextOptimized(textToRead);
                katakanaData = this.katakanaChecker.scan(textToRead);

                contentHTML = `
                    <div style="background: #e8f5e9; padding: 8px; border-radius: 4px; margin-bottom: 10px; font-weight: bold; color: #2e7d32;">
                        ${textToRead}
                    </div>
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">
                        <strong>🇧🇷 Português Detectado</strong>
                    </div>
                    <div style="margin-bottom: 8px;">
                        <strong>Equivalente JP:</strong> <span style="font-size: 1.2em; color: #2c3e50;">${textToRead}</span>
                    </div>
                `;
            }

            // Botão de Áudio
            contentHTML += `
                <button id="nihongo-speak-btn" style="background:#4CAF50; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-bottom:10px;">
                    🔊 Ouvir Pronúncia
                </button>
            `;

            // Estruturas Gramaticais
            if (grammarData && grammarData.length > 0) {
                contentHTML += `<div style="background:#e8f4f8; padding:8px; border-radius:4px;"><strong>Gramática:</strong><br>`;
                grammarData.forEach(g => {
                    contentHTML += `
                        <div style="margin-top:5px; font-size:0.9em;">
                            <span style="color:#2980b9; font-weight:bold;">${g.text}</span> (${g.level})<br>
                            ${g.description}
                        </div>
                    `;
                });
                contentHTML += `</div>`;
            }

            // Identificação de Katakana (Loanwords)
            if (katakanaData && katakanaData.length > 0) {
                contentHTML += `<div style="background:#fff3e0; padding:8px; border-radius:4px; margin-bottom:10px;"><strong>Katakana (Romaji):</strong><br>`;
                katakanaData.forEach(k => {
                    contentHTML += `
                        <div style="margin-top:3px; font-size:0.9em;">
                            <span style="color:#e67e22; font-weight:bold;">${k.text}</span> → ${k.romaji}
                        </div>`;
                });
                contentHTML += `</div>`;
            }

            // Detalhes de Kanji/Vocabulário
            if (kanjiData && kanjiData.length > 0) {
                contentHTML += `<div style="background:#f9f9f9; padding:8px; border-radius:4px; margin-bottom:10px;">`;
                kanjiData.forEach(entry => {
                    const char = entry.char || (entry.variants ? Object.keys(entry.variants)[0] : '?');
                    const reading = entry.on ? entry.on.join(', ') : (entry.kun ? entry.kun.join(', ') : '');
                    const meaning = entry.ptbr || (entry.meanings ? entry.meanings[0] : '');
                    
                    contentHTML += `
                        <div style="margin-bottom: 5px; border-bottom: 1px dashed #ddd; padding-bottom: 3px;">
                            <span style="color:#e74c3c; font-weight:bold;">${char}</span> 
                            <span style="font-size:0.9em;">(${reading})</span>: ${meaning}<br>
                            <span style="font-size:0.8em; color:#666;">JLPT: N${entry.jlpt || '-'} | Traços: ${entry.strokes || '-'}</span>
                        </div>
                    `;
                });
                contentHTML += `</div>`;
            }




            // Renderiza e exibe
            this.popup.innerHTML = contentHTML;
            this.popup.style.display = 'block';
            this.popup.style.left = `${x}px`;
            this.popup.style.top = `${y}px`;

            // Attach evento de clique no botão de áudio recém-criado
            const btn = document.getElementById('nihongo-speak-btn');
            if (btn) btn.onclick = () => this.speaker.readText(textToRead);
        }
    }

    // Inicializa o controlador globalmente
    window.NihongoExtensionController = new NihongoExtensionController();
})();