# WebSocket Yakalama & Emülatör Framework'ü

Bu proje, WebSocket tabanlı uygulamaları geliştirmek, test etmek ve trafiğini yakalamak için esnek bir araç seti sunar. WebSocket sunucularını emüle edebilir, istemcileri simüle edebilir ve trafik üzerinde inceleme/manipülasyon yapmak için man-in-the-middle (MITM) proxy olarak çalışabilir. Çerçeve; hata ayıklama, tersine mühendislik ve WebSocket protokollerini kontrollü bir ortamda genişletmek için idealdir.

Üç ana bileşen içerir:

- **Yerel WebSocket Sunucusu (`server.js`)** — özel komutlarla bağımsız bir emülatör.
- **Test İstemcisi (`client.js`)** — sunucu mantığını test etmek için temel istemci.
- **MITM Proxy (`mitm.js`)** — orijinal sunucu ile istemci arasındaki mesajları yakalayıp değiştiren proxy.

## ⚠️ Uyarı

> Bu proje **yalnızca eğitim ve test amaçlıdır**. Sahibi olmadığınız veya üzerinde açık izniniz olmayan trafiği yakalamak veya değiştirmek için kullanmayın.

## 🛠 Özellikler

- `/commands` klasörü ile özel komut işleme
- Dinamik mesaj yönlendirme
- Mesaj ve bağlantı oran sınırlaması
- Yakalama kancaları ile MITM WebSocket proxy
- İsteğe bağlı upstream HTTPS proxy desteği
- Ortam değişkenleri ile yapılandırma

## 📁 Proje Yapısı

```
src/
├── client/           # Test istemcisi mantığı
│   ├── packetHandlers
│   ├── payloads
│   └── utils
├── commands/         # Emülatör için özel komutlar
├── interceptors/     # Emülatörde (server.js) mesaj değiştirme kancaları
├── mitm/             # MITM proxy mantığı
│   ├── commands      # MITM'e özel komutlar
│   └── interceptors  # Upstream/downstream mesajları değiştirme kancaları
├── services/         # (Opsiyonel) Ek arka plan servisleri
├── utils/            # Ortak yardımcılar (örn. getClientIp.js)
├── server.js         # Özel emülatör WebSocket sunucusu
```

## 🚀 Başlarken

### 1. Klonla & Kur

```bash
git clone https://github.com/caglarop/ws-interceptor.git
cd ws-interceptor
npm install
```

### 2. `.env` Dosyasını Yapılandır

Kök dizinde aşağıdaki içerikle bir `.env` dosyası oluşturun:

```env
# Sunucu
WS_PORT=8080

# MITM
MITM_PROXY_ENABLED=false
MITM_PROXY_STRING=http://user:pass@proxyhost:port
MITM_WS_PORT=8080
MITM_WS_URL=wss://example.com

# İstemci
WS_URL=ws://localhost:8080
```

## 🔧 Kullanılabilir Scriptler

```bash
npm run start             # Özel WebSocket sunucusunu başlatır
npm run start:server      # Yukarıdakiyle aynı
npm run start:client      # Test istemcisini başlatır
npm run start:mitm        # MITM WebSocket proxy başlatır
```

## 🧪 Kullanım Örnekleri

### Emülatör Sunucusunu Başlat

```bash
npm run start:server
```

Kendi WebSocket handler'larınızı `commands/` klasörüyle test etmek için kullanın.

### MITM Proxy Başlat

```bash
npm run start:mitm
```

Bu, orijinal WebSocket sunucusu ile gerçek bir istemci (örn. tarayıcıdaki bir oyun) arasında proxy sunucusu başlatır. İstek/yanıtları değiştirmek için şunlara mantık ekleyebilirsiniz:

- `src/mitm/interceptors/` — upstream (sunucudan istemciye) mesajları manipüle etmek için
- `src/mitm/commands/` — istemci komutlarını işlemek için

### Test için İstemciyi Başlat

```bash
npm run start:client
```

Emülatör veya MITM'e bağlanan bir istemciyi simüle eder. Belirli mesajları birim testleri için idealdir.

## 🧩 Genişletme

Kendi komutlarınızı ve interceptor'larınızı kolayca ekleyebilirsiniz.

### ➕ Özel Komut Ekle

İstemciden gelen özel mesajları işlemek için `src/commands/` (emülatör için) veya `src/mitm/commands/` (MITM için) klasörüne bir dosya ekleyin.  
Her dosya `(ws, msg) => { ... }` imzasına sahip bir handler fonksiyonu export etmelidir.

**Örnek: `src/commands/login.js`**

```js
const { authenticateUser } = require("../services/authService");
const sendGetRatesRequest = require("../client/packetHandlers/getRatesHandler");

const handler = (ws, msg) => {
  const rid = msg.rid;
  const { username, password } = msg.params;

  const isAuthenticated = authenticateUser(username, password);

  if (isAuthenticated) {
    const response = {
      code: 0,
      rid,
      msg: "Login successful!",
      data: { status: "authenticated" },
    };

    ws.send(JSON.stringify(response));

    // Başarılı girişten sonra get_rates isteği gönder
    sendGetRatesRequest(ws, ["FTN", "USD"]);
  } else {
    const response = {
      code: 12,
      rid: rid,
      msg: "Invalid credentials",
      data: {
        status: 1002,
        details: {
          Key: "InvalidUsernamePassword",
          Message: "Geçersiz Kullanıcı adı ve / veya parola",
        },
      },
    };
    ws.send(JSON.stringify(response));
  }
};

module.exports = handler;
```

### 🪝 Interceptor Ekle

Interceptor'lar, MITM proxy üzerinden geçen mesajları incelemenizi veya değiştirmenizi sağlar.  
Interceptor dosyalarınızı `src/mitm/interceptors/` klasörüne yerleştirin. Her interceptor bir filtre ve bir handler kaydeder.

**Örnek: `src/mitm/interceptors/echo.js`**

```js
module.exports = (interceptor) => {
  interceptor.register(
    (msg) => msg.type === "echo", // Sadece "echo" mesajlarını işle
    (msg, upstream, client) => {
      msg.data = "[+] Intercepted!";
      client.send(JSON.stringify(msg));
    }
  );
};
```

**Interceptor nasıl çalışır:**

- İlk argüman bir filtre fonksiyonudur: Mesaj yakalanacaksa `true` döndür.
- İkinci argüman handler'dır: Mesajı değiştirebilir, engelleyebilir veya özel bir yanıt gönderebilirsiniz.

## 📜 Lisans

ISC — kendi riskiniz ve sorumluluğunuzda kullanın.
