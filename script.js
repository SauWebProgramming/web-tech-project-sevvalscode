/* --- GÜNCELLENMİŞ SCRIPT.JS (Favori ve Kategori Düzeltmesi) --- */

const mediaContainer = document.getElementById('mediaContainer');
const searchInput = document.getElementById('searchInput');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');
const yearFilter = document.getElementById('yearFilter');

let allMedia = [];
// LocalStorage'dan favorileri çek (Sayıya çevirmeyi unutma)
let favoriler = JSON.parse(localStorage.getItem('favoriler')) || [];

// 1. VERİLERİ GETİR
async function verileriGetir() {
    try {
        const cevap = await fetch('data.json');
        const veri = await cevap.json();
        allMedia = veri;
        
        yillariDoldur(); 
        ekranaBas(allMedia); 
    } catch (hata) {
        console.error('Hata:', hata);
        mediaContainer.innerHTML = '<h2>Veriler yüklenirken hata oluştu.</h2>';
    }
}

// 2. YILLARI DOLDUR
function yillariDoldur() {
    yearFilter.innerHTML = '<option value="all">Tüm Zamanlar</option>';
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

// 3. EKRANA BASMA (Kalp ve Filtre Kontrolü ile)
function ekranaBas(liste) {
    mediaContainer.innerHTML = '';

    if (liste.length === 0) {
        mediaContainer.innerHTML = '<h2 style="grid-column: 1/-1; text-align:center; color:#777;">Bu kategoride içerik bulunamadı.</h2>';
        return;
    }

    liste.forEach(medya => {
        const kart = document.createElement('div');
        kart.classList.add('card');
        
        // Favori kontrolü (ID eşleşmesi)
        const isFav = favoriler.includes(medya.id);
        const kalpSinifi = isFav ? 'fa-solid' : 'fa-regular'; 
        const aktifSinif = isFav ? 'active' : '';

        const puanRenk = medya.puan >= 8 ? '#46d369' : (medya.puan >= 6 ? '#ffd700' : '#e50914');

        kart.innerHTML = `
            <i class="${kalpSinifi} fa-heart fav-icon ${aktifSinif}" onclick="favoriToggle(event, ${medya.id})"></i>
            
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

        kart.addEventListener('click', (e) => {
            if (!e.target.classList.contains('fav-icon')) detayGoster(medya);
        });
        
        mediaContainer.appendChild(kart);
    });
}

// 4. FAVORI EKLE/ÇIKAR
function favoriToggle(event, id) {
    event.stopPropagation();
    
    // ID sayı mı string mi karmaşası olmasın, gelen ID'yi olduğu gibi kullanıyoruz
    if (favoriler.includes(id)) {
        favoriler = favoriler.filter(favId => favId !== id); // Çıkar
    } else {
        favoriler.push(id); // Ekle
    }

    localStorage.setItem('favoriler', JSON.stringify(favoriler));
    
    // Görsel güncelleme
    const kalp = event.target;
    kalp.classList.toggle('fa-solid');
    kalp.classList.toggle('fa-regular');
    kalp.classList.toggle('active');

    // Eğer şu an "Favorilerim" sekmesindeysek, çıkardığımız an ekrandan da gitsin
    const aktifButon = document.querySelector('.filter-btn.active');
    if (aktifButon && aktifButon.getAttribute('data-category') === 'favorites') {
        const guncelListe = allMedia.filter(item => favoriler.includes(item.id));
        ekranaBas(guncelListe);
    }
}

// 5. KATEGORİ BUTONLARI (DÜZELTİLEN YER) 🛠️
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Aktif sınıfını değiştir
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // HTML'den kategoriyi al ("Film", "Dizi", "favorites" vb.)
        const kategori = btn.getAttribute('data-category');
        
        if (kategori === 'all') {
            ekranaBas(allMedia);
        } 
        else if (kategori === 'favorites') { 
            // Favoriler dizisindeki ID'lerle eşleşen medyaları bul
            const favoriMedyalar = allMedia.filter(item => favoriler.includes(item.id));
            ekranaBas(favoriMedyalar);
        } 
        else {
            // "Film" === "Film" eşleşmesi yap
            const filtrelenmis = allMedia.filter(item => item.tur === kategori);
            ekranaBas(filtrelenmis);
        }
    });
});

// 6. DİĞER FONKSİYONLAR (Detay, Arama, Yıl vb.)
// (Burayı kısa tuttum, mevcut kodundaki detayGoster, aramaYap vb. aynen kalabilir)
// Sadece yukarıdaki 'filterBtns' kısmını güncellemen yeterli olacaktır.
// Ama garanti olsun diye Detay fonksiyonunu da ekliyorum:

function detayGoster(medya) {
    const yaraticiBaslik = medya.tur === 'Kitap' ? 'Yazar' : 'Yönetmen';
    const yaraticiBilgi = medya.tur === 'Kitap' ? medya.yazar : medya.yonetmen;
    let kadroHTML = '';
    if (medya.oyuncular) {
        kadroHTML = medya.oyuncular.map(kisi => `
            <div class="cast-member" onclick="kisiyeGoreFiltrele('${kisi.ad}')" style="cursor:pointer">
                <img src="${kisi.foto}" alt="${kisi.ad}" onerror="this.src='https://ui-avatars.com/api/?name=${kisi.ad}'">
                <p>${kisi.ad}</p>
            </div>
        `).join('');
    }
    modalBody.innerHTML = `
        <div class="modal-left"><img src="${medya.poster}" alt=""></div>
        <div class="modal-right">
            <h2>${medya.baslik}</h2>
            <div class="modal-tags"><span>${medya.yil}</span><span>${medya.tur}</span><span>★ ${medya.puan}</span></div>
            <p>${medya.ozet}</p>
            <div style="margin-top:20px;"><h3>${yaraticiBaslik}</h3>
            <div class="cast-list"><div class="cast-member"><img src="${yaraticiBilgi.foto}"><p>${yaraticiBilgi.ad}</p></div></div></div>
            ${kadroHTML ? `<h3>Kadro</h3><div class="cast-list">${kadroHTML}</div>` : ''}
        </div>
    `;
    modal.style.display = 'flex';
}

function kisiyeGoreFiltrele(isim) {
    modal.style.display = 'none';
    searchInput.value = isim;
    aramaYap(isim);
}

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
yearFilter.addEventListener('change', (e) => {
    if(e.target.value === 'all') ekranaBas(allMedia);
    else {
        const [min, max] = e.target.value.split('-').map(Number);
        ekranaBas(allMedia.filter(item => item.yil >= min && item.yil <= max));
    }
});
closeBtn.addEventListener('click', () => modal.style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });

verileriGetir();