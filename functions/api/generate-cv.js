export async function onRequest(context) {
    // CORS ayarları (geliştirme için geniş, production'da domain'ini kısıtla)
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Sadece POST istekleri kabul edilir.' }), {
            status: 405,
            headers
        });
    }

    try {
        const formData = await context.request.json();

        // Gemini API anahtarını environment variable'dan al
        const AIzaSyAUtQvbeEzyHi6apO6rUe858otLX0qX-OA = context.env.AIzaSyAUtQvbeEzyHi6apO6rUe858otLX0qX-OA;
        if (!AIzaSyAUtQvbeEzyHi6apO6rUe858otLX0qX-OA) {
            throw new Error('API anahtarı sunucuda tanımlı değil.');
        }

        // Gemini'ye gönderilecek prompt'u oluştur
        const prompt = buildPrompt(formData);

        // Gemini API çağrısı (ücretsiz tier: dakikada 60 istek)
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 2048,
                    }
                })
            }
        );

        if (!geminiResponse.ok) {
            const error = await geminiResponse.json();
            throw new Error(`Gemini API hatası: ${error.error?.message || geminiResponse.statusText}`);
        }

        const data = await geminiResponse.json();
        const cvContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!cvContent) {
            throw new Error('AI yanıtı boş geldi.');
        }

        return new Response(JSON.stringify({ cvContent }), { headers });

    } catch (error) {
        console.error('Hata:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers
        });
    }
}

function buildPrompt(data) {
    return `Sen profesyonel bir CV yazarısın. Aşağıda verilen bilgileri kullanarak, işe alım uzmanlarının ilgisini çekecek, özgün ve etkileyici bir CV metni oluştur. 
Metin Türkçe olmalı. Başlıklar ve açıklamalar profesyonel bir formatta olsun. Eğitim, deneyim, yetenekler, sertifikalar ve kariyer hedefini sırasıyla düzenle. 
Her bölümü net başlıklarla ayır (Örn: EĞİTİM, İŞ DENEYİMİ, YETENEKLER, SERTİFİKALAR, KARİYER HEDEFİ). 
Deneyim açıklamalarını başarı odaklı ve rakamlarla desteklenmiş cümlelerle zenginleştir. 
Eğer kullanıcı özet yazmamışsa, kariyer hedefi bölümünü sen yarat. 
Metni temiz, PDF'e doğrudan yazılabilecek düz yazı olarak ver, gereksiz markdown kullanma. 
Sadece CV içeriğini döndür, başka bir şey ekleme.

Kullanıcı Bilgileri:
Ad Soyad: ${data.personal?.fullName || 'Belirtilmemiş'}
E-posta: ${data.personal?.email || 'Belirtilmemiş'}
Telefon: ${data.personal?.phone || 'Belirtilmemiş'}
Adres: ${data.personal?.address || 'Belirtilmemiş'}

Eğitim:
${data.education?.map(e => `- ${e.school}, ${e.department}, ${e.degree}, Mezuniyet: ${e.graduationYear}`).join('\n') || 'Belirtilmemiş'}

İş Deneyimi:
${data.experience?.map(exp => `- ${exp.company} | ${exp.position} (${exp.startDate} - ${exp.endDate}): ${exp.description}`).join('\n') || 'Belirtilmemiş'}

Yetenekler: ${data.skills || 'Belirtilmemiş'}
Sertifikalar: ${data.certificates?.map(c => `${c.name} - ${c.institution} (${c.year})`).join(', ') || 'Belirtilmemiş'}
Diller: ${data.languages || 'Belirtilmemiş'}
Kariyer Hedefi / Özet: ${data.summary || 'Kullanıcı tarafından sağlanmadı, lütfen uygun bir kariyer hedefi oluştur.'}

Lütfen tüm bu bilgileri profesyonel bir CV formatında düzenle.`;
}
