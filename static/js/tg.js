window.addEventListener("load", () => {
  // 1. Скрываем preloader
  document.body.classList.remove("loading");

  // 2. Проверяем, что WebApp доступен
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    tg.ready();                         // Инициализация
    tg.expand();                        // Расширяет WebApp на экран (можно убрать, если fullscreen)
    tg.enableClosingConfirmation();     // Включает подтверждение закрытия
    tg.disableVerticalSwipes();         // Блокирует вертикальные свайпы
    tg.requestFullscreen();             // Запрос fullscreen
    tg.lockOrientation();               // Блокирует ориентацию (обычно вертикально)

    console.log("Telegram WebApp is ready:", tg.initData);
  } else {
    console.warn("Telegram WebApp not found.");
  }
});
