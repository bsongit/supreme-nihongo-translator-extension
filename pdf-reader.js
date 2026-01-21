class PdfReader {
    constructor(controller) {
        this.controller = controller;
    }

    // Verifica se deve abrir a sidebar automaticamente (Modo PDF)
    async checkAutoSidebar() {
        // Verifica se é um PDF
        const isPdf = document.contentType === 'application/pdf' || !!document.querySelector('embed[type="application/pdf"]');
        
        if (!isPdf) return;

        // Verifica a flag no storage
        const result = await chrome.storage.local.get(['nihongo_pdf_sidebar_active']);
        if (result.nihongo_pdf_sidebar_active) {
            this.controller.isSidebar = true;
            this.controller.isActive = true; // Garante que a extensão está ativa
            
            // Renderiza a interface inicial da sidebar
            this.renderSidebarInterface();
            
            // Força a atualização visual para mostrar a sidebar
            this.controller.updatePopupState();
        }
    }

    renderSidebarInterface() {
        this.controller.popup.innerHTML = `
            <div class="nihongo-popup-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; background: #f5f5f5; padding: 5px; border-radius: 4px;">
                <span style="font-weight: bold; color: #e91e63;">PDF Reader Mode</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                    <button id="nihongo-sidebar-btn" title="Alternar Sidebar" style="background: none; border: none; font-size: 16px; cursor: pointer; color: #888;">◫</button>
                    <button id="nihongo-close-btn" style="background: none; border: none; font-size: 24px; line-height: 1; cursor: pointer; color: #aaa;">&times;</button>
                </div>
            </div>
            <div style="padding: 20px; text-align: center; color: #555; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 80%;">
                <div style="font-size: 4em; margin-bottom: 15px;">📄</div>
                <h3 style="margin: 0 0 10px 0;">Modo Leitura Ativo</h3>
                <p style="line-height: 1.5;">Selecione qualquer texto no PDF para ver a tradução e análise aqui na barra lateral.</p>
                <button id="nihongo-exit-pdf-mode" style="margin-top: 20px; padding: 10px 20px; background: #607d8b; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Sair do Modo PDF</button>
            </div>
        `;

        this.attachBaseListeners();
        
        const exitBtn = document.getElementById('nihongo-exit-pdf-mode');
        if (exitBtn) exitBtn.onclick = () => {
            chrome.storage.local.set({ 'nihongo_pdf_sidebar_active': false });
            this.controller.popup.style.display = 'none';
            this.controller.isSidebar = false;
        };
    }

    attachBaseListeners() {
        const sidebarBtn = document.getElementById('nihongo-sidebar-btn');
        if (sidebarBtn) sidebarBtn.onclick = (e) => {
            e.stopPropagation();
            this.controller.toggleSidebar();
        };

        const closeBtn = document.getElementById('nihongo-close-btn');
        if (closeBtn) closeBtn.onclick = (e) => {
            e.stopPropagation();
            this.controller.popup.style.display = 'none';
        };
    }

    showInput() {
        const popup = this.controller.popup;
        popup.innerHTML = `
            <div style="padding: 20px;">
                <h3 style="margin-top: 0;">Abrir PDF</h3>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 10px;">Cole a URL do PDF online que deseja ler.</p>
                <input type="text" id="nihongo-pdf-url" placeholder="https://exemplo.com/arquivo.pdf" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">
                <button id="nihongo-pdf-go" style="width: 100%; padding: 10px; background: #e91e63; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; margin-bottom: 10px;">Abrir em Modo Leitura</button>
                <button id="nihongo-pdf-cancel" style="width: 100%; padding: 10px; background: #eee; color: #333; border: none; border-radius: 4px; cursor: pointer;">Cancelar</button>
            </div>
        `;
        
        document.getElementById('nihongo-pdf-go').onclick = async () => {
            const url = document.getElementById('nihongo-pdf-url').value;
            if (url && url.trim().length > 0) {
                await chrome.storage.local.set({ 'nihongo_pdf_sidebar_active': true });
                window.location.href = url;
            }
        };
        
        document.getElementById('nihongo-pdf-cancel').onclick = () => {
            this.controller.popup.style.display = 'none';
        };
    }
}

if (typeof window !== 'undefined') {
    window.PdfReader = PdfReader;
}