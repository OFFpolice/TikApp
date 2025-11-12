window.addEventListener("load", () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.enableClosingConfirmation();
        tg.disableVerticalSwipes();
        tg.requestFullscreen();
        tg.lockOrientation();
        console.log("Telegram WebApp ready", tg.initData);
    }
});
