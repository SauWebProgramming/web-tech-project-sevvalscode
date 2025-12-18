// HTML sayfasındaki önemli yerleri seçip değişkenlere atıyoruz
const mediaContainer = document.getElementById('mediaContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const filterBtns = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

// Tüm verileri bu boş kutuda tutacağız
let allMedia = [];

// 1. ADIM: Verileri JSON dosyasından çekip getiren fonksiyon (Garson)
// Ödevde istenen "async/await" ve "fetch" yapısı
async function verileriGetir() {
    try {
        const cevap = await fetch('data.json'); // Mutfağa git
        const veri = await cevap.json(); // Tepsiyi al
        
        allMedia = veri; // Verileri global değişkenimize kaydet
        ekranaBas(allMedia); // Ve hemen ekrana bas

    } catch (hata) {
        console.error('Veri çekilemedi:', hata);
        mediaContainer.innerHTML = '<h2>Veriler yüklenirken bir hata oluştu :(</h2>';
    }
}

// 2. ADIM: Verileri HTML kartlarına dönüştürüp ekrana basan fonksiyon
function ekranaBas(liste) {
    mediaContainer.innerHTML = ''; // Önce ekranı temizle

    // Liste boşsa uyarı ver
    if (liste.length === 0) {
        mediaContainer.innerHTML = '<h2>Aradığınız kriterde içerik bulunamadı.</h2>';
        return;
    }

    // Her bir medya (film/dizi) için döngü kuruyoruz
    liste.forEach(medya => {
        // Yeni bir kart kutusu oluştur
        const kart = document.createElement('div');
        kart.classList.add('card');
        
        // Kartın içine resim ve yazılarını doldur
        kart.innerHTML = `
            <img src="${medya.poster}" alt="${medya.baslik}">
            <div class="card-info">
                <h3>${medya.baslik}</h3>
                <div class="meta">
                    <span>${medya.yil}</span>
                    <span>${medya.tur}</span>
                    <span class="rating">★ ${medya.puan}</span>
                </div>
            </div>
        `;

        // Karta tıklanınca detayı aç (Modal)
        kart.addEventListener('click', () => detayGoster(medya));

        // Hazırladığımız kartı ana sahneye koy
        mediaContainer.appendChild(kart);
    });
}

// 3. ADIM: Filtreleme Butonlarının Çalışması
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Önce hepsinden "active" sınıfını kaldır
        filterBtns.forEach(b => b.classList.remove('active'));
        // Tıklanan butona "active" ekle
        btn.classList.add('active');

        const kategori = btn.getAttribute('data-category');

        if (kategori === 'all') {
            ekranaBas(allMedia); // Hepsini göster
        } else {
            // Sadece kategorisi uyanları filtrele
            const filtrelenmis = allMedia.filter(item => item.tur === kategori);
            ekranaBas(filtrelenmis);
        }
    });
});

// 4. ADIM: Arama Kutusu Mantığı
searchInput.addEventListener('input', (e) => {
    const aranan = e.target.value.toLowerCase(); // Yazılanı küçük harfe çevir

    const filtrelenmis = allMedia.filter(item => 
        item.baslik.toLowerCase().includes(aranan)
    );

    ekranaBas(filtrelenmis);
});

// 5. ADIM: Detay Penceresini (Modal) Doldurma ve Açma
function detayGoster(medya) {
    // Oyuncuları HTML listesine çevir
    let oyuncularHTML = '';
    if (medya.oyuncular && medya.oyuncular.length > 0) {
        oyuncularHTML = medya.oyuncular.map(oyuncu => `
            <div class="cast-member">
                <img src="${oyuncu.foto}" alt="${oyuncu.ad}">
                <p>${oyuncu.ad}</p>
            </div>
        `).join('');
    }

    // Modalın içini doldur
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
            <p>${medya.ozet}</p>
            
            <h3>Yönetmen</h3>
            <div class="cast-list">
                 <div class="cast-member">
                    <img src="${medya.yonetmen.foto}" alt="${medya.yonetmen.ad}">
                    <p>${medya.yonetmen.ad}</p>
                </div>
            </div>

            <h3>Oyuncular</h3>
            <div class="cast-list">
                ${oyuncularHTML}
            </div>
        </div>
    `;

    // Modalı görünür yap
    modal.style.display = 'flex';
}

// Modalı Kapatma İşlemleri
closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.style.display = 'none';
    }
});

// Sayfa ilk açıldığında verileri çekmeye başla
verileriGetir();