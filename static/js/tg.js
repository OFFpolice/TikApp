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

    console.log("Telegram WebApp is ready:", tg.initData);

    // --- ГЛАВНОЕ: обновляем высоты Mini App ---
    document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
    document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);

    // Обновление при изменении размеров (потягивание Mini App вверх)
    tg.onEvent('viewportChanged', () => {
      document.documentElement.style.setProperty('--tg-viewport-height', `${tg.viewportHeight}px`);
      document.documentElement.style.setProperty('--tg-viewport-stable-height', `${tg.viewportStableHeight}px`);
    });

  } else {
    console.warn("Telegram WebApp not found.");
  }
});
