/**
 * SERBER LINKS — ИНТЕРАКТИВНЫЕ ЭФФЕКТЫ И ЛОГИКА
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Установка текущего года в подвале
  const yearEl = document.getElementById('currentYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // 2. Обработка кнопки "Поделиться" / копирования ссылки
  const shareBtn = document.getElementById('shareBtn');
  const toast = document.getElementById('toastNotification');
  let toastTimeout = null;

  function showToast(message) {
    if (!toast) return;
    if (message) {
      const textSpan = toast.querySelector('span');
      if (textSpan) textSpan.textContent = message;
    }
    
    toast.classList.add('active');
    
    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const currentUrl = window.location.href;
      
      // Если доступно нативное меню "Поделиться" на мобильных устройствах
      if (navigator.share && window.innerWidth < 768) {
        try {
          await navigator.share({
            title: 'SERBER — Ссылки и донат',
            text: 'Официальные контакты и донат SERBER',
            url: currentUrl,
          });
          return;
        } catch (err) {
          // Если пользователь отменил диалог шеринга — не показываем ошибку
          if (err.name === 'AbortError') return;
        }
      }

      // Копирование ссылки в буфер обмена
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(currentUrl)
          .then(() => showToast('Ссылка успешно скопирована!'))
          .catch(() => copyFallback(currentUrl));
      } else {
        copyFallback(currentUrl);
      }
    });
  }

  function copyFallback(text) {
    const input = document.createElement('input');
    input.value = text;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.focus();
    input.select();
    try {
      document.execCommand('copy');
      showToast('Ссылка скопирована!');
    } catch (e) {
      showToast('Не удалось скопировать');
    }
    document.body.removeChild(input);
  }

  // 3. Копирование номера карты по клику
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
        showToast('Номер карты 2202 2092 3153 2168 скопирован!');

        setTimeout(() => {
          if (copyTag) copyTag.textContent = 'Скопировать';
          copyCardBtn.classList.remove('copied');
        }, 2500);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
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

  // 3. Эффект клика (Ripple) на карточках ссылок
  const cards = document.querySelectorAll('.link-card');
  cards.forEach(card => {
    card.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.2)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple-anim 0.6s ease-out';
      ripple.style.pointerEvents = 'none';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.width = '100px';
      ripple.style.height = '100px';
      ripple.style.marginLeft = '-50px';
      ripple.style.marginTop = '-50px';

      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  });

  // Вставка стиля для ripple-анимации
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes ripple-anim {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // 4. Легкий фоновый генератор искр/частиц в графитовом пространстве
  const canvas = document.getElementById('particles-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let particles = [];
    const particleCount = Math.min(35, Math.floor(width / 30));

    // Палитра частиц: теплый оранжево-золотой огонь и неоновый циановый
    const colors = [
      'rgba(255, 170, 0, 0.7)',
      'rgba(255, 110, 0, 0.6)',
      'rgba(0, 229, 255, 0.6)',
      'rgba(255, 220, 120, 0.5)'
    ];

    class Particle {
      constructor() {
        this.reset(true);
      }

      reset(init = false) {
        this.x = Math.random() * width;
        this.y = init ? Math.random() * height : height + 10;
        this.radius = Math.random() * 1.8 + 0.6;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.speedY = Math.random() * 0.45 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.25;
        this.opacity = Math.random() * 0.6 + 0.2;
        this.fadeSpeed = Math.random() * 0.003 + 0.002;
        this.growing = Math.random() > 0.5;
      }

      update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        // Плавное мерцание
        if (this.growing) {
          this.opacity += this.fadeSpeed;
          if (this.opacity >= 0.8) this.growing = false;
        } else {
          this.opacity -= this.fadeSpeed;
          if (this.opacity <= 0.15) this.growing = true;
        }

        // Если вылетела за пределы экрана
        if (this.y < -10 || this.x < -10 || this.x > width + 10) {
          this.reset();
        }
      }

      draw() {
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.restore();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animationId;
    function render() {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
      }
      animationId = requestAnimationFrame(render);
    }

    render();

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    // Оптимизация: пауза при неактивной вкладке
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animationId);
      } else {
        render();
      }
    });
  }
});
