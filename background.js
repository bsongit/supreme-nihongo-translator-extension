// c:\Users\werbe\OneDrive\Desktop\github\Browser extensions\supreme-nihongo-translator-extension\background.js

// Escuta mensagens do Content Script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CAPTURE_VISIBLE_TAB') {
        const windowId = sender.tab ? sender.tab.windowId : null;
        // Captura a aba ativa como uma imagem PNG (base64)
        chrome.tabs.captureVisibleTab(windowId, { format: 'png' }, (dataUrl) => {
            if (chrome.runtime.lastError) {
                sendResponse({ error: chrome.runtime.lastError.message });
            } else {
                sendResponse({ dataUrl: dataUrl });
            }
        });
        return true; // Indica que a resposta será assíncrona
    }
});
