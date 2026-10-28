// ==================== CONFIGURATION ====================
// The Gemini API key lives only in the Vercel serverless function at
// /api/chat.js (read from the "gemini" environment variable in your Vercel
// project settings). The browser never sees it — this file just calls our
// own /api/chat endpoint.
const CHAT_API_ENDPOINT = '/api/chat';

// ==================== CHAT HISTORY ====================
let chatHistory = [];

// ==================== OPEN HOURS ====================
function getCafeStatus() {
    const now = new Date();
    const day = now.getDay();
    const timeInMinutes = now.getHours() * 60 + now.getMinutes();
    const T = { open10: 600, open7: 420, close22: 1320, close24: 1440 };
    if (day >= 1 && day <= 4) return timeInMinutes >= T.open10 && timeInMinutes < T.close22;
    if (day === 5) return timeInMinutes >= T.open10 && timeInMinutes < T.close24;
    if (day === 6) return timeInMinutes >= T.open7 && timeInMinutes < T.close24;
    if (day === 0) return timeInMinutes >= T.open7 && timeInMinutes < T.close22;
    return false;
}

function updateCafeStatus() {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot || !text) return;
    const isOpen = getCafeStatus();
    dot.className = `w-2 h-2 rounded-full ${isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`;
    text.textContent = isOpen ? 'Open Now' : 'Closed';
}

// ==================== CHAT (via our /api/chat proxy) ====================
async function getBotResponse(userMessage) {
    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });
    if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    try {
        const response = await fetch(CHAT_API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: chatHistory })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            console.error('Chat API error:', data);
            chatHistory.pop(); // don't keep a message that never got a real reply
            if (response.status === 429) {
                return "Whoa, lots of questions! Give me a few seconds and try again ☕";
            }
            return "Oops, I ran into a little hiccup on my end! Please try again in a moment ☕";
        }

        const reply = data?.reply?.trim();

        if (!reply) {
            console.error('Chat API returned no usable reply:', data);
            chatHistory.pop();
            return "Hmm, I didn't quite catch that — mind asking in a different way? 😊";
        }


        chatHistory.push({ role: 'model', parts: [{ text: reply }] });
        return reply;

    } catch (error) {
        console.error('Network error:', error);
        chatHistory.pop();
        return "Hmm, I seem to have lost my connection! Give it another shot in a bit 😊";
    }
}

// ==================== GALLERY TABS ====================
let galleryItems = null;

function switchGalleryTab(category) {
    document.querySelectorAll('.gallery-tab').forEach(tab => tab.classList.remove('active-tab'));
    document.getElementById(`tab-${category}`).classList.add('active-tab');

    if (!galleryItems) galleryItems = [...document.querySelectorAll('#gallery-grid .gallery-item')];

    galleryItems.forEach(item => {
        item.classList.add('hidden-item');
        item.classList.remove('entering');
    });

    const visible = galleryItems.filter(item =>
        category === 'all' || item.getAttribute('data-category') === category
    );

    visible.forEach((item, i) => {
        setTimeout(() => {
            item.classList.remove('hidden-item');
            item.classList.add('entering');
        }, i * 60);
    });
}

// ==================== SMOOTH SCROLL ====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            closeMobileMenu();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ==================== NAVBAR SCROLL ====================
let scrollTicking = false;
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(() => {
            const navbar = document.getElementById('navbar');
            if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
            scrollTicking = false;
        });
        scrollTicking = true;
    }
});

// ==================== MOBILE MENU ====================
let mobileMenuEl, hamburgerBtn, hamburgerIcon;

function openMobileMenu() {
    if (!mobileMenuEl) return;
    mobileMenuEl.classList.add('open');
    hamburgerBtn.classList.add('active');
    hamburgerIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>`;
    document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
    if (!mobileMenuEl) return;
    mobileMenuEl.classList.remove('open');
    hamburgerBtn.classList.remove('active');
    hamburgerIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>`;
    document.body.style.overflow = '';
}

function toggleMobileMenu() {
    mobileMenuEl?.classList.contains('open') ? closeMobileMenu() : openMobileMenu();
}

// ==================== MENU SCROLL BUTTONS ====================
function scrollMenuLeft() {
    document.getElementById('menu-scroll')?.scrollBy({ left: -400, behavior: 'smooth' });
}
function scrollMenuRight() {
    document.getElementById('menu-scroll')?.scrollBy({ left: 400, behavior: 'smooth' });
}

// ==================== MENU DRAG TO SCROLL (Desktop) ====================
function initMenuDragScroll() {
    const slider = document.getElementById('menu-scroll');
    if (!slider) return;

    let isDown = false;
    let startX;
    let scrollLeft;
    let velX = 0;
    let lastX = 0;
    let lastTime = 0;
    let rafId = null;

    // Momentum glide after release
    function glide() {
        velX *= 0.92; // friction — lower = stops faster, higher = longer glide
        if (Math.abs(velX) < 0.5) return;
        slider.scrollLeft += velX;
        rafId = requestAnimationFrame(glide);
    }

    slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.classList.add('dragging');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
        lastX = e.pageX;
        lastTime = Date.now();
        velX = 0;
        cancelAnimationFrame(rafId);
        e.preventDefault();
    });

    slider.addEventListener('mouseleave', () => {
        if (!isDown) return;
        isDown = false;
        slider.classList.remove('dragging');
        rafId = requestAnimationFrame(glide);
    });

    slider.addEventListener('mouseup', () => {
        if (!isDown) return;
        isDown = false;
        slider.classList.remove('dragging');
        rafId = requestAnimationFrame(glide);
    });

    slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const x = e.pageX - slider.offsetLeft;
        const now = Date.now();
        const dt = now - lastTime || 1;

        // Track velocity (pixels per ms)
        velX = (lastX - e.pageX) / dt * 16; // scale to ~60fps frame
        lastX = e.pageX;
        lastTime = now;

        const walk = (x - startX) * 1.2;
        slider.scrollLeft = scrollLeft - walk;
    });
}

// ==================== CHAT UI ====================
let chatMessagesEl, chatInputEl;
let isSending = false;

// Chat starts with a greeting only on first open
let isFirstOpen = true;

function toggleChat() {
    const win = document.getElementById('chat-window');
    if (!win) return;
    const isHidden = win.classList.contains('chat-hidden');
    if (isHidden) {
        win.classList.remove('chat-hidden');
        if (isFirstOpen) {
            setTimeout(() => addBotMessage("Kamusta! ☕ I'm Krav, your KRĀV Cafe AI barista! Ask me about our menu, hours, or anything about the cafe. What can I get you today?"), 300);
            isFirstOpen = false;
        }
        setTimeout(() => chatInputEl?.focus(), 300);
    } else {
        win.classList.add('chat-hidden');
    }
}

function addBotMessage(text) {
    if (!chatMessagesEl) return;
    const div = document.createElement('div');
    div.className = 'flex gap-3 mb-4';
    const icon = document.createElement('div');
    icon.className = 'w-8 h-8 bg-black text-white rounded-2xl flex items-center justify-center text-xl flex-shrink-0';
    icon.textContent = '☕';
    const bubble = document.createElement('div');
    bubble.className = 'bg-white border rounded-3xl px-5 py-4 max-w-[85%] text-sm whitespace-pre-wrap';
    bubble.textContent = text;
    div.appendChild(icon);
    div.appendChild(bubble);
    chatMessagesEl.appendChild(div);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

async function sendChatMessage() {
    if (!chatInputEl || !chatMessagesEl || isSending) return;

    const msg = chatInputEl.value.trim();
    if (!msg) return;

    isSending = true;

    const userDiv = document.createElement('div');
    userDiv.className = 'flex justify-end mb-4';
    const userBubble = document.createElement('div');
    userBubble.className = 'bg-black text-white rounded-3xl px-5 py-4 max-w-[85%] text-sm';
    userBubble.textContent = msg;
    userDiv.appendChild(userBubble);
    chatMessagesEl.appendChild(userDiv);

    chatInputEl.value = '';
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    const typing = document.createElement('div');
    typing.className = 'flex gap-3 mb-4';
    typing.innerHTML = `
        <div class="w-8 h-8 bg-black text-white rounded-2xl flex items-center justify-center text-xl flex-shrink-0">☕</div>
        <div class="bg-white border rounded-3xl px-5 py-4 max-w-[85%] text-sm">
            <div class="flex gap-1">
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.1s"></div>
                <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay:0.2s"></div>
            </div>
        </div>`;
    chatMessagesEl.appendChild(typing);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

    const reply = await getBotResponse(msg);
    chatMessagesEl.removeChild(typing);
    addBotMessage(reply);

    isSending = false;
}

// ==================== GALLERY LIGHTBOX ====================
// Gallery items already had cursor-pointer styling implying they're clickable,
// but nothing happened on click — this wires up an actual lightbox.
let lightboxEl, lightboxImgEl, lightboxCaptionEl;
let lightboxList = [];
let lightboxIndex = 0;

function getVisibleGalleryItems() {
    return [...document.querySelectorAll('#gallery-grid .gallery-item')]
        .filter(item => !item.classList.contains('hidden-item'));
}

function showLightboxImage() {
    const item = lightboxList[lightboxIndex];
    if (!item || !lightboxImgEl) return;
    const img = item.querySelector('.gallery-img');
    const caption = item.querySelector('.gallery-caption');
    lightboxImgEl.src = img?.src || '';
    lightboxImgEl.alt = img?.alt || '';
    if (lightboxCaptionEl) lightboxCaptionEl.textContent = caption?.textContent?.trim() || '';
}

function openLightbox(clickedItem) {
    lightboxList = getVisibleGalleryItems();
    lightboxIndex = lightboxList.indexOf(clickedItem);
    if (lightboxIndex === -1) lightboxIndex = 0;
    showLightboxImage();
    lightboxEl?.classList.remove('hidden');
    lightboxEl?.classList.add('flex');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    lightboxEl?.classList.add('hidden');
    lightboxEl?.classList.remove('flex');
    document.body.style.overflow = '';
}

function lightboxStep(direction) {
    if (!lightboxList.length) return;
    lightboxIndex = (lightboxIndex + direction + lightboxList.length) % lightboxList.length;
    showLightboxImage();
}

// ==================== MAP ====================
function initMap() {
    const el = document.getElementById('map-container');
    if (!el || typeof L === 'undefined') return;
    const kravCafe = [14.090313810454433, 121.12071730320226];
    const map = L.map(el).setView(kravCafe, 19);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);
    L.marker(kravCafe).addTo(map).bindPopup("☕ KRĀV Cafe").openPopup();
}

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {

    mobileMenuEl   = document.getElementById('mobile-menu');
    hamburgerBtn   = document.getElementById('hamburger-btn');
    hamburgerIcon  = document.getElementById('hamburger-icon');
    chatMessagesEl = document.getElementById('chat-messages');
    chatInputEl    = document.getElementById('chat-input');
    lightboxEl        = document.getElementById('lightbox');
    lightboxImgEl     = document.getElementById('lightbox-img');
    lightboxCaptionEl = document.getElementById('lightbox-caption');

    // Gallery tabs
    document.getElementById('tab-all')?.addEventListener('click', () => switchGalleryTab('all'));
    document.getElementById('tab-interior')?.addEventListener('click', () => switchGalleryTab('interior'));
    document.getElementById('tab-exterior')?.addEventListener('click', () => switchGalleryTab('exterior'));
    document.getElementById('tab-food')?.addEventListener('click', () => switchGalleryTab('food'));

    // Gallery lightbox
    document.getElementById('gallery-grid')?.addEventListener('click', (e) => {
        const item = e.target.closest('.gallery-item');
        if (item) openLightbox(item);
    });
    document.getElementById('lightbox-close')?.addEventListener('click', closeLightbox);
    document.getElementById('lightbox-prev')?.addEventListener('click', () => lightboxStep(-1));
    document.getElementById('lightbox-next')?.addEventListener('click', () => lightboxStep(1));
    lightboxEl?.addEventListener('click', (e) => {
        if (e.target === lightboxEl) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
        if (!lightboxEl || lightboxEl.classList.contains('hidden')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxStep(-1);
        if (e.key === 'ArrowRight') lightboxStep(1);
    });

    // Hamburger
    hamburgerBtn?.addEventListener('click', toggleMobileMenu);

    // Menu scroll buttons + drag
    document.getElementById('menu-left-btn')?.addEventListener('click', scrollMenuLeft);
    document.getElementById('menu-right-btn')?.addEventListener('click', scrollMenuRight);
    initMenuDragScroll();

    // Chat
    document.getElementById('chat-fab')?.addEventListener('click', toggleChat);
    document.getElementById('chat-close-btn')?.addEventListener('click', toggleChat);
    document.getElementById('chat-toggle-hero')?.addEventListener('click', toggleChat);
    document.getElementById('chat-send-btn')?.addEventListener('click', sendChatMessage);
    chatInputEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendChatMessage();
        }
    });

    // Map
    const tryInitMap = () => typeof L !== 'undefined' ? initMap() : setTimeout(tryInitMap, 200);
    setTimeout(tryInitMap, 100);

    // Cafe status
    updateCafeStatus();
    setInterval(updateCafeStatus, 60000);
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) updateCafeStatus();
    });
});