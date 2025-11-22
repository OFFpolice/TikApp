//window.addEventListener("load", () => {

  //if (window.Telegram && window.Telegram.WebApp) {
    //const tg = window.Telegram.WebApp;

    //tg.ready();
    //tg.expand();
    //tg.enableClosingConfirmation();
    //tg.disableVerticalSwipes();
    //tg.requestFullscreen();
    //tg.lockOrientation();

    //console.log("Telegram WebApp is ready:", tg.initData);
  //} else {
    //console.warn("Telegram WebApp not found.");
  //}
//});


window.addEventListener("load", () => {
  if (window.Telegram && window.Telegram.WebApp) {
    const tg = window.Telegram.WebApp;

    tg.ready();
    tg.expand();
    tg.enableClosingConfirmation();
    tg.disableVerticalSwipes();
    tg.requestFullscreen();
    tg.lockOrientation();

    // === Viewport Fix ===
    function applyViewportHeight() {
      const vh = tg.viewportHeight; // уже даёт реальную высоту окна
      document.documentElement.style.setProperty("--tg-viewport-height", `${vh}px`);
    }

    // начальная установка
    applyViewportHeight();

    // обновлять при изменениях
    tg.onEvent("viewportChanged", applyViewportHeight);

    console.log("TG viewport height applied:", tg.viewportHeight);
  }
});