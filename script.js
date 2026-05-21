// UYARI: Eski API anahtarını silip buraya YENİ oluşturduğun anahtarı yapıştır!
const API_KEY = 'BURAYA_YENI_API_ANAHTARINI_YAZ'; 

document.addEventListener('DOMContentLoaded', () => {
    // Dinamik alan ekleme
    document.getElementById('deneyimEkle').addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'deneyim-grup';
        div.innerHTML = `
            <input type="text" class="sirket" placeholder="Şirket">
            <input type="text" class="pozisyon" placeholder="Pozisyon">
            <input type="text" class="tarih" placeholder="Tarih">
            <textarea class="aciklama" placeholder="Kısa açıklama"></textarea>
        `;
        document.getElementById('deneyimler').appendChild(div);
    });

    document.getElementById('yetenekEkle').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'yetenek';
        input.placeholder = 'Yetenek';
        document.getElementById('yetenekler').appendChild(input);
    });

    document.getElementById('sertifikaEkle').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sertifika';
        input.placeholder = 'Sertifika adı';
        document.getElementById('sertifikalar').appendChild(input);
    });

    // Form gönderimi
    document.getElementById('cvForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('generateBtn');
        const btnText = document.getElementById('btnText');
        const btnLoader = document.getElementById('btnLoader');
        btn.disabled = true;
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');

        try {
            // Kullanıcı verilerini topla
            const veri = {
                ad: document.getElementById('ad').value,
                soyad: document.getElementById('soyad').value,
                email: document.getElementById('email').value,
                telefon: document.getElementById('telefon').value,
                adres: document.getElementById('adres').value,
                tc: document.getElementById('tc').value,
                okul: document.getElementById('okul').value,
                bolum: document.getElementById('bolum').value,
                mezuniyetYili: document.getElementById('mezuniyetYili').value,
                ekAciklama: document.getElementById('ekAciklama').value,
                deneyimler: [],
                yetenekler: [],
                sertifikalar: []
            };

            document.querySelectorAll('.deneyim-grup').forEach(grup => {
                const sirket = grup.querySelector('.sirket')?.value;
                if (sirket) {
                    veri.deneyimler.push({
                        sirket: sirket,
                        pozisyon: grup.querySelector('.pozisyon')?.value || '',
                        tarih: grup.querySelector('.tarih')?.value || '',
                        aciklama: grup.querySelector('.aciklama')?.value || ''
                    });
                }
            });

            document.querySelectorAll('.yetenek').forEach(input => {
                if (input.value) veri.yetenekler.push(input.value);
            });

            document.querySelectorAll('.sertifika').forEach(input => {
                if (input.value) veri.sertifikalar.push(input.value);
            });

            const fotoInput = document.getElementById('fotograf');
            let fotoBase64 = '';
            if (fotoInput.files && fotoInput.files[0]) {
                fotoBase64 = await toBase64(fotoInput.files[0]);
            }

            // Yapay zekadan JSON formatında çıktı vermesini kesinleştiriyoruz
            const prompt = `
            You are an expert CV writer. Analyze the following information and create a professional, modern CV.
            Enhance the "ekAciklama" into a compelling professional summary (max 100 words). Rewrite each work experience description to be impactful using action verbs and quantifiable achievements where possible.
            
            Information:
            Name: ${veri.ad} ${veri.soyad}
            Email: ${veri.email}
            Phone: ${veri.telefon}
            Address: ${veri.adres}
            TC: ${veri.tc}
            Education: ${veri.okul}, ${veri.bolum}, Graduation: ${veri.mezuniyetYili}
            Experiences: ${JSON.stringify(veri.deneyimler)}
            Skills: ${veri.yetenekler.join(', ')}
            Certifications: ${veri.sertifikalar.join(', ')}
            Additional Info: "${veri.ekAciklama}"
            
            Return ONLY a valid JSON object with the following structure:
            {
              "summary": "enhanced summary text",
              "experiences": [
                { "sirket": "...", "pozisyon": "...", "tarih": "...", "enhancedDescription": "..." }
              ],
              "skills": ["skill1", "skill2"],
              "certifications": ["cert1"]
            }
            `;

            // Gemini API Çağrısı (Model ismini güvenceye aldık)
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    // API'yi doğrudan JSON döndürmeye zorluyoruz
                    generationConfig: {
                        responseMimeType: "application/json",
                    }
                })
            });

            // API'den dönen hatayı detaylıca konsola yazdırıyoruz
            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Detaylı Hata:", errorData);
                throw new Error(`API Hatası (${response.status}): ${errorData.error?.message || 'Bilinmeyen hata oluştu.'}`);
            }

            const data = await response.json();
            const aiText = data.candidates[0].content.parts[0].text;
            
            // Artık regex kullanmamıza gerek yok, API direkt temiz JSON veriyor
            const cvData = JSON.parse(aiText);

            // CV Önizleme HTML'i oluştur
            const previewDiv = document.getElementById('cvPreview');
            let fotoHtml = '';
            if (fotoBase64) {
                fotoHtml = `<img src="${fotoBase64}" style="width:100px; height:100px; object-fit:cover; border-radius:50%; margin-bottom:10px;">`;
            }
            
            let deneyimHtml = '';
            cvData.experiences.forEach(exp => {
                deneyimHtml += `
                <div style="margin-bottom:10px;">
                    <strong>${exp.sirket}</strong> - ${exp.pozisyon} (${exp.tarih})<br>
                    <em>${exp.enhancedDescription}</em>
                </div>`;
            });

            previewDiv.innerHTML = `
                <div style="font-family:Arial,sans-serif; padding:20px; max-width:700px; margin:auto; background:#fff; color:#333;">
                    <div style="text-align:center;">
                        ${fotoHtml}
                        <h1 style="color:#2c3e50;">${veri.ad} ${veri.soyad}</h1>
                        <p>${veri.email} | ${veri.telefon} | ${veri.adres}</p>
                        ${veri.tc ? `<p>TC: ${veri.tc}</p>` : ''}
                    </div>
                    <hr>
                    <h2 style="color:#0072ff;">Profesyonel Özet</h2>
                    <p>${cvData.summary}</p>
                    <h2 style="color:#0072ff;">Deneyim</h2>
                    ${deneyimHtml}
                    <h2 style="color:#0072ff;">Eğitim</h2>
                    <p><strong>${veri.okul}</strong>, ${veri.bolum} (${veri.mezuniyetYili})</p>
                    <h2 style="color:#0072ff;">Yetenekler</h2>
                    <p>${cvData.skills.join(' • ')}</p>
                    <h2 style="color:#0072ff;">Sertifikalar</h2>
                    <p>${cvData.certifications.join(' • ') || '—'}</p>
                </div>
            `;

            // PDF olarak kaydet
            const opt = {
                margin: [10, 10],
                filename: `${veri.ad}_${veri.soyad}_CV.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().set(opt).from(previewDiv).save();

        } catch (error) {
            alert('Bir hata oluştu. Lütfen geliştirici konsolunu (F12) kontrol et.\nHata Detayı: ' + error.message);
            console.error(error);
        } finally {
            btn.disabled = false;
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
        }
    });
});

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}