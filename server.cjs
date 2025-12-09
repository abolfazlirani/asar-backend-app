(async () => {
    try {
        const module = await import('./index.js'); // اگر فایل اصلیت app.js است، اینجا تغییر بده
        if (module.default) {
            module.default();
        }
    } catch (err) {
        console.error('Failed to start ESM app:', err);
    }
})();
