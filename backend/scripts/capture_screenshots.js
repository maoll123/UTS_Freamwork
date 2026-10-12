const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

async function capture() {
    const outDir = path.join(__dirname, '../../docs/screenshots');
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        defaultViewport: { width: 1280, height: 850 },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // 1. Screenshot Halaman Utama
    await page.screenshot({ path: path.join(outDir, '01_halaman_utama_katalog.png') });
    console.log('✓ 01_halaman_utama_katalog.png tersimpan');

    // 2. Screenshot Filter Kategori
    const buttons = await page.$$('.category-pill');
    if (buttons.length > 1) {
        await buttons[1].click(); // Klik kategori pertama (Elektronik & Gadget)
        await new Promise(r => setTimeout(r, 600));
        await page.screenshot({ path: path.join(outDir, '02_filter_kategori_produk.png') });
        console.log('✓ 02_filter_kategori_produk.png tersimpan');
    }

    // 3. Screenshot Modal Tambah Produk
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    const addBtn = await page.$('.btn-primary');
    if (addBtn) {
        await addBtn.click();
        await new Promise(r => setTimeout(r, 500));
        await page.screenshot({ path: path.join(outDir, '03_modal_tambah_produk.png') });
        console.log('✓ 03_modal_tambah_produk.png tersimpan');
    }

    // 4. Screenshot Security Model Inspector
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    const secBtn = await page.$('.btn-outline');
    if (secBtn) {
        await secBtn.click();
        await new Promise(r => setTimeout(r, 500));
        // Klik tombol jalankan simulasi
        const simBtn = await page.$('.modal-body .btn-primary');
        if (simBtn) {
            await simBtn.click();
            await new Promise(r => setTimeout(r, 1200));
        }
        await page.screenshot({ path: path.join(outDir, '04_modal_security_inspector.png') });
        console.log('✓ 04_modal_security_inspector.png tersimpan');
    }

    await browser.close();
    console.log('🎉 Semua tangkapan layar berhasil disimpan ke docs/screenshots!');
}

capture().catch(err => {
    console.error('Error saat capture:', err);
    process.exit(1);
});
