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
                background: #ffffff;
                border: none;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                padding: 20px;
                border-radius: 12px;
                max-width: 420px;
                max-height: 600px;
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
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <strong style="font-size: 1.1em; color: #444;">🇯🇵 Japonês Detectado</strong>
                        <button id="nihongo-close-btn" style="background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: #aaa; padding: 0 5px;">&times;</button>
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
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                        <div style="background: #e8f5e9; padding: 10px; border-radius: 6px; font-weight: bold; color: #2e7d32; flex: 1; margin-right: 10px;">
                            ${textToRead}
                        </div>
                        <button id="nihongo-close-btn" style="background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: #aaa; padding: 0 5px;">&times;</button>
                    </div>
                    <div style="border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 10px;">
                        <strong>🇧🇷 Português Detectado</strong>
                    </div>
                    <div style="margin-bottom: 12px;">
                        <strong>Equivalente JP:</strong> <span style="font-size: 1.3em; color: #2c3e50; font-weight: bold;">${textToRead}</span>
                    </div>
                `;
            }

            // Botão de Áudio
            contentHTML += `
                <button id="nihongo-speak-btn" style="width: 100%; background: #4CAF50; color: white; border: none; padding: 10px; border-radius: 6px; cursor: pointer; margin-bottom: 15px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <span style="font-size: 1.2em;">🔊</span> Ouvir Pronúncia
                </button>
            `;

            // Estruturas Gramaticais
            if (grammarData && grammarData.length > 0) {
                contentHTML += `<div style="background:#e8f4f8; padding:12px; border-radius:8px; margin-bottom:15px;">
                    <strong style="color: #0277bd; display: block; margin-bottom: 8px;">Gramática:</strong>`;
                grammarData.forEach(g => {
                    contentHTML += `
                        <div style="margin-top:8px; font-size:0.95em; border-left: 3px solid #29b6f6; padding-left: 8px;">
                            <div style="color:#555; margin-bottom:2px; font-family: monospace; background: rgba(255,255,255,0.5); padding: 2px;">...${g.formattedContext}...</div>
                            <span style="color:#0277bd; font-weight:bold;">${g.level}</span>: ${g.description}
                        </div>
                    `;
                });
                contentHTML += `</div>`;
            }

            // Identificação de Katakana (Loanwords)
            if (katakanaData && katakanaData.length > 0) {
                contentHTML += `<div style="background:#fff3e0; padding:12px; border-radius:8px; margin-bottom:15px;"><strong>Katakana (Romaji):</strong><br>`;
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
                contentHTML += `<div style="background:#f9f9f9; padding:12px; border-radius:8px; margin-bottom:15px; border: 1px solid #eee;">`;
                kanjiData.forEach(entry => {
                    // --- INÍCIO DA ADIÇÃO: Exibir Variantes (Vocabulário) PRIMEIRO ---
                    if (entry.variants) {
                        let variantKeys = Object.keys(entry.variants);
                        if (variantKeys.length > 0) {
                            // Filtra variantes se houver um match específico (mais de 1 caracter)
                            const matches = variantKeys.filter(v => textToRead.includes(v));
                            const hasLongMatch = matches.some(v => v.length > 1);
                            
                            if (hasLongMatch) {
                                variantKeys = matches;
                            }

                            // Ordena para que variantes encontradas no texto apareçam primeiro
                            variantKeys.sort((a, b) => {
                                const aInText = textToRead.includes(a);
                                const bInText = textToRead.includes(b);
                                return (bInText ? 1 : 0) - (aInText ? 1 : 0);
                            });

                            contentHTML += `<div style="background: #fff8e1; padding: 8px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ffe0b2;">`;
                            contentHTML += `<div style="font-size: 0.85em; font-weight: bold; color: #f57c00; margin-bottom: 5px;">Vocabulário / Contexto:</div>`;
                            
                            [variantKeys[0]].forEach(variant => {
                                const isMatch = textToRead.includes(variant);
                                const rowStyle = isMatch 
                                    ? "background: #ffe0b2; padding: 3px 5px; border-radius: 3px; margin-bottom: 4px; border-left: 3px solid #ef6c00;" 
                                    : "margin-bottom: 3px;";
                                const wordStyle = isMatch
                                    ? "color: #bf360c; font-weight: bold;"
                                    : "color: #333; font-weight: bold;";

                                contentHTML += `<div style="font-size: 0.9em; line-height: 1.3; ${rowStyle}">
                                    <span style="${wordStyle}">${variant}</span>: ${entry.variants[variant]}
                                </div>`;
                            });
                            contentHTML += `</div>`;
                        }
                    }
                    // --- FIM DA ADIÇÃO ---

                    const char = entry.char || (entry.variants ? Object.keys(entry.variants)[0] : '?');
                    const reading = entry.on ? entry.on.join(', ') : (entry.kun ? entry.kun.join(', ') : '');
                    const meaning = entry.ptbr || (entry.meanings ? entry.meanings[0] : '');
                    
                    contentHTML += `
                        <div style="display: flex; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #e0e0e0; padding-bottom: 10px;">
                            <div style="font-size: 3em; color: #e74c3c; font-weight: bold; margin-right: 15px; min-width: 60px; text-align: center; line-height: 1;">${char}</div>
                            <div style="flex: 1;">
                                <div style="font-size: 1.1em; font-weight: bold; color: #333; margin-bottom: 2px;">${meaning}</div>
                                <div style="font-size: 0.95em; color: #555; margin-bottom: 4px;">${reading}</div>
                                <div style="font-size: 0.85em; color: #888;">
                                    <span style="background: #f5f5f5; padding: 2px 6px; border-radius: 4px;">JLPT N${entry.jlpt || '-'}</span>
                                    <span style="margin-left: 8px;">Traços: ${entry.strokes || '-'}</span>
                                </div>
                            </div>
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