document.addEventListener('DOMContentLoaded', function() {
    const typingBtn = document.getElementById('typing-btn');
    const compareBtn = document.getElementById('compare-btn');
    const spellingBtn = document.getElementById('spelling-btn');
    const enhanceBtn = document.getElementById('enhance-btn');
    
    if (typingBtn) {
        typingBtn.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    
    if (compareBtn) {
        compareBtn.addEventListener('click', function() {
            window.location.href = 'compare.html';
        });
    }

    if (spellingBtn) {
        spellingBtn.addEventListener('click', function() {
            window.location.href = 'spelling.html';
        });
    }

    if (enhanceBtn) {
        enhanceBtn.addEventListener('click', function() {
            window.location.href = 'enhance.html';
        });
    }
});