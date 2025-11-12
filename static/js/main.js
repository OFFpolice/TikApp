// Скрытие preloader после полной загрузки страницы
window.addEventListener('load', () => {
    document.body.classList.remove('loading');
});
