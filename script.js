/**
 * SERBER LINKS — ИНТЕРАКТИВНЫЕ ЭФФЕКТЫ И ЛОГИКА (ОПТИМИЗИРОВАННАЯ ВЕРСИЯ)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Установка текущего года в подвале
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Всплывающее уведомление (Toast)
  const toast = document.getElementById('toastNotification');
  let toastTimeout = null;

  function showToast(message) {
    if (!toast) return;
    const textSpan = toast.querySelector('span');
    if (textSpan && message) {
      textSpan.textContent = message;
    }
    
    toast.classList.add('active');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 2800);
  }

  // Вспомогательная функция копирования для старых браузеров
  function copyFallback(text, successMsg = 'Скопировано!') {
    const input = document.createElement('input');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.focus();
    input.select();
    try {
      document.execCommand('copy');
      showToast(successMsg);
    } catch {
      showToast('Не удалось скопировать');
    }
    document.body.removeChild(input);
  }

  // 3. Обработка кнопки "Поделиться"
  const shareBtn = document.getElementById('shareBtn');
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const currentUrl = window.location.href;
      
      // Нативное меню шаринга для мобильных устройств
      if (navigator.share && window.innerWidth < 768) {
        try {
          await navigator.share({
            title: 'SERBER — Ссылки и донат',
            text: 'Официальные контакты и способы поддержки UP SERBER',
            url: currentUrl,
          });
          return;
        } catch (err) {
          if (err.name === 'AbortError') return;
        }
      }

      // Быстрое копирование через Clipboard API
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(currentUrl)
          .then(() => showToast('Ссылка успешно скопирована!'))
          .catch(() => copyFallback(currentUrl, 'Ссылка скопирована!'));
      } else {
        copyFallback(currentUrl, 'Ссылка скопирована!');
      }
    });
  }

  // 4. Копирование номера банковской карты
  const copyCardBtn = document.getElementById('copyCardBtn');
  if (copyCardBtn) {
    copyCardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const rawCard = copyCardBtn.getAttribute('data-card') || '2202 2092 3153 2168';
      const cleanCard = rawCard.replace(/\s+/g, '');
      const copyTag = document.getElementById('copyTagText');

      const onCopied = () => {
        if (copyTag) copyTag.textContent = 'Скопировано!';
        copyCardBtn.classList.add('copied');
        showToast('Номер карты скопирован в буфер обмена!');

        setTimeout(() => {
          if (copyTag) copyTag.textContent = 'Скопировать';
          copyCardBtn.classList.remove('copied');
        }, 2500);
      };

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(cleanCard)
          .then(onCopied)
          .catch(() => {
            copyFallback(cleanCard);
            onCopied();
          });
      } else {
        copyFallback(cleanCard);
        onCopied();
      }
    });
  }

  // 5. Легковесный эффект клика (Ripple)
  const linksContainer = document.querySelector('.links-list');
  if (linksContainer) {
    linksContainer.addEventListener('click', (e) => {
      const card = e.target.closest('.link-card');
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'card-ripple';
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;

      card.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }

  // 6. Высокопроизводительные фоновые частицы (Canvas с кэшированными спрайтами)
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.getElementById('particles-canvas');

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationId = null;
    let isVisible = true;

    // Палитра частиц
    const colorDefs = [
      { r: 255, g: 170, b: 0, a: 0.8 },
      { r: 255, g: 110, b: 0, a: 0.7 },
      { r: 0, g: 229, b: 255, a: 0.75 },
      { r: 255, g: 220, b: 120, a: 0.6 }
    ];

    // Кэширование спрайтов для исключения медленного shadowBlur в цикле анимации
    const spriteSize = 32;
    const sprites = colorDefs.map(c => {
      const offscreen = document.createElement('canvas');
      offscreen.width = spriteSize;
      offscreen.height = spriteSize;
      const oCtx = offscreen.getContext('2d');
      const center = spriteSize / 2;
      const grad = oCtx.createRadialGradient(center, center, 0, center, center, center);
      grad.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`);
      grad.addColorStop(0.3, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a * 0.7})`);
      grad.addColorStop(0.7, `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a * 0.2})`);
      grad.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
      oCtx.fillStyle = grad;
      oCtx.fillRect(0, 0, spriteSize, spriteSize);
      return offscreen;
    });

    let particles = [];
    const particleCount = Math.min(28, Math.max(12, Math.floor(window.innerWidth / 35)));

    class FastParticle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.spriteIndex = Math.floor(Math.random() * sprites.length);
        this.size = Math.random() * 12 + 6;
        this.speedY = Math.random() * 0.4 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.2;
        this.opacity = Math.random() * 0.6 + 0.3;
        this.fadeSpeed = Math.random() * 0.004 + 0.002;
        this.growing = Math.random() > 0.5;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        if (this.growing) {
          this.opacity += this.fadeSpeed;
          if (this.opacity >= 0.85) this.growing = false;
        } else {
          this.opacity -= this.fadeSpeed;
          if (this.opacity <= 0.15) this.growing = true;
        }

        if (this.y < -15 || this.x < -15 || this.x > width + 15) {
          this.reset();
        }
      }

      draw() {
        ctx.globalAlpha = this.opacity;
        const sprite = sprites[this.spriteIndex];
        const half = this.size / 2;
        ctx.drawImage(sprite, this.x - half, this.y - half, this.size, this.size);
      }
    }

    function resizeCanvas() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    resizeCanvas();

    for (let i = 0; i < particleCount; i++) {
      particles.push(new FastParticle());
    }

    function renderLoop() {
      if (!isVisible) return;
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationId = requestAnimationFrame(renderLoop);
    }

    renderLoop();

    // Дебаунс ресайза
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resizeCanvas();
      }, 150);
    }, { passive: true });

    // Пауза анимации при неактивной вкладке для экономии ресурсов батареи
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isVisible = false;
        if (animationId) cancelAnimationFrame(animationId);
      } else {
        isVisible = true;
        renderLoop();
      }
    });
  }
});
