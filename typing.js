document.addEventListener('DOMContentLoaded', () => {
    const textArea = document.getElementById('text-area');
    const textDisplay = document.getElementById('text-display'); 
    const customCursor = document.getElementById('custom-cursor'); 
    const wordCountDisplay = document.getElementById('word-count'); 
    const charCountDisplay = document.getElementById('char-count');
    const copyButton = document.getElementById('copy-button'); 
    
    if (!textArea || !customCursor || !wordCountDisplay || !textDisplay || !copyButton || !charCountDisplay) {
        console.error("Критическая ошибка: не удалось найти все необходимые элементы DOM.");
        return; 
    }

    let isSoundReady = false; 
    let typingTimer;
    
    const universalKeySound = new Audio('key_press.wav');
    const AUDIO_CONTEXT = new (window.AudioContext || window.webkitAudioContext)();
    
    customCursor.style.height = '1.3em';
    
    let previousText = textArea.value; 

    // --- ПРОСТАЯ ФУНКЦИЯ ДЛЯ ОБНОВЛЕНИЯ ТЕКСТА ---
    function updateTextDisplay(currentText, previousText) {
        // Всегда используем простой рендеринг текста с заменой переносов строк на <br>
        textDisplay.innerHTML = currentText.replace(/\n/g, '<br>');
    }
    
    // --- 1. Загрузка, Сохранение и Прокрутка ---
    const savedText = localStorage.getItem('myWordCounterText');
    if (savedText) {
        textArea.value = savedText;
        textDisplay.innerHTML = savedText.replace(/\n/g, '<br>');
        previousText = savedText;
        
        // Устанавливаем курсор в конец текста при загрузке
        textArea.selectionStart = savedText.length;
        textArea.selectionEnd = savedText.length;
        
        scrollTextToBottom();
    } else {
        textDisplay.innerHTML = '';
        previousText = '';
    }
    updateCounts(); 

    // КЛЮЧЕВОЙ ОБРАБОТЧИК: Вызывает все обновления
    textArea.addEventListener('input', () => {
        const currentText = textArea.value;
        localStorage.setItem('myWordCounterText', currentText);
        
        updateTextDisplay(currentText, previousText);
        previousText = currentText; 
        
        updateCounts(); 
        updateCursorPosition();
        syncScroll();
    });
    
    // --- ФУНКЦИОНАЛ КОПИРОВАНИЯ ---
    copyButton.addEventListener('click', async () => {
        const textToCopy = textArea.value;
        const originalTooltip = copyButton.dataset.tooltip;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            copyButton.dataset.tooltip = 'Скопировано!';
            copyButton.style.borderColor = 'var(--accent-color)';
            copyButton.style.color = 'var(--accent-color)';
            copyButton.style.background = 'rgba(208, 0, 0, 0.1)';
            
        } catch (err) {
            copyButton.dataset.tooltip = 'Ошибка';
        }
        
        setTimeout(() => {
            copyButton.dataset.tooltip = originalTooltip;
            copyButton.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            copyButton.style.color = 'rgba(255, 255, 255, 0.4)';
            copyButton.style.background = 'transparent';
        }, 2000);
    });

    function scrollTextToBottom() {
        textArea.scrollTop = textArea.scrollHeight;
        syncScroll();
    }
    
    function syncScroll() {
        textDisplay.scrollTop = textArea.scrollTop;
    }
    textArea.addEventListener('scroll', syncScroll); 
    
    function updateCounts() {
        const text = textArea.value;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0);
        const wordCount = words.length;
        const charCount = text.length;
        
        wordCountDisplay.textContent = wordCount;
        
        const symbolText = charCount === 1 ? 'символ' : 
                          charCount >= 2 && charCount <= 4 ? 'символа' : 'символов';
        charCountDisplay.textContent = `${charCount} ${symbolText}`;
    }
    
    // --- 2. Звук печати и Курсор ---
    document.addEventListener('click', activateSound, { once: true });
    document.addEventListener('keydown', activateSound, { once: true });

    function activateSound() {
        isSoundReady = true;
        if (AUDIO_CONTEXT.state === 'suspended') {
            AUDIO_CONTEXT.resume().catch(e => console.error("Не удалось возобновить AudioContext:", e));
        }
        
        textArea.removeEventListener('keydown', handleKeyPress);
        textArea.addEventListener('keydown', handleKeyPress);
    }

    function handleKeyPress(e) {
        if (!isSoundReady) return; 
        
        customCursor.classList.add('is-typing');
        
        clearTimeout(typingTimer);
        typingTimer = setTimeout(() => {
            customCursor.classList.remove('is-typing');
        }, 300); 

        const key = e.key;
        if (key.length > 1 && key !== ' ') {
            return; 
        }
        universalKeySound.currentTime = 0; 
        universalKeySound.play().catch(error => {
             console.error("Ошибка воспроизведения key_press.wav:", error);
        });
    }
    
    // --- 3. ПРОСТАЯ И РАБОЧАЯ ФУНКЦИЯ ПОЗИЦИОНИРОВАНИЯ КУРСОРА ---
    // --- ИСПРАВЛЕННАЯ ФУНКЦИЯ ПОЗИЦИОНИРОВАНИЯ КУРСОРА С УЧЕТОМ ПЕРЕНОСОВ СТРОК ---
function updateCursorPosition() {
    if (document.activeElement !== textArea) {
        customCursor.style.opacity = '0';
        return;
    }

    setTimeout(() => {
        const position = textArea.selectionStart;
        const text = textArea.value;
        const textBeforeCursor = text.substring(0, position);
        
        // Создаем временный элемент с ТОЧНО такими же стилями как textDisplay
        const tempDiv = document.createElement('div');
        const textDisplayStyle = getComputedStyle(textDisplay);
        
        // Копируем ВСЕ стили, включая те, что отвечают за переносы
        tempDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: ${textDisplay.clientWidth}px;
            height: auto;
            font-family: ${textDisplayStyle.fontFamily};
            font-size: ${textDisplayStyle.fontSize};
            font-weight: ${textDisplayStyle.fontWeight};
            line-height: ${textDisplayStyle.lineHeight};
            padding: ${textDisplayStyle.padding};
            margin: ${textDisplayStyle.margin};
            box-sizing: ${textDisplayStyle.boxSizing};
            white-space: ${textDisplayStyle.whiteSpace};
            word-break: ${textDisplayStyle.wordBreak};
            overflow-wrap: ${textDisplayStyle.overflowWrap};
            visibility: hidden;
            z-index: -1;
        `;
        
        // Воссоздаем содержимое textDisplay до позиции курсора
        // Используем тот же метод, что и в основном отображении
        tempDiv.innerHTML = textBeforeCursor.replace(/\n/g, '<br>');
        
        // Добавляем маркер курсора
        const marker = document.createElement('span');
        marker.id = 'cursor-marker';
        marker.innerHTML = '|';
        marker.style.cssText = 'visibility: hidden;';
        tempDiv.appendChild(marker);
        
        // Добавляем временный элемент рядом с textDisplay
        textDisplay.parentNode.appendChild(tempDiv);
        
        // Получаем позицию маркера
        const markerRect = marker.getBoundingClientRect();
        const displayRect = textDisplay.getBoundingClientRect();
        
        // Вычисляем позицию курсора относительно textDisplay
        const x = markerRect.left - displayRect.left;
        const y = markerRect.top - displayRect.top;
        
        // Убираем временный элемент
        textDisplay.parentNode.removeChild(tempDiv);
        
        // Проверяем, находится ли курсор в видимой области
        const isInViewport = (
            y >= 0 && 
            y <= textDisplay.clientHeight &&
            x >= 0 && 
            x <= textDisplay.clientWidth
        );
        
        if (isInViewport) {
            customCursor.style.transform = `translate(${x}px, ${y}px)`;
            customCursor.style.opacity = '1';
        } else {
            customCursor.style.opacity = '0';
        }
        
    }, 10);
}

    // --- 4. ПРОСТАЯ ОБРАБОТКА КЛИКА ---
    function handleTextDisplayClick(e) {
        // Фокусируем textarea
        textArea.focus();
        
        // Устанавливаем курсор в конец текста
        const textLength = textArea.value.length;
        textArea.selectionStart = textLength;
        textArea.selectionEnd = textLength;
        
        updateCursorPosition();
    }

    // Добавляем обработчики событий
    textArea.addEventListener('input', updateCursorPosition);
    textArea.addEventListener('focus', updateCursorPosition);
    textArea.addEventListener('blur', () => {
        customCursor.style.opacity = '0';
        clearTimeout(typingTimer);
        customCursor.classList.remove('is-typing'); 
    });
    textArea.addEventListener('keyup', updateCursorPosition);
    textArea.addEventListener('mouseup', updateCursorPosition);
    textArea.addEventListener('click', updateCursorPosition);
    
    // Обработчик клика по textDisplay для установки курсора
    textDisplay.addEventListener('click', handleTextDisplayClick);

    // Инициализация
    updateCursorPosition();
    
    // Пересчет позиции курсора при изменении размера окна
    window.addEventListener('resize', updateCursorPosition);
});