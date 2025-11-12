// .static/js/script.js

class TikTokDownloader {
    constructor(config) {
        this.API_URL_V1 = config.API_URL_V1;
        this.API_URL_V2 = config.API_URL_V2;

        this.form = document.getElementById('downloadForm');
        this.urlInput = document.getElementById('urlInput');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.mediaContainer = document.getElementById('mediaContainer');
        this.videoTitle = document.getElementById('videoTitle');
        this.downloadLink = document.getElementById('downloadLink');
        this.errorMessage = document.getElementById('errorMessage');

        this.initEventListeners();
    }

    initEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    async handleSubmit(e) {
        e.preventDefault();

        const url = this.urlInput.value.trim();
        if (!url) return;

        // Базовая валидация tiktok
        if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
            this.showError('Похоже, это не ссылка на TikTok.');
            return;
        }

        this.showLoading();
        this.hideResult();
        this.hideError();
        this.clearMedia();

        try {
            const data = await this.getTikTok(url);
            if (!data) {
                throw new Error('Не удалось получить данные от API. Проверьте CORS или адрес API.');
            }
            this.displayResult(data);
        } catch (err) {
            this.showError(err.message || 'Произошла ошибка при получении медиа');
        } finally {
            this.hideLoading();
        }
    }

    // Унифицированный метод получения данных: try v1 -> v2
    async getTikTok(url) {
        // internal helper: fetch with timeout and return parsed json or null
        const fetchWithTimeout = async (fetchUrl, params = {}) => {
            const controller = new AbortController();
            const timeout = params.timeout || 20000; // ms
            const id = setTimeout(() => controller.abort(), timeout);

            try {
                const resp = await fetch(fetchUrl, {
                    method: 'GET',
                    signal: controller.signal,
                });
                clearTimeout(id);
                if (!resp.ok) return { ok: false, status: resp.status };
                const json = await resp.json();
                return { ok: true, data: json };
            } catch (err) {
                clearTimeout(id);
                // fetch can throw TypeError for network/CORS errors, or AbortError for timeout
                return { ok: false, error: err };
            }
        };

        // Собираем URL'ы запросов: передаём исходную ссылку как query param ?url=...
        const makeUrl = (base, originalUrl) => {
            if (!base) return null;
            // если base уже содержит query string, используем &
            const sep = base.includes('?') ? '&' : '?';
            return `${base}${sep}url=${encodeURIComponent(originalUrl)}`;
        };

        // 1) Попытка API v1
        if (this.API_URL_V1) {
            const v1Url = makeUrl(this.API_URL_V1, url);
            try {
                const res = await fetchWithTimeout(v1Url, { timeout: 20000 });
                if (res.ok && res.data) {
                    // Попробуем привести структуру к единому виду, аналогично backend
                    const data = res.data;
                    const video_data = (data && data.data) ? data.data : {};
                    // check images first (image_post_info)
                    const images = (video_data.image_post_info && video_data.image_post_info.images) || [];
                    const image_urls = images
                        .filter(img => img && img.display_image && Array.isArray(img.display_image.url_list))
                        .map(img => img.display_image.url_list[0])
                        .filter(Boolean);
                    if (image_urls.length > 0) {
                        return {
                            video: null,
                            desc: video_data.desc || '',
                            data_size: 0,
                            images: image_urls
                        };
                    }
                    const video = (video_data.video && video_data.video.play_addr && Array.isArray(video_data.video.play_addr.url_list))
                        ? video_data.video.play_addr.url_list[0]
                        : (video_data.video && video_data.video.play_addr && video_data.video.play_addr.url) || null;
                    const data_size = (video_data.video && video_data.video.play_addr && video_data.video.play_addr.data_size) || 0;
                    const desc = video_data.desc || '';

                    if (video) {
                        return { video, desc, data_size, images: [] };
                    }
                    // если v1 вернула не то, пробуем v2
                } else {
                    // неудача: статус != 200 или network/CORS
                    console.warn('API v1 failed', res.status || res.error);
                }
            } catch (err) {
                console.warn('API v1 exception', err);
            }
        }

        // 2) Попытка API v2 (резервный)
        if (this.API_URL_V2) {
            const v2Url = makeUrl(this.API_URL_V2, url);
            try {
                const res = await fetchWithTimeout(v2Url, { timeout: 20000 });
                if (res.ok && res.data) {
                    const data = res.data;
                    // ожидаем структуру { code: 0, data: { play, title, size, images } } как в бекенде
                    if (data.code !== undefined && data.code !== 0) {
                        console.warn('API v2 returned non-zero code', data.code);
                    } else {
                        const result = data.data || data; // fallback
                        const video = result.play || null;
                        const desc = result.title || 'No description';
                        const data_size = result.size || 0;
                        const images = result.images || [];
                        if (video || (Array.isArray(images) && images.length > 0)) {
                            return { video, desc, data_size, images };
                        }
                    }
                } else {
                    console.warn('API v2 failed', res.status || res.error);
                }
            } catch (err) {
                console.warn('API v2 exception', err);
            }
        }

        // оба варианта не дали результата
        return null;
    }

    // Отрисовка результата (строим DOM безопасно)
    displayResult(data) {
        this.clearMedia();
        this.videoTitle.textContent = data.desc || 'Без описания';

        if (data.video) {
            // Создаём video элемент
            const wrapper = document.createElement('div');
            wrapper.className = 'video-preview';

            const video = document.createElement('video');
            video.controls = true;
            video.style.width = '100%';
            video.style.maxHeight = '400px';
            video.setAttribute('playsinline', '');
            // source
            const source = document.createElement('source');
            source.src = data.video;
            source.type = 'video/mp4';
            video.appendChild(source);
            wrapper.appendChild(video);
            this.mediaContainer.appendChild(wrapper);

            this.downloadLink.href = data.video;
            // предложить имя файла
            const safeName = this.slugify(this.videoTitle.textContent || 'tiktok_video');
            this.downloadLink.setAttribute('download', `${safeName}.mp4`);
            this.downloadLink.style.display = 'inline-flex';
            this.downloadLink.textContent = '';
            const icon = document.createElement('i'); icon.className = 'fas fa-download';
            this.downloadLink.appendChild(icon);
            const txt = document.createTextNode(' Скачать видео');
            this.downloadLink.appendChild(txt);
        } else if (data.images && data.images.length > 0) {
            const gallery = document.createElement('div');
            gallery.className = 'image-gallery';

            data.images.forEach((imgUrl, idx) => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = `Изображение ${idx+1}`;
                img.loading = 'lazy';
                gallery.appendChild(img);
            });

            this.mediaContainer.appendChild(gallery);

            if (data.images.length === 1) {
                this.downloadLink.href = data.images[0];
                const safeName = this.slugify(this.videoTitle.textContent || 'tiktok_image');
                // попытаемся угадать расширение из URL
                const ext = this.extractExtension(data.images[0]) || 'jpg';
                this.downloadLink.setAttribute('download', `${safeName}.${ext}`);
                this.downloadLink.textContent = '';
                const icon = document.createElement('i'); icon.className = 'fas fa-download';
                this.downloadLink.appendChild(icon);
                const txt = document.createTextNode(' Скачать изображение');
                this.downloadLink.appendChild(txt);
                this.downloadLink.style.display = 'inline-flex';
            } else {
                // несколько изображений: скрываем кнопку (можно добавить zip-функцию, но выходит за scope)
                this.downloadLink.style.display = 'none';
            }
        }

        this.showResult();
    }

    clearMedia() {
        this.mediaContainer.innerHTML = '';
        // reset download link
        this.downloadLink.href = '#';
        this.downloadLink.style.display = 'none';
        this.downloadLink.removeAttribute('download');
        this.downloadLink.textContent = '';
    }

    showLoading() {
        this.downloadBtn.disabled = true;
        this.loading.classList.remove('hidden');
    }

    hideLoading() {
        this.downloadBtn.disabled = false;
        this.loading.classList.add('hidden');
    }

    showResult() {
        this.result.classList.remove('hidden');
    }

    hideResult() {
        this.result.classList.add('hidden');
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.error.classList.remove('hidden');
    }

    hideError() {
        this.error.classList.add('hidden');
    }

    // Простейшая "чистка" для имени файла
    slugify(text) {
        return String(text).toLowerCase()
            .replace(/[^a-z0-9\u0400-\u04FF]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 80) || 'file';
    }

    extractExtension(url) {
        try {
            const u = new URL(url);
            const path = u.pathname;
            const parts = path.split('.');
            if (parts.length > 1) {
                const ext = parts.pop().split(/\W/)[0];
                return ext.toLowerCase();
            }
        } catch (e) {
            // ignore
        }
        return null;
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.APP_CONFIG || {};
    if (!cfg.API_URL_V1 && !cfg.API_URL_V2) {
        console.error('APP_CONFIG не настроен: укажите API_URL_V1 и/или API_URL_V2');
    }
    const app = new TikTokDownloader(cfg);
});