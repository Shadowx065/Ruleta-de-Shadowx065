document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const optionInput = document.getElementById('optionInput');
    const themeSelect = document.getElementById('themeSelect');
    const fontSelect = document.getElementById('fontSelect');
    const volumeSlider = document.getElementById('volumeSlider');
    const customPanel = document.getElementById('customPalettePanel');
    const colorContainer = document.getElementById('colorPickerContainer');
    const addColorBtn = document.getElementById('addColorBtn');
    const bgMusic = document.getElementById('bgMusic');
    const winSound = document.getElementById('winSound');

    const themes = {
        Shadow: ["#00BFFF", "#E60000", "#FFFFFF", "#0A0A0A"],
        Adson: ["#CC0000", "#222222", "#FFFFFF", "#006633", "#660099", "#0066CC"],
        Cuyorito: ["#808080", "#1A1A1A", "#FFB6C1", "#D00000"],
        GioFresh: ["#9B111E", "#373E43", "#0E0E10", "#E1AD01", "#0F52BA", "#D3D3D3"],
        Kitzia: ["#8BC34A", "#F9F9F9", "#FFEE8C", "#111111"]
    };

    let options = JSON.parse(localStorage.getItem('shadow_opts')) || ["Opción 1", "Opción 2", "Opción 3"];
    let history = JSON.parse(localStorage.getItem('shadow_hist')) || [];
    let currentTheme = localStorage.getItem('shadow_theme') || 'Shadow';
    let currentFont = localStorage.getItem('shadow_font') || "'Poppins', sans-serif";
    let customColors = JSON.parse(localStorage.getItem('shadow_custom_colors')) || ["#00aaff", "#ff0000", "#ffffff"];
    
    let startAngle = 0;
    let isSpinning = false;

    // --- AUDIO ---
    bgMusic.volume = localStorage.getItem('shadow_vol') || 0.3;
    volumeSlider.value = bgMusic.volume;
    document.addEventListener('click', () => bgMusic.play().catch(() => {}), { once: true });

    function saveData() {
        localStorage.setItem('shadow_opts', JSON.stringify(options));
        localStorage.setItem('shadow_hist', JSON.stringify(history));
        localStorage.setItem('shadow_theme', currentTheme);
        localStorage.setItem('shadow_font', currentFont);
        localStorage.setItem('shadow_custom_colors', JSON.stringify(customColors));
        localStorage.setItem('shadow_vol', bgMusic.volume);
    }

    // --- LÓGICA DE COLORES ---
    function getColor(i) {
        if (currentTheme === 'Custom') {
            return customColors[i % customColors.length];
        }
        const palette = themes[currentTheme];
        return palette[i % palette.length];
    }

    function getContrast(hex) {
        const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
        return ((r*299)+(g*587)+(b*114))/1000 >= 128 ? '#000' : '#fff';
    }

    // --- RENDERIZADO ---
    function renderWheel() {
        const num = options.length;
        if (num === 0) { ctx.clearRect(0,0,600,600); updateUI(); return; }
        const arc = (Math.PI * 2) / num;
        ctx.clearRect(0,0,600,600);

        options.forEach((text, i) => {
            const angle = startAngle + i * arc;
            const color = getColor(i);
            
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
            ctx.textAlign = "right";
            ctx.fillText(text.substring(0, 15), 250, 5);
            ctx.restore();
        });
        updateUI();
    }

    function updateUI() {
        document.getElementById('optCount').textContent = options.length;
        document.getElementById('optionsList').innerHTML = options.map((o, i) => 
            `<li><span>${o}</span><button class="btn-text" onclick="removeOpt(${i})">X</button></li>`).join('');
        document.getElementById('historyList').innerHTML = history.slice(0, 5).map(h => `<li>${h}</li>`).join('');
        
        customPanel.style.display = currentTheme === 'Custom' ? 'block' : 'none';
        
        const mainCol = currentTheme === 'Custom' ? customColors[0] : themes[currentTheme][0];
        document.documentElement.style.setProperty('--primary', mainCol);
        document.body.style.fontFamily = currentFont;
    }

    // --- PALETA PERSONALIZADA ---
    function renderPaletteInputs() {
        colorContainer.innerHTML = '';
        customColors.forEach((color, idx) => {
            const div = document.createElement('div');
            div.className = 'color-item';
            div.innerHTML = `
                <input type="color" value="${color}">
                ${customColors.length > 3 ? `<button class="btn-remove-color" onclick="removeColor(${idx})">×</button>` : ''}
            `;
            div.querySelector('input').oninput = (e) => {
                customColors[idx] = e.target.value;
                saveData(); renderWheel();
            };
            colorContainer.appendChild(div);
        });
        addColorBtn.style.display = customColors.length >= 6 ? 'none' : 'block';
    }

    window.removeColor = (i) => {
        customColors.splice(i, 1);
        renderPaletteInputs(); saveData(); renderWheel();
    };

    addColorBtn.onclick = () => {
        if (customColors.length < 6) {
            customColors.push("#888888");
            renderPaletteInputs(); saveData(); renderWheel();
        }
    };

    // --- ACCIONES ---
    function spin() {
        if (isSpinning || options.length < 2) return;
        isSpinning = true;
        let duration = 4000;
        let start = null;
        let rotation = (Math.random() * 5 + 15) * Math.PI;
        let initialAngle = startAngle;

        function animate(now) {
            if (!start) start = now;
            let t = (now - start) / duration;
            if (t > 1) t = 1;
            let ease = 1 - Math.pow(1 - t, 3);
            startAngle = initialAngle + rotation * ease;
            renderWheel();
            if (t < 1) requestAnimationFrame(animate);
            else finishSpin();
        }
        requestAnimationFrame(animate);
    }

    function finishSpin() {
        isSpinning = false;
        const totalArc = (Math.PI * 2) / options.length;
        let angle = (Math.PI * 1.5 - (startAngle % (Math.PI * 2))) % (Math.PI * 2);
        if (angle < 0) angle += Math.PI * 2;
        const index = Math.floor(angle / totalArc);
        const winner = options[index];
        
        document.getElementById('winnerName').textContent = winner;
        document.getElementById('winnerModal').style.display = 'flex';
        history.unshift(winner);
        winSound.play();
        saveData(); renderWheel();
    }

    // --- EVENT LISTENERS ---
    document.getElementById('spinBtn').onclick = spin;
    document.getElementById('addBtn').onclick = () => {
        const val = optionInput.value.trim();
        if (!val) return;
        options = [...options, ...val.split('\n').filter(l => l.trim())];
        optionInput.value = '';
        saveData(); renderWheel();
    };

    window.removeOpt = (i) => { options.splice(i, 1); saveData(); renderWheel(); };

    document.getElementById('resetBtn').onclick = () => {
        if(confirm("¿Borrar todo?")) { options = []; history = []; saveData(); renderWheel(); }
    };

    document.getElementById('clearHistoryBtn').onclick = () => { history = []; saveData(); updateUI(); };
    document.getElementById('closeModal').onclick = () => document.getElementById('winnerModal').style.display = 'none';
    
    document.getElementById('removeWinnerBtn').onclick = () => {
        options = options.filter(o => o !== document.getElementById('winnerName').textContent);
        document.getElementById('winnerModal').style.display = 'none';
        saveData(); renderWheel();
    };

    volumeSlider.oninput = (e) => { bgMusic.volume = e.target.value; saveData(); };
    themeSelect.onchange = (e) => { currentTheme = e.target.value; renderPaletteInputs(); saveData(); renderWheel(); };
    fontSelect.onchange = (e) => { currentFont = e.target.value; saveData(); renderWheel(); };

    document.onkeydown = (e) => {
        if (document.activeElement === optionInput) return;
        if (e.code === "Space" || e.key === "Enter") { e.preventDefault(); spin(); }
    };

    // Inicialización
    themeSelect.value = currentTheme;
    fontSelect.value = currentFont;
    renderPaletteInputs();
    renderWheel();
});
