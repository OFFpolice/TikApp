document.addEventListener("DOMContentLoaded", () => {
    const downloadLink = document.getElementById("downloadLink");

    downloadLink.addEventListener("click", (e) => {
        e.preventDefault();

        const url = document.getElementById("urlInput").value;
        const fileUrl = downloadLink.href;

        const chatId = Telegram.WebApp.initDataUnsafe.user.id;

        // Прямой запрос в Telegram Bot API
        fetch(`https://api.telegram.org/bot8311557588:AAHqrK64X0qPTJR5QUd8Qzng-ZhWz-K2g0g/sendMessage`, {
            method: "POST",
            mode: "no-cors",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: `Запрошена загрузка:\n${url}\nФайл: ${fileUrl}`
            })
        });

        // затем запускаем загрузку файла
        window.location.href = fileUrl;
    });
});