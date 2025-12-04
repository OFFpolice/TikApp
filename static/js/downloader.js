// .static/js/downloader.js

class TikTokDownloader {
    constructor(config) {
        this.API_URL = config.API_URL;

        this.form = document.getElementById('downloadForm');
        this.urlInput = document.getElementById('urlInput');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.loading = document.getElementById('loading');
        this.result = document.getElementById('result');
        this.error = document.getElementById('error');
        this.mediaContainer = document.getElementById('mediaContainer');
        this.videoTitle = document.getElementById('videoTitle');
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

    async getTikTok(url) {
        const fetchWithTimeout = async (fetchUrl, params = {}) => {
            const controller = new AbortController();
            const timeout = params.timeout || 20000;
            const id = setTimeout(() => controller.abort(), timeout);

            try {
                const resp = await fetch(fetchUrl, { method: 'GET', signal: controller.signal });
                clearTimeout(id);
                if (!resp.ok) return { ok: false, status: resp.status };
                const json = await resp.json();
                return { ok: true, data: json };
            } catch (err) {
                clearTimeout(id);
                return { ok: false, error: err };
            }
        };

        if (!this.API_URL) return null;

        const sep = this.API_URL.includes('?') ? '&' : '?';
        const v2Url = `${this.API_URL}${sep}url=${encodeURIComponent(url)}`;

        try {
            const res = await fetchWithTimeout(v2Url, { timeout: 20000 });
            if (res.ok && res.data) {
                const data = res.data;
                if (data.code !== undefined && data.code !== 0) {
                    console.warn('API returned non-zero code', data.code);
                    return null;
                }
                const result = data.data || data;
                const video = result.play || null;
                const desc = result.title || 'No description';
                const images = result.images || [];
                const data_size = result.size || 0;

                if (video || (Array.isArray(images) && images.length > 0)) {
                    return { video, desc, data_size, images };
                }
            } else {
                console.warn('API failed', res.status || res.error);
            }
        } catch (err) {
            console.warn('API exception', err);
        }

        return null;
    }

    displayResult(data) {
        this.clearMedia();
        this.videoTitle.textContent = data.desc || 'Без описания';

        if (data.video) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-preview';

            const video = document.createElement('video');
            video.controls = true;
            video.style.width = '100%';
            video.style.maxHeight = '400px';
            video.setAttribute('playsinline', '');
            const source = document.createElement('source');
            source.src = data.video;
            source.type = 'video/mp4';
            video.appendChild(source);
            wrapper.appendChild(video);
            this.mediaContainer.appendChild(wrapper);
        } else if (data.images && data.images.length > 0) {
            const gallery = document.createElement('div');
            gallery.className = 'image-gallery';

            data.images.forEach((imgUrl, idx) => {
                const img = document.createElement('img');
                img.src = imgUrl;
                img.alt = `Изображение ${idx + 1}`;
                img.loading = 'lazy';
                gallery.appendChild(img);
            });

            this.mediaContainer.appendChild(gallery);
        }

        this.showResult();
    }

    clearMedia() {
        this.mediaContainer.innerHTML = '';
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
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.APP_CONFIG || {};
    if (!cfg.API_URL) {
        console.error('APP_CONFIG не настроен: укажите API_URL');
    }
    new TikTokDownloader(cfg);
});