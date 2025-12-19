const mediaContainer = document.getElementById('mediaContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const yearFilter = document.getElementById('yearFilter');

let allMedia = [];
let favoriler = JSON.parse(localStorage.getItem('favoriler')) || [];

// 1. VERİLERİ GETİR
const loader = document.getElementById('loadingSpinner');

async function verileriGetir() {
    // Yükleme başladığında loader'ı göster
    loader.style.display = 'block';
    mediaContainer.style.opacity = '0.5'; // İçeriği biraz soluklaştır

    try {
        // Yapay bir gecikme ekleyerek loader'ın göründüğünden emin olabiliriz (isteğe bağlı)
        // await new Promise(r => setTimeout(r, 800)); 
        
        const cevap = await fetch('data.json');
        const veri = await cevap.json();
        allMedia = veri;
        yillariDoldur(); 
        ekranaBas(allMedia); 
    } catch (hata) {
        console.error('Hata:', hata);
        mediaContainer.innerHTML = '<h2 class="no-content">Hata oluştu.</h2>';
    } finally {
        // İşlem bitince (başarılı veya hatalı) loader'ı gizle
        loader.style.display = 'none';
        mediaContainer.style.opacity = '1';
    }
}

// 2. YILLARI DOLDUR
function yillariDoldur() {
    yearFilter.innerHTML = '<option value="all">Tüm Yıllar</option>';
    const donemler = [
        { etiket: "2020 ve Sonrası", min: 2020, max: 9999 },
        { etiket: "2010 - 2019", min: 2010, max: 2019 },
        { etiket: "2000 - 2009", min: 2000, max: 2009 },
        { etiket: "1990 - 1999", min: 1990, max: 1999 },
        { etiket: "Eskiler (1990 Öncesi)", min: 0, max: 1989 }
    ];
    donemler.forEach(donem => {
        const option = document.createElement('option');
        option.value = `${donem.min}-${donem.max}`;
        option.textContent = donem.etiket;
        yearFilter.appendChild(option);
    });
}

// 3. EKRANA BASMA
// script.js içindeki ekranaBas fonksiyonunun güncellenmiş hali:
function ekranaBas(liste) {
    mediaContainer.innerHTML = '';
    if (liste.length === 0) {
        mediaContainer.innerHTML = '<h3 class="no-content">İçerik bulunamadı.</h3>';
        return;
    }

    // index parametresini ekledik
    liste.forEach((medya, index) => { 
        const kart = document.createElement('article');
        kart.classList.add('card');
        
        // --- YENİ EKLENEN KISIM: Animasyon Gecikmesi ---
        // Her kart bir öncekinden 0.1 saniye sonra gelsin.
        // En fazla 2 saniye gecikme olsun (çok eleman varsa kullanıcı beklemesin)
        const delay = Math.min(index * 0.1, 2); 
        kart.style.animationDelay = `${delay}s`;
        // -----------------------------------------------

        const isFav = favoriler.includes(medya.id);
        const kalpSinifi = isFav ? 'fa-solid' : 'fa-regular'; 
        const aktifSinif = isFav ? 'active' : '';
        
        let puanClass = 'score-low';
        if (medya.puan >= 8) puanClass = 'score-high';
        else if (medya.puan >= 6) puanClass = 'score-medium';

        kart.innerHTML = `
            <i class="${kalpSinifi} fa-heart fav-icon ${aktifSinif}" onclick="favoriToggle(event, ${medya.id})"></i>
            <div class="img-wrapper"> <img src="${medya.poster}" alt="${medya.baslik}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x450?text=Resim+Yok'">
            </div>
            <div class="card-info">
                <h3>${medya.baslik}</h3>
                <div class="meta">
                    <span>${medya.yil}</span>
                    <span>${medya.tur}</span>
                    <span class="${puanClass}">★ ${medya.puan}</span>
                </div>
            </div>
        `;
        
        kart.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fav-icon')) {
                detayGoster(medya);
            }
        });
        mediaContainer.appendChild(kart);
    });
}

// 4. FAVORİ İŞLEMİ
function favoriToggle(event, id) {
    event.stopPropagation();
    if (favoriler.includes(id)) {
        favoriler = favoriler.filter(favId => favId !== id);
    } else {
        favoriler.push(id);
    }
    localStorage.setItem('favoriler', JSON.stringify(favoriler));
    
    const kalp = event.target;
    kalp.classList.toggle('fa-solid');
    kalp.classList.toggle('fa-regular');
    kalp.classList.toggle('active');

    // Eğer favoriler sekmesindeysek listeyi anlık güncelle
    const aktifButon = document.querySelector('.filter-btn.active');
    if (aktifButon && aktifButon.getAttribute('data-category') === 'favorites') {
        ekranaBas(allMedia.filter(item => favoriler.includes(item.id)));
    }
}

// 5. DETAY GÖSTER (MODAL)
function detayGoster(medya) {
    const yaraticiBaslik = medya.tur === 'Kitap' ? 'Yazar' : 'Yönetmen';
    const yaraticiBilgi = medya.tur === 'Kitap' ? medya.yazar : medya.yonetmen;

    // Puan class belirleme
    let puanClass = 'score-low';
    if (medya.puan >= 8) puanClass = 'score-high';
    else if (medya.puan >= 6) puanClass = 'score-medium';

    let kadroHTML = '';
    if (medya.oyuncular) {
        kadroHTML = medya.oyuncular.map(kisi => `
            <div class="cast-member" onclick="kisiyeGoreFiltrele('${kisi.ad.replace(/'/g, "\\'")}')" title="${kisi.ad}">
                <img src="${kisi.foto}" alt="${kisi.ad}" onerror="this.src='https://ui-avatars.com/api/?name=${kisi.ad}'">
                <p>${kisi.ad}</p>
            </div>
        `).join('');
    }

    // Inline style'lar temizlendi, class'lar eklendi
    modalBody.innerHTML = `
        <div class="modal-body-wrapper">
            <div class="modal-left">
                <img src="${medya.poster}" alt="${medya.baslik}">
            </div>
            <div class="modal-right">
                <h2>${medya.baslik}</h2>
                
                <div class="modal-tags">
                    <span class="tag-badge">${medya.yil}</span>
                    <span class="tag-badge">${medya.tur}</span>
                    <span class="${puanClass}">★ ${medya.puan}</span>
                </div>

                <p class="modal-desc">${medya.ozet}</p>
                
                <div class="creator-section" onclick="kisiyeGoreFiltrele('${yaraticiBilgi.ad.replace(/'/g, "\\'")}')" title="Diğer eserlerini gör">
                    <h4 class="section-title">${yaraticiBaslik}</h4>
                    <div class="creator-content">
                        <img class="creator-img" src="${yaraticiBilgi.foto}">
                        <span class="creator-name">${yaraticiBilgi.ad}</span>
                    </div>
                </div>

                ${kadroHTML ? `<h4 class="section-title">Kadro</h4><div class="cast-list">${kadroHTML}</div>` : ''}
                
                <button class="back-btn" onclick="document.getElementById('modal').style.display='none'">
                    <i class="fa-solid fa-arrow-left"></i> Geri Dön
                </button>
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

// 6. KİŞİ FİLTRELEME
function kisiyeGoreFiltrele(isim) {
    modal.style.display = 'none';
    searchInput.value = isim;
    aramaYap(isim);
    // Sayfayı yukarı kaydır
    mediaContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 7. ARAMA VE FİLTRELEME
function aramaYap(text) {
    const term = text.toLowerCase();
    ekranaBas(allMedia.filter(item => 
        item.baslik.toLowerCase().includes(term) || 
        (item.yonetmen && item.yonetmen.ad.toLowerCase().includes(term)) ||
        (item.yazar && item.yazar.ad.toLowerCase().includes(term)) ||
        (item.oyuncular && item.oyuncular.some(o => o.ad.toLowerCase().includes(term)))
    ));
}

searchInput.addEventListener('input', (e) => aramaYap(e.target.value));

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const kategori = btn.getAttribute('data-category');
        if (kategori === 'all') ekranaBas(allMedia);
        else if (kategori === 'favorites') ekranaBas(allMedia.filter(item => favoriler.includes(item.id)));
        else ekranaBas(allMedia.filter(item => item.tur === kategori));
    });
});

yearFilter.addEventListener('change', (e) => {
    if(e.target.value === 'all') ekranaBas(allMedia);
    else {
        const [min, max] = e.target.value.split('-').map(Number);
        ekranaBas(allMedia.filter(item => item.yil >= min && item.yil <= max));
    }
});

// Modal Kapatma
window.addEventListener('click', (e) => { 
    if (e.target === modal) modal.style.display = 'none'; 
});
if(closeBtn) {
    closeBtn.addEventListener('click', () => modal.style.display = 'none');
}

// Başlat
verileriGetir();