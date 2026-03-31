document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const optionInput = document.getElementById('optionInput');
    const bgMusic = document.getElementById('bgMusic');
    const spinSound = document.getElementById('spinSound');
    const winSound = document.getElementById('winSound');

    const themes = {
        Shadow: ["#00BFFF", "#E60000", "#FFFFFF", "#0A0A0A"],
        Adson: ["#CC0000", "#222222", "#FFFFFF", "#006633", "#660099", "#0066CC"],
        Cuyorito: ["#808080", "#1A1A1A", "#FFB6C1", "#D00000"],
        GioFresh: ["#9B111E", "#373E43", "#0E0E10", "#E1AD01", "#0F52BA", "#D3D3D3"],
        Kitzia: ["#8BC34A", "#F9F9F9", "#FFEE8C", "#111111"]
    };

    // Cargar datos
    let options = JSON.parse(localStorage.getItem('shadow_opts')) || ["Opción A", "Opción B", "Opción C"];
    let history = JSON.parse(localStorage.getItem('shadow_hist')) || [];
    let currentTheme = localStorage.getItem('shadow_theme') || 'Shadow';
    let currentFont = localStorage.getItem('shadow_font') || "'Poppins', sans-serif";
    
    let startAngle = 0;
    let isSpinning = false;
    let musicActive = false;

    // --- FUNCIONES CORE ---

    function getContrast(hex) {
        const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
        return ((r*299)+(g*587)+(b*114))/1000 >= 128 ? '#000' : '#fff';
    }

    function renderWheel() {
        const num = options.length;
        if (num === 0) { ctx.clearRect(0,0,600,600); return; }
        const arc = Math.PI / (num / 2);
        ctx.clearRect(0,0,600,600);

        options.forEach((text, i) => {
            const angle = startAngle + i * arc;
            const color = themes[currentTheme][i % themes[currentTheme].length];
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(300, 300, 290, angle, angle + arc, false);
            ctx.lineTo(300, 300);
            ctx.fill();

            ctx.save();
            ctx.fillStyle = getContrast(color);
            ctx.translate(300, 300);
            ctx.rotate(angle + arc / 2);
            ctx.font = `bold 16px ${currentFont}`;
            ctx.fillText(text.substring(0, 15), 100, 5);
            ctx.restore();
        });
        updateUI();
    }

    function updateUI() {
        document.getElementById('optCount').textContent = options.length;
        document.getElementById('optionsList').innerHTML = options.map((o, i) => 
            `<li><span>${o}</span><button onclick="removeOpt(${i})">🗑️</button></li>`).join('');
        document.getElementById('historyList').innerHTML = history.map(h => `<li>${h}</li>`).join('');
        
        const palette = themes[currentTheme];
        document.documentElement.style.setProperty('--primary', palette[0]);
        document.documentElement.style.setProperty('--secondary', palette[1] || palette[0]);
        document.body.style.fontFamily = currentFont;
    }

    function saveData() {
        localStorage.setItem('shadow_opts', JSON.stringify(options));
        localStorage.setItem('shadow_hist', JSON.stringify(history));
        localStorage.setItem('shadow_theme', currentTheme);
        localStorage.setItem('shadow_font', currentFont);
    }

    // --- ACCIONES ---

    function spin() {
        if (isSpinning || options.length < 2) return;
        isSpinning = true;
        if(musicActive) bgMusic.play().catch(()=>{});
        spinSound.currentTime = 0;
        spinSound.play().catch(()=>{});

        let duration = 4000;
        let start = null;
        let rotation = (Math.random() * 10 + 15) * Math.PI;
        let initialAngle = startAngle;

        function animate(timestamp) {
            if (!start) start = timestamp;
            let progress = timestamp - start;
            let t = progress / duration;
            let ease = 1 - Math.pow(1 - t, 3);

            startAngle = initialAngle + rotation * ease;
            renderWheel();

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                finishSpin();
            }
        }
        requestAnimationFrame(animate);
    }

    function finishSpin() {
        isSpinning = false;
        const degrees = (startAngle * 180 / Math.PI) % 360;
        const arcDegrees = 360 / options.length;
        const index = Math.floor((360 - degrees) / arcDegrees) % options.length;
        const winner = options[index];

        document.getElementById('winnerName').textContent = winner;
        document.getElementById('winnerModal').style.display = 'flex';
        
        history.unshift(winner);
        if (history.length > 5) history.pop();
        winSound.play().catch(()=>{});
        saveData();
        renderWheel();
    }

    // --- EVENTOS ---

    document.getElementById('spinBtn').onclick = spin;
    
    document.getElementById('addBtn').onclick = () => {
        const val = optionInput.value.trim();
        if (!val) return;
        const lines = val.split('\n').map(l => l.trim()).filter(l => l !== "");
        options = [...options, ...lines].slice(0, 100);
        optionInput.value = "";
        saveData(); renderWheel();
    };

    window.removeOpt = (i) => {
        options.splice(i, 1);
        saveData(); renderWheel();
    };

    document.getElementById('resetBtn').onclick = () => {
        if(confirm("¿Borrar todo?")) { options = []; history = []; saveData(); renderWheel(); }
    };

    document.getElementById('clearHistoryBtn').onclick = () => {
        history = []; saveData(); updateUI();
    };

    document.getElementById('closeModal').onclick = () => {
        document.getElementById('winnerModal').style.display = 'none';
    };

    document.getElementById('removeWinnerBtn').onclick = () => {
        const name = document.getElementById('winnerName').textContent;
        options = options.filter(o => o !== name);
        document.getElementById('winnerModal').style.display = 'none';
        saveData(); renderWheel();
    };

    document.getElementById('musicBtn').onclick = function() {
        musicActive = !musicActive;
        this.textContent = musicActive ? "Música: ON" : "Música: OFF";
        musicActive ? bgMusic.play() : bgMusic.pause();
    };

    document.getElementById('fullscreenBtn').onclick = () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen();
        else document.exitFullscreen();
    };

    document.getElementById('themeSelect').onchange = (e) => { currentTheme = e.target.value; saveData(); renderWheel(); };
    document.getElementById('fontSelect').onchange = (e) => { currentFont = e.target.value; saveData(); renderWheel(); };
    document.getElementById('volumeSlider').oninput = (e) => { bgMusic.volume = e.target.value; localStorage.setItem('shadow_vol', e.target.value); };

    // Teclas
    document.onkeydown = (e) => {
        if (document.activeElement === optionInput) return;
        if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); spin(); }
    };

    // Inicialización final
    bgMusic.volume = localStorage.getItem('shadow_vol') || 0.3;
    document.getElementById('themeSelect').value = currentTheme;
    document.getElementById('fontSelect').value = currentFont;
    renderWheel();
});