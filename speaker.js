// Adicione este código dentro da tag <script> no HTML acima

class JapaneseTextReader {
    constructor() {
        this.speech = null;
        this.isReading = false;
        this.isPaused = false;
        this.currentText = '';
        this.currentUtterance = null;
        this.voices = [];
        this.volume = 1;
        this.rate = 1;
        
        this.init();
    }

    async init() {
        // Aguardar as vozes serem carregadas
        await this.loadVoices();
        
        // Configurar evento para quando as vozes mudarem
        window.speechSynthesis.onvoiceschanged = () => {
            this.loadVoices();
        };
        
        // Inicializar controles
        this.setupEventListeners();
        this.updateStatus('Pronto para ler');
    }

    loadVoices() {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.voices = window.speechSynthesis.getVoices();
                this.populateVoiceSelect();
                resolve();
            }, 100);
        });
    }

    populateVoiceSelect() {
        const voiceSelect = document.getElementById('voiceSelect');
        if (!voiceSelect) return; // Guard clause if element doesn't exist
        voiceSelect.innerHTML = '';
        
        // Filtrar vozes que suportam japonês
        const japaneseVoices = this.voices.filter(voice => 
            voice.lang.startsWith('ja') || 
            voice.name.toLowerCase().includes('japanese')
        );
        
        // Adicionar todas as vozes disponíveis (com destaque para japonês)
        this.voices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${voice.name} (${voice.lang})`;
            
            if (voice.lang.startsWith('ja')) {
                option.textContent += ' 🇯🇵';
                option.style.fontWeight = 'bold';
            }
            
            voiceSelect.appendChild(option);
        });

        // Selecionar automaticamente uma voz japonesa se disponível
        if (japaneseVoices.length > 0) {
            const japaneseVoiceIndex = this.voices.findIndex(voice => 
                voice.lang.startsWith('ja')
            );
            if (japaneseVoiceIndex !== -1) {
                voiceSelect.value = japaneseVoiceIndex;
            }
        }
    }

    setupEventListeners() {
        // Atualizar texto exibido enquanto digita
        const textInput = document.getElementById('textInput');
        if (textInput) {
            textInput.addEventListener('input', (e) => {
                const display = document.getElementById('displayText');
                if (display) display.textContent = e.target.value;
            });

            const display = document.getElementById('displayText');
            if (display) display.textContent = textInput.value;
        }

        // Configurar botões
        const buttons = ['readBtn', 'pauseBtn', 'resumeBtn', 'stopBtn'];
        buttons.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.updateButtonStates();
                });
            }
        });
    }

    readText(textOverride = null) {
        const text = textOverride || (document.getElementById('textInput') ? document.getElementById('textInput').value : '');
        
        if (!text || !text.trim()) {
            this.updateStatus('Por favor, insira algum texto');
            return;
        }

        this.currentText = text;
        this.stopReading(); // Para qualquer leitura em andamento

        const utterance = new SpeechSynthesisUtterance(text);
        this.currentUtterance = utterance;

        // Configurar voz selecionada
        const voiceSelect = document.getElementById('voiceSelect');
        if (voiceSelect && voiceSelect.value !== '') {
            utterance.voice = this.voices[voiceSelect.value];
        } else {
            // Fallback to first Japanese voice found
            const jaVoice = this.voices.find(v => v.lang.startsWith('ja'));
            if (jaVoice) utterance.voice = jaVoice;
        }

        // Configurar propriedades
        utterance.lang = 'ja-JP';
        utterance.volume = this.volume;
        utterance.rate = this.rate;
        utterance.pitch = 1;

        // Eventos do utterance
        utterance.onstart = () => {
            this.isReading = true;
            this.isPaused = false;
            this.updateStatus('Lendo...');
            this.updateButtonStates();
            this.highlightReading(text);
        };

        utterance.onend = () => {
            this.isReading = false;
            this.updateStatus('Leitura concluída');
            this.updateButtonStates();
            this.clearHighlight();
        };

        utterance.onerror = (event) => {
            console.error('Erro na síntese de fala:', event);
            this.updateStatus('Erro na leitura');
            this.isReading = false;
            this.updateButtonStates();
        };

        // Iniciar leitura
        window.speechSynthesis.speak(utterance);
    }

    pauseReading() {
        if (this.isReading && !this.isPaused) {
            window.speechSynthesis.pause();
            this.isPaused = true;
            this.updateStatus('Pausado');
            this.updateButtonStates();
        }
    }

    resumeReading() {
        if (this.isReading && this.isPaused) {
            window.speechSynthesis.resume();
            this.isPaused = false;
            this.updateStatus('Lendo...');
            this.updateButtonStates();
        }
    }

    stopReading() {
        window.speechSynthesis.cancel();
        this.isReading = false;
        this.isPaused = false;
        this.updateStatus('Parado');
        this.updateButtonStates();
        this.clearHighlight();
    }

    changeVolume(value) {
        this.volume = parseFloat(value);
        if (this.currentUtterance) {
            this.currentUtterance.volume = this.volume;
        }
    }

    changeSpeed(value) {
        this.rate = parseFloat(value);
        const speedDisplay = document.getElementById('speedValue');
        if (speedDisplay) speedDisplay.textContent = value + 'x';
        if (this.currentUtterance) {
            this.currentUtterance.rate = this.rate;
        }
    }

    highlightReading(text) {
        const display = document.getElementById('displayText');
        if (!display) return;
        
        display.innerHTML = '';
        
        // Criar um span para cada caractere para possibilitar destaque
        text.split('').forEach(char => {
            const span = document.createElement('span');
            span.textContent = char;
            span.className = 'char';
            display.appendChild(span);
        });

        // Simular destaque (simplificado)
        let index = 0;
        const chars = display.querySelectorAll('.char');
        
        const highlightInterval = setInterval(() => {
            if (index > 0) {
                chars[index - 1].style.backgroundColor = '';
            }
            if (index < chars.length) {
                chars[index].style.backgroundColor = '#667eea';
                chars[index].style.color = 'white';
                chars[index].style.borderRadius = '3px';
                index++;
            } else {
                clearInterval(highlightInterval);
            }
        }, 1000 / (this.rate * 10)); // Ajustar velocidade do destaque
    }

    clearHighlight() {
        const display = document.getElementById('displayText');
        if (!display) return;
        const chars = display.querySelectorAll('.char');
        chars.forEach(char => {
            char.style.backgroundColor = '';
            char.style.color = '';
        });
    }

    updateButtonStates() {
        const buttons = {
            readBtn: !this.isReading || this.isPaused,
            pauseBtn: this.isReading && !this.isPaused,
            resumeBtn: this.isReading && this.isPaused,
            stopBtn: this.isReading || this.isPaused
        };

        for (const [btnId, enabled] of Object.entries(buttons)) {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = !enabled;
            }
        }
    }

    updateStatus(message) {
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = message;
    }
}

// Inicializar o leitor quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.reader = new JapaneseTextReader();
    
    // Expor funções globais para os botões HTML
    window.readText = () => window.reader.readText();
    window.pauseReading = () => window.reader.pauseReading();
    window.resumeReading = () => window.reader.resumeReading();
    window.stopReading = () => window.reader.stopReading();
    window.changeVolume = (value) => window.reader.changeVolume(value);
    window.changeSpeed = (value) => window.reader.changeSpeed(value);
});