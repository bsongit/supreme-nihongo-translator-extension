// c:\Users\werbe\OneDrive\Desktop\github\Browser extensions\supreme-nihongo-translator-extension\ocr-service.js

class OcrService {
    constructor(controller) {
        this.controller = controller; // Referência ao controlador principal para exibir resultados
        this.isSelecting = false;
        this.overlay = null;
        this.selectionBox = null;
        this.startX = 0;
        this.startY = 0;
        
        // Configuração do Tesseract (assumindo que foi carregado globalmente via content_scripts)
        this.worker = null;
    }

    async initWorker() {
        if (typeof Tesseract === 'undefined') {
            console.error("Tesseract.js não encontrado. Certifique-se de incluir a biblioteca.");
            return false;
        }
        
        if (!this.worker) {
            // Cria o worker. Nota: Em produção, você pode precisar apontar para arquivos locais de worker/lang
            // para evitar problemas de CSP (Content Security Policy).
            this.worker = await Tesseract.createWorker('jpn');
        }
        return true;
    }

    startSelectionMode() {
        if (this.isSelecting) return;
        this.isSelecting = true;

        // Esconde o popup principal se estiver aberto
        if (this.controller.popup) {
            this.controller.popup.style.display = 'none';
        }

        this.createOverlay();
        document.body.style.cursor = 'crosshair';
        
        // Feedback visual
        this.showToast("Modo OCR: Selecione uma área com texto japonês");
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            z-index: 2147483646; cursor: crosshair;
            background: rgba(0, 0, 0, 0.1);
        `;

        this.selectionBox = document.createElement('div');
        this.selectionBox.style.cssText = `
            position: fixed; border: 2px solid #e91e63; background: rgba(233, 30, 99, 0.1);
            display: none; pointer-events: none; z-index: 2147483647;
        `;
        
        this.overlay.appendChild(this.selectionBox);
        document.body.appendChild(this.overlay);

        this.overlay.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.overlay.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.overlay.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        // Cancelar com ESC
        document.addEventListener('keydown', this.onKeyDown);
    }

    onMouseDown(e) {
        this.startX = e.clientX;
        this.startY = e.clientY;
        this.selectionBox.style.left = `${this.startX}px`;
        this.selectionBox.style.top = `${this.startY}px`;
        this.selectionBox.style.width = '0px';
        this.selectionBox.style.height = '0px';
        this.selectionBox.style.display = 'block';
    }

    onMouseMove(e) {
        if (this.selectionBox.style.display === 'none') return;

        const currentX = e.clientX;
        const currentY = e.clientY;

        const width = Math.abs(currentX - this.startX);
        const height = Math.abs(currentY - this.startY);
        const left = Math.min(currentX, this.startX);
        const top = Math.min(currentY, this.startY);

        this.selectionBox.style.width = `${width}px`;
        this.selectionBox.style.height = `${height}px`;
        this.selectionBox.style.left = `${left}px`;
        this.selectionBox.style.top = `${top}px`;
    }

    async onMouseUp(e) {
        const rect = this.selectionBox.getBoundingClientRect();
        this.cleanup();

        if (rect.width < 10 || rect.height < 10) {
            this.showToast("Seleção muito pequena.");
            return;
        }

        this.showToast("Processando imagem... ⏳");

        try {
            // 1. Solicita captura de tela ao background
            const response = await chrome.runtime.sendMessage({ action: 'CAPTURE_VISIBLE_TAB' });
            
            if (response && response.dataUrl) {
                // 2. Recorta e processa a imagem
                const processedImage = await this.processImage(response.dataUrl, rect);
                
                // 3. Executa OCR
                await this.recognizeText(processedImage, rect);
            } else {
                const errorMsg = response && response.error ? response.error : "Resposta vazia ou erro desconhecido";
                throw new Error(`Falha ao capturar tela: ${errorMsg}`);
            }
        } catch (err) {
            console.error(err);
            if (err.message && err.message.includes("permission is required")) {
                this.showToast("Erro: Adicione permissões (<all_urls>) no manifest.json");
            } else {
                this.showToast("Erro no OCR: " + err.message);
            }
        }
    }

    cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        this.isSelecting = false;
        document.body.style.cursor = 'default';
        document.removeEventListener('keydown', this.onKeyDown);
    }

    onKeyDown = (e) => {
        if (e.key === 'Escape') {
            this.cleanup();
            this.showToast("OCR Cancelado");
        }
    }

    // Recorta a imagem baseada na seleção e aplica filtros para melhorar Kanji
    processImage(dataUrl, rect) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                // Ajusta para densidade de pixels (Retina displays)
                const dpr = window.devicePixelRatio || 1;
                
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext('2d');

                // Desenha apenas a parte selecionada
                // Nota: As coordenadas do mouse são CSS pixels, a imagem capturada é Device pixels
                ctx.drawImage(
                    img, 
                    rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr, 
                    0, 0, rect.width, rect.height
                );

                // === PRÉ-PROCESSAMENTO (O "Algo Melhor") ===
                // Aumenta contraste e binariza para ajudar o Tesseract com Kanji complexos
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale (Luminosidade)
                    const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
                    // Binarização simples (Threshold)
                    const value = avg > 120 ? 255 : 0; // Fundo branco, texto preto
                    data[i] = data[i + 1] = data[i + 2] = value;
                }
                
                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL('image/png'));
            };
            img.src = dataUrl;
        });
    }

    async recognizeText(imageBlob, rect) {
        const ready = await this.initWorker();
        if (!ready) return;

        const result = await this.worker.recognize(imageBlob);
        const text = result.data.text.replace(/\s+/g, '').trim(); // Remove espaços extras comuns em OCR japonês

        console.log("OCR Resultado:", text);

        if (text.length > 0) {
            // Envia para o controlador principal processar como se fosse uma seleção de mouse
            // Usamos as coordenadas do retângulo para posicionar o popup
            this.controller.processText(text, rect.left + window.scrollX, rect.bottom + window.scrollY + 10);
        } else {
            this.showToast("Nenhum texto detectado.");
        }
    }

    showToast(msg) {
        if (this.controller && this.controller.toast) {
            this.controller.toast.textContent = msg;
            this.controller.toast.style.opacity = '1';
            setTimeout(() => { this.controller.toast.style.opacity = '0'; }, 3000);
        }
    }
}

if (typeof window !== 'undefined') {
    window.OcrService = OcrService;
}
