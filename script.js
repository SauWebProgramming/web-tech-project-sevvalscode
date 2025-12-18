const mediaContainer = document.getElementById('mediaContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const yearFilter = document.getElementById('yearFilter');

let allMedia = [];

// Verileri Getir
async function verileriGetir() {
    try {
        const cevap = await fetch('data.json');
        const veri = await cevap.json();
        allMedia = veri;
        
        yillariDoldur(); // Yılları aralık olarak doldur
        ekranaBas(allMedia); 
    } catch (hata) {
        console.error('Hata:', hata);
        mediaContainer.innerHTML = '<h2>Veriler yüklenirken hata oluştu.</h2>';
    }
}

// --- YENİ: Yılları Aralık Olarak Doldurma ---
function yillariDoldur() {
    // Mevcut içeriği temizle ama "Tüm Yıllar" kalsın
    yearFilter.innerHTML = '<option value="all">Tüm Zamanlar</option>';

    // Aralıkları biz belirliyoruz
    const donemler = [
        { etiket: "2020 ve Sonrası", min: 2020, max: 9999 },
        { etiket: "2010 - 2019", min: 2010, max: 2019 },
        { etiket: "2000 - 2009", min: 2000, max: 2009 },
        { etiket: "1990 - 1999", min: 1990, max: 1999 },
        { etiket: "Eskiler (1990 Öncesi)", min: 0, max: 1989 }
    ];

    donemler.forEach(donem => {
        const option = document.createElement('option');
        // Value kısmına min ve max değerlerini gizlice koyuyoruz (ör: "2010-2019")
        option.value = `${donem.min}-${donem.max}`;
        option.textContent = donem.etiket;
        yearFilter.appendChild(option);
    });
}

// Ekrana Basma
function ekranaBas(liste) {
    mediaContainer.innerHTML = '';

    if (liste.length === 0) {
        mediaContainer.innerHTML = '<h2 style="grid-column: 1/-1; text-align:center; color:#777;">Bu kriterde içerik bulunamadı :(</h2>';
        return;
    }

    liste.forEach(medya => {
        const kart = document.createElement('div');
        kart.classList.add('card');
        
        const puanRenk = medya.puan >= 8 ? '#46d369' : (medya.puan >= 6 ? '#ffd700' : '#e50914');

        kart.innerHTML = `
            <img src="${medya.poster}" alt="${medya.baslik}" onerror="this.src='https://via.placeholder.com/300x450?text=Resim+Yok'">
            <div class="card-info">
                <h3>${medya.baslik}</h3>
                <div class="meta">
                    <span>${medya.yil}</span>
                    <span>${medya.tur}</span>
                    <span style="color:${puanRenk}">★ ${medya.puan}</span>
                </div>
            </div>
        `;

        kart.addEventListener('click', () => detayGoster(medya));
        mediaContainer.appendChild(kart);
    });
}

// Detay Penceresi (Modal)
function detayGoster(medya) {
    const yaraticiBaslik = medya.tur === 'Kitap' ? 'Yazar' : 'Yönetmen';
    const yaraticiBilgi = medya.tur === 'Kitap' ? medya.yazar : medya.yonetmen;

    let kadroHTML = '';
    if (medya.oyuncular && medya.oyuncular.length > 0) {
        kadroHTML = medya.oyuncular.map(kisi => `
            <div class="cast-member" onclick="kisiyeGoreFiltrele('${kisi.ad}')" style="cursor:pointer" title="${kisi.ad}">
                <img src="${kisi.foto}" alt="${kisi.ad}" onerror="this.src='https://ui-avatars.com/api/?name=${kisi.ad}&background=random'">
                <p>${kisi.ad}</p>
            </div>
        `).join('');
    }

    modalBody.innerHTML = `
        <div class="modal-left">
            <img src="${medya.poster}" alt="${medya.baslik}">
        </div>
        <div class="modal-right">
            <h2>${medya.baslik}</h2>
            <div class="modal-tags">
                <span>${medya.yil}</span>
                <span>${medya.tur}</span>
                <span style="color:#46d369">★ ${medya.puan}</span>
            </div>
            <p class="ozet">${medya.ozet}</p>
            
            <div class="creator-section" onclick="kisiyeGoreFiltrele('${yaraticiBilgi.ad}')" style="cursor:pointer; margin-top:20px;">
                <h3>${yaraticiBaslik}</h3>
                <div class="cast-list">
                     <div class="cast-member">
                        <img src="${yaraticiBilgi.foto}" alt="${yaraticiBilgi.ad}" onerror="this.src='https://ui-avatars.com/api/?name=${yaraticiBilgi.ad}&background=random'">
                        <p>${yaraticiBilgi.ad}</p>
                    </div>
                </div>
            </div>

            ${kadroHTML ? `<h3>Kadro / Karakterler</h3><div class="cast-list">${kadroHTML}</div>` : ''}
        </div>
    `;

    modal.style.display = 'flex';
}

function kisiyeGoreFiltrele(isim) {
    modal.style.display = 'none';
    searchInput.value = isim;
    aramaYap(isim);
}

function aramaYap(arananMetin) {
    const term = arananMetin.toLowerCase();
    
    const filtrelenmis = allMedia.filter(item => {
        const baslikVar = item.baslik.toLowerCase().includes(term);
        const yaraticiVar = (item.yonetmen && item.yonetmen.ad.toLowerCase().includes(term)) || 
                            (item.yazar && item.yazar.ad.toLowerCase().includes(term));
        const oyuncuVar = item.oyuncular && item.oyuncular.some(o => o.ad.toLowerCase().includes(term));

        return baslikVar || yaraticiVar || oyuncuVar;
    });

    ekranaBas(filtrelenmis);
}

// --- YENİ: Yıl Filtreleme Mantığı (Aralığa Göre) ---
yearFilter.addEventListener('change', (e) => {
    const secilen = e.target.value;

    if (secilen === 'all') {
        ekranaBas(allMedia);
    } else {
        // Value "2010-2019" gibi geliyor, tireden bölüp sayıya çeviriyoruz
        const [min, max] = secilen.split('-').map(Number);
        
        // Medyanın yılı bu aralıkta mı diye bakıyoruz
        const filtrelenmis = allMedia.filter(item => item.yil >= min && item.yil <= max);
        ekranaBas(filtrelenmis);
    }
});

searchInput.addEventListener('input', (e) => aramaYap(e.target.value));

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const kategori = btn.getAttribute('data-category');
        
        if (kategori === 'all') {
            ekranaBas(allMedia);
        } else {
            ekranaBas(allMedia.filter(item => item.tur === kategori));
        }
    });
});

closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

verileriGetir();