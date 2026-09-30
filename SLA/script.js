/**
 * Sandhya Yantra - Scientific Simulation & Website Logic
 *
 * This script handles the startup animation, solar physics calculations,
 * Canvas-based simulation, and UI interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initStartup();
    initNavigation();
    initTabs();
    initScrollReveal();
    initSimulation();
    initWorkbench();
    initModal();
    initReport();
});

// --- UTILITIES ---

function degToRad(deg) {
    return deg * (Math.PI / 180);
}

function radToDeg(rad) {
    return rad * (180 / Math.PI);
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

// --- STARTUP ANIMATION ---

function initStartup() {
    const overlay = document.getElementById('startup-overlay');

    // Sequence timing matches CSS animations
    setTimeout(() => {
        overlay.style.opacity = '0';
        overlay.style.visibility = 'hidden';
    }, 3500);
}

// --- NAVIGATION ---

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('section');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
}

// --- TABS ---

function initTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const panes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;

            tabs.forEach(t => t.classList.remove('active'));
            panes.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(target).classList.add('active');
        });
    });
}

// --- SCROLL REVEAL ---

function initScrollReveal() {
    const observerOptions = {
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// --- PHYSICS ENGINE & SIMULATION ---

function initSimulation() {
    const canvas = document.getElementById('simCanvas');
    const ctx = canvas.getContext('2d');

    // State
    let state = {
        h: 2.0,
        altitude: 45,
        time: 12.0,
        day: 180,
        isPlaying: false,
        lat: 18.5 // Pune, India
    };

    // Control Elements
    const ctrlH = document.getElementById('ctrl-h');
    const ctrlAlt = document.getElementById('ctrl-alt');
    const ctrlTime = document.getElementById('ctrl-time');
    const ctrlDay = document.getElementById('ctrl-day');

    const valH = document.getElementById('val-h');
    const valAlt = document.getElementById('val-alt');
    const valTime = document.getElementById('val-time');
    const valDay = document.getElementById('val-day');

    const telLength = document.getElementById('tel-length');
    const telAlt = document.getElementById('tel-altitude');
    const telAzimuth = document.getElementById('tel-azimuth');
    const telDecl = document.getElementById('tel-decl');
    const telTime = document.getElementById('tel-time');
    const telDay = document.getElementById('tel-day');

    function updateStateFromControls() {
        state.h = parseFloat(ctrlH.value);
        state.altitude = parseFloat(ctrlAlt.value);
        state.time = parseFloat(ctrlTime.value);
        state.day = parseInt(ctrlDay.value);

        valH.innerText = state.h.toFixed(1);
        valAlt.innerText = state.altitude;

        // Format time as HH:MM
        const hours = Math.floor(state.time);
        const mins = Math.floor((state.time - hours) * 60);
        valTime.innerText = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        valDay.innerText = state.day;
    }

    function calculateSolarPosition() {
        // Simplified Astronomical Calculations

        // 1. Declination (approximate)
        const decl = 23.45 * Math.sin(degToRad((360 / 365) * (state.day - 81)));

        // 2. Hour Angle (15 degrees per hour, 0 at solar noon)
        const hourAngle = (state.time - 12) * 15;

        // 3. Solar Altitude (α)
        // sin(α) = sin(lat)sin(decl) + cos(lat)cos(decl)cos(HA)
        const sinAlt = Math.sin(degToRad(state.lat)) * Math.sin(degToRad(decl)) +
                       Math.cos(degToRad(state.lat)) * Math.cos(degToRad(decl)) * Math.cos(degToRad(hourAngle));

        const altitude = radToDeg(Math.asin(sinAlt));

        // 4. Solar Azimuth (A)
        // cos(A) = (sin(decl) - sin(α)sin(lat)) / (cos(α)cos(lat))
        const cosAz = (Math.sin(degToRad(decl)) - Math.sin(degToRad(altitude)) * Math.sin(degToRad(state.lat))) /
                      (Math.cos(degToRad(altitude)) * Math.cos(degToRad(state.lat)));

        let azimuth = radToDeg(Math.acos(Math.max(-1, Math.min(1, cosAz))));
        if (state.time > 12) azimuth = 360 - azimuth;

        return {
            altitude: altitude,
            azimuth: azimuth,
            declination: decl
        };
    }

    function draw() {
        // Resize canvas
        if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const { altitude, azimuth, declination } = calculateSolarPosition();

        // If using manual altitude control, override calculations
        // We only use calculated altitude if the altitude slider is at its default (45)
        // or if the user hasn't manually changed it.
        const effectiveAlt = (ctrlAlt.value == 45) ? altitude : state.altitude;

        // Calculate Shadow Length
        let shadowLength = 0;
        if (effectiveAlt > 0) {
            shadowLength = state.h / Math.tan(degToRad(effectiveAlt));
        }

        // Telemetry
        telLength.innerText = shadowLength.toFixed(2);
        telAlt.innerText = effectiveAlt.toFixed(2);
        telAzimuth.innerText = azimuth.toFixed(2);
        telDecl.innerText = declination.toFixed(2);
        telDay.innerText = state.day;
        const h_val = Math.floor(state.time);
        const m_val = Math.floor((state.time - h_val) * 60);
        telTime.innerText = `${h_val.toString().padStart(2, '0')}:${m_val.toString().padStart(2, '0')}`;

        // Visual Mapping
        const centerX = canvas.width / 2;
        const centerY = canvas.height * 0.8;
        const scale = 40; // pixels per meter

        // Draw Ground
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 200, 60, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#f0f0f0';
        ctx.fill();
        ctx.strokeStyle = '#ddd';
        ctx.stroke();

        // Draw Gnomon
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX, centerY - (state.h * scale));
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw Shadow
        if (effectiveAlt > 0) {
            const sLen = shadowLength * scale;
            const azRad = degToRad(azimuth + 180); // Shadow is opposite to sun
            const sx = centerX + sLen * Math.sin(azRad);
            const sy = centerY + sLen * Math.cos(azRad) * 0.3; // Perspective flatten

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(sx, sy);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 8;
            ctx.stroke();
        }

        // Draw Sun (Schematic)
        const sunDist = 150;
        const sunAzRad = degToRad(azimuth);
        const sunX = centerX + sunDist * Math.sin(sunAzRad);
        const sunY = centerY - (state.h * scale * 2) + sunDist * Math.cos(sunAzRad) * 0.3;

        ctx.beginPath();
        ctx.arc(sunX, sunY, 15, 0, Math.PI * 2);
        ctx.fillStyle = '#f1c40f';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#f39c12';
        ctx.fill();
        ctx.shadowBlur = 0;

        // Draw Sun Rays
        if (effectiveAlt > 0) {
            ctx.beginPath();
            ctx.moveTo(sunX, sunY);
            ctx.lineTo(centerX, centerY - (state.h * scale));
            ctx.strokeStyle = 'rgba(243, 156, 18, 0.3)';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        if (state.isPlaying) {
            state.time += 0.05; // Increased speed from 0.01 to 0.05
            if (state.time > 18) state.time = 6;
            ctrlTime.value = state.time;
            updateStateFromControls();
        }

        requestAnimationFrame(draw);
    }

    // Event Listeners
    [ctrlH, ctrlAlt, ctrlTime, ctrlDay].forEach(el => {
        el.addEventListener('input', updateStateFromControls);
    });

    document.getElementById('btn-play').addEventListener('click', (e) => {
        state.isPlaying = !state.isPlaying;
        e.target.innerText = state.isPlaying ? 'Pause' : 'Play';
        showToast(state.isPlaying ? 'Simulation started' : 'Simulation paused');
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
        ctrlH.value = 2.0;
        ctrlAlt.value = 45;
        ctrlTime.value = 12;
        ctrlDay.value = 180;
        updateStateFromControls();
        showToast('Simulation reset');
    });

    document.getElementById('btn-noon').addEventListener('click', () => {
        ctrlTime.value = 12;
        updateStateFromControls();
        showToast('Solar noon selected');
    });

    updateStateFromControls();
    draw();
}

// --- WORKBENCH ---

function initWorkbench() {
    const btnShadow = document.getElementById('btn-calc-shadow');
    const btnAlt = document.getElementById('btn-calc-alt');

    btnShadow.addEventListener('click', () => {
        const h = parseFloat(document.getElementById('wb-h').value);
        const alt = parseFloat(document.getElementById('wb-alt').value);

        if (alt <= 0 || alt >= 90) {
            showToast('Altitude must be between 0 and 90');
            return;
        }

        const L = h / Math.tan(degToRad(alt));
        document.getElementById('res-shadow').innerText = L.toFixed(3);
        showToast('Shadow calculation complete');
    });

    btnAlt.addEventListener('click', () => {
        const h = parseFloat(document.getElementById('wb-h2').value);
        const L = parseFloat(document.getElementById('wb-l').value);

        if (L <= 0) {
            showToast('Shadow length must be positive');
            return;
        }

        const alt = radToDeg(Math.atan(h / L));
        const zenith = 90 - alt;

        document.getElementById('res-alt').innerText = alt.toFixed(2);
        document.getElementById('res-zenith').innerText = zenith.toFixed(2);
        showToast('Altitude calculation complete');
    });
}

// --- MODAL & REPORT ---

function initModal() {
    const modal = document.getElementById('report-modal');
    const btnOpen = document.getElementById('btn-report');
    const btnClose = document.querySelector('.close-modal');

    btnOpen.addEventListener('click', () => {
        modal.style.display = 'flex';
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });
}

function initReport() {
    // Logic for report download could go here,
    // currently handled by modal content
}
