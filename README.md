# SetSprig

**Türkçe** · [English](#english)

Discord müzik toplulukları için parça listesi süre planlayıcısı. `/setsprig` ile 2–8 parçanın sürelerini ve parçalar arasındaki sabit geçiş aralığını girin. Bot başlangıca göre kümülatif süreleri hesaplar, yalnızca size görünen bir önizleme gösterir ve **Bu kanalda paylaş** düğmesine basarsanız planı aynı kanala gönderir.

Ses çalmaz, ses kanalına bağlanmaz, müzik indirmez; Spotify/YouTube veya başka yayın hizmetine erişmez. Şarkı sözü toplamaz, canlı sayaç, takvim, hatırlatma, katılım kaydı veya sunucu yönetimi yapmaz. Verdiğiniz süreleri kullanır; gerçek performans süresini doğrulamaz.

## Amaç ve özellikler

- Küçük konser, koro, açık mikrofon ve prova topluluklarında süre bütçesini önceden görmek.
- Türkçe Discord dilinde Türkçe, diğer dillerde İngilizce form ve yanıtlar.
- Tam saniyelerle hesaplama; ilk parçadan önce ve son parçadan sonra geçiş eklenmez.
- İsteğe bağlı dakika hedefiyle kalan/aşılan süreyi gösterme.
- Özel önizleme, açık paylaşım onayı ve vazgeçme düğmesi. Paylaşılana kadar kanal mesajı oluşmaz.
- Mesaj içeriği okuma veya ayrıcalıklı intent gerekmez. Bir işlem, bir Discord uygulaması ve bir sunucu için tasarlanmıştır.

## Gereksinimler

Windows, macOS veya Linux; **Node.js 24.x** ve birlikte gelen npm; internet bağlantısı; kendi Discord uygulamanızın bot tokenı; bot ekleme yetkiniz olan bir Discord sunucusu. [Node.js indirme sayfasından](https://nodejs.org/en/download) 24.x sürümünü seçin. Terminalde `node --version` çıktısı `v24` ile başlamalıdır. Bu depo çalışır bir Gateway botudur; GitHub Actions yalnızca kaynak kontrollerini yapar, botu barındırmaz.

## Baştan sona kurulum

1. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** ile uygulama oluşturun. **General Information** sayfasındaki **Application ID** değerini alın. Bu gizli değildir.
2. **Bot** sayfasında bot kullanıcısını oluşturun/görüntüleyin. **Reset Token** ile token alın. Token bir paroladır: sohbet, ekran görüntüsü, issue veya Git deposuna koymayın. Açığa çıkarsa hemen aynı sayfadan yenileyin. **Privileged Gateway Intents** seçeneklerinin tamamını kapalı bırakın.
3. **Installation** bölümünde yalnızca **Guild Install** kullanın. Varsayılan kurulum kapsamları `bot` ve `applications.commands`; bot izinleri yalnızca **View Channels** ve **Send Messages** olsun. Administrator vermeyin. Kurulum bağlantısını açıp sunucunuzu seçin. OAuth2 URL Generator kullanırsanız aynı iki kapsamı ve aynı izinleri seçin. **Interactions Endpoint URL** boş kalır; bot Gateway üzerinden bağlanır.
4. Discord → Kullanıcı Ayarları → Gelişmiş → **Geliştirici Modu** açın. Sunucu simgesine sağ tıklayıp **Sunucu Kimliğini Kopyala** seçin. Kanal kimliği yerine sunucu kimliği gerekir.
5. Bu deponun **Code → Download ZIP** seçeneğiyle kaynaklarını indirin ve ZIP'i çıkarın; veya `git clone https://github.com/euglado/setsprig.git` kullanın. Dosyaları arşivin içinden çalıştırmayın.
6. **Windows:** çıkarılan klasörde `setup.cmd` dosyasına çift tıklayın. **macOS/Linux:** Terminal'i klasörde açıp `bash setup.sh` çalıştırın. Yardımcı bağımlılıkları kilit dosyasından kurar, derler ve Application ID, sunucu kimliği ve token sorar. Token girişi ekranda görünmez; hata yaparsanız Backspace kullanabilirsiniz. Ctrl+C iptal eder. Token yalnızca yerel `.env` dosyasına yazılır. Kurulum mevcut `.env` üzerine yazmaz.
7. **Windows:** `register.cmd` çalıştırın. **macOS/Linux:** `bash register.sh`. Bu işlem yalnızca bu sunucudaki `/setsprig` komutunu ekler/günceller; uygulamanın diğer komutlarını silmez.
8. **Windows:** `start.cmd` çalıştırın. **macOS/Linux:** `bash start.sh`. `SetSprig hazır / ready` görünce Discord'da botun eriştiği normal metin kanalında `/setsprig` yazın.

Yardımcılar kaynak kod düzenlemenizi gerektirmez. Alternatif terminal sırası: `npm ci --ignore-scripts`, `npm run build`, `npm run setup`, `npm run register`, `npm start`. Bir adım başarısız olursa sonraki adıma geçmeyin. Windows PowerShell `npm.ps1` engeli bildirirse `.cmd` yardımcılarını veya `npm.cmd` kullanın.

## Yapılandırma ve çalışır tutma

Sihirbazın oluşturduğu `.env` üç alan içerir: `DISCORD_TOKEN` (gizli), `APPLICATION_ID` ve `GUILD_ID`. `.env.example` yalnızca alanları belgeler; gerçek token içermez. Sunucuda bu üç ortam değişkenini de tanımlayabilirsiniz; mevcut ortam değerleri `.env` değerlerine üstün gelir. Kimliklerin ve tokenın aynı uygulamaya ait olması gerekir. Değiştirmek için botu durdurun, `.env` dosyasını özel olarak yeniden adlandırın/taşıyın ve kurulum sihirbazını tekrar çalıştırın. Eski kopya da gizlidir; artık gerekmiyorsa güvenle silin. Botu yeniden başlatın; sunucu değiştiyse komutu tekrar kaydedin.

Terminal kapanınca veya bilgisayar uyuyunca bot durur. Sürekli kullanım için internete bağlı, uyumayan bir bilgisayar/VPS üzerinde **tek** Node.js 24 işlemi çalıştırın. Süreç yöneticisini aynı çalışma klasörüyle `npm start` çalıştıracak şekilde ayarlayın; tokenı herkese açık yapılandırmaya koymayın. Bu depo hosting veya otomatik işletim sistemi servis kurulumu sağlamaz. Birden fazla kopya taslakları ve hız sınırlarını paylaşmaz; aynı tokenla birden fazla kopya çalıştırmayın. Ctrl+C ile durdurabilirsiniz. Güncellemeden önce durdurun; yeni kaynağı alın, `npm ci --ignore-scripts` ve `npm run build` çalıştırıp yeniden başlatın. `.env` dosyasını özel tutun ve yedeklere dikkat edin.

## Kullanım

`/setsprig` formunda başlık, her satırda bir parça, geçiş saniyesi ve isteğe bağlı hedef dakikayı girin. Örnek parça listesi:

```text
3:20 | Açılış
4:10 | Final
```

Geçiş `30`, hedef `10` olduğunda Açılış `0:00–3:20`, Final `3:50–8:00`; müzik `7:30`, geçiş `0:30`, toplam `8:00`, kalan `2:00` olur. Bunlar saatin kaç olduğunu değil, setin başlangıcından itibaren geçen süreyi gösterir. Hedefi aşan geçerli plan paylaşılabilir; bot süreleri kırpmaz.

Önizlemeyi inceleyin. **Bu kanalda paylaş** yalnızca gösterilen planı aynı kanala bir kez gönderir. **Vazgeç** taslağı RAM'den kaldırır. Düzenlemek için yeniden `/setsprig` kullanın; aynı üye/sunucunun önceki taslağı geçersizleşir. Form ve önizlemenin her biri 5 dakika geçerlidir. Süresi dolmuş kart Discord'da kalabilir ama düğmeleri artık çalışmaz. Paylaşılmış mesajları normal Discord mesaj denetimleriyle silin; bot otomatik silmez.

Sınırlar: 2–8 parça; her süre `m:ss` biçiminde `0:01–30:00`; başlık 60, parça adı 40, parça listesi 600 UTF-16 birimi; geçiş `0–300` tam saniye; isteğe bağlı hedef `1–180` tam dakika; toplam en fazla 3 saat. Boş satır kullanmayın. Başlıklarda `|`, bağlantı, etiket, gizli bilgi veya kontrol karakterleri kullanmayın. Bazı birleşik emoji/biçimlendirme karakterleri reddedilebilir. En fazla 100 taslak ve hız sınırı haritası başına 500 kayıt RAM'de tutulur. Üye/sunucu başına 5 saniyede bir form; kanal başına dakikada bir paylaşım. Yavaş modu 60 saniyeyi aşan kanallarda paylaşım yapılmaz. Başarısız paylaşım denemesi de kanalın bir dakikalık sınırını kullanabilir.

## İzinler, güvenlik ve gizlilik

Bot yalnızca `Guilds` intent kullanır. Üye listesi, presence ve Message Content intent kapalı kalır. Davet izin değeri **3072** (View Channel + Send Messages); Administrator, Manage Server, Manage Messages, Read Message History, ses veya webhook yönetimi istemez. Kullanıcının da hedef kanalı görme/mesaj gönderme izni ve uygulama komutlarını kullanma erişimi olmalıdır. Normal metin ve duyuru kanalları desteklenir; thread/forum/DM desteklenmez. Yöneticiler Discord uygulama komutu izinleriyle erişimi daha da kısıtlayabilir.

Paylaşmadan önce kanal, roller ve kullanıcı/bot üyelikleri yeniden alınır; iptal edilen izinler ve kullanıcı zaman aşımı denetlenir. Bu denetimle gönderim arasında Discord'da izinler değişebilir. Bot yönetici yetkisi istemez ve insan moderasyonunun yerini almaz. Kullanıcının yazdığı başlıklar Markdown açısından kaçırılır; mention bildirimleri ve bağlantı önizlemeleri kapalıdır. Basit giriş filtresi tüm sırları veya özel bilgileri saptayamaz. Yalnızca paylaşmaya yetkili olduğunuz parça adlarını/süreleri girin; söz veya özel içerik girmeyin.

Discord form girdilerini alır; bot bunları işleyip oluşturulmuş önizleme metni, üye/sunucu/kanal/uygulama/mesaj kimlikleri, dil ve sona erme zamanı ile geçici RAM kaydı tutar. Ham form girdileri kalıcı depolanmaz; çalışma belleğinde işlem sırasında bulunur. Taslaklar tüketilince/vazgeçilince, süresi dolunca (30 saniyelik temizlik) veya işlem kapanınca silinir. Hız sınırları üye+sunucu/kanal kimliği ve bitiş zamanını kısa süreli tutar. Kullanıcı/üye/mesaj SDK önbellekleri kapalıdır; Discord bağlantısı için sunucu/kanal/rol metaverisi kullanılabilir. Veritabanı, analitik, üçüncü taraf müzik API'si veya içerik günlükleme yoktur. Ağ hataları özel veri içerikleriyle loglanmaz.

Özel önizleme diğer sıradan üyelere gösterilmez; Discord ve bot işletmecisinden kriptografik olarak gizli değildir. RAM silinmesi Discord'un mesajları/işlem kayıtlarını silmez. Açık mesajlar ve Discord'daki önizlemeler RAM süresinden daha uzun yaşayabilir; sunucunun görünürlüğü ve saklama kuralları geçerlidir. Token düz metin `.env` içinde saklanır; Unix'te oluşturma modu 0600, Windows'ta hesap/disk izinleri geçerlidir. Gitignore güvenlik kasası değildir; dosyayı yüklemeyin.

## Sorun giderme

- **Node/npm bulunamadı:** Node.js 24 kurup terminali yeniden açın. `node --version` kontrol edin.
- **Ayarlar eksik/geçersiz:** setup yardımcısını proje klasöründe çalıştırın; Bot tokenı kullanın, Client Secret kullanmayın.
- **Komut kaydedilemiyor:** Application ID, sunucu kimliği, bot kurulumu ve internet bağlantısını kontrol edin. Tokenı paylaşmayın. Yanlış sunucuda yapılan eski komut kaydını Developer Portal/Discord yönetiminden kaldırın.
- **Komut görünmüyor:** register yardımcısını çalıştırın; doğru sunucu, `applications.commands` kapsamı ve üyenin uygulama komutu erişimini doğrulayın; Discord'u yenileyin.
- **Bot çevrimdışı:** start yardımcısını açık tutun; uyku modunu, ağ erişimini ve tokenın yenilenip yenilenmediğini kontrol edin.
- **İzin hatası:** kanal izin geçersiz kılmalarında hem kullanıcıya hem bota View Channel/Send Messages verin; kullanıcı zaman aşımını ve kanal türünü kontrol edin. Administrator vermek gerekmez.
- **Yavaş mod/hız sınırı/süresi dolmuş taslak:** belirtilen süreyi bekleyip yeni form açın. Yavaş modu 60 saniyeden fazla olmayan uygun kanalı kullanın.
- **Paylaşım sırasında bağlantı hatası:** önce kanala bakın; Discord mesajı kabul etmiş olabilir. Bot belirsiz gönderimi otomatik yeniden denemez. Tekrar paylaşmadan önce çoğaltma olmadığını kontrol edin.
- **`.env` zaten var:** üzerine yazılmaz. Yukarıdaki değiştirme adımlarını kullanın; dosya içeriğini yardım isteğine eklemeyin.

## Testler ve katkı

Node.js 24 ile `npm ci --ignore-scripts`, `npm run check` ve `npm audit --audit-level=low` çalıştırın. `check` Biome önerilen lint/format kuralları, bağımlılık türlerini de içeren strict TypeScript, Node testleri ve bağımlılık lisans/kaynak/SHA-512/kurulum betiği/gizli bilgi örüntüsü taramasını çalıştırır. Tarama sezgiseldir; eksiksiz güvenlik sertifikası değildir. CI aynı kontrolleri Ubuntu, Windows ve macOS'ta; Node yardımcılarının ve Bash dosyalarının sözdizimini; temiz Git farkını doğrular. CI yalnızca `contents: read` izni kullanır ve action sürümleri SHA ile sabitlenmiştir.

Testler Discord etkileşimlerini taklit eder; gerçek token, ses hizmeti veya sunucu kullanmaz. Canlı bot kurulumu, gizli token girişi, mobil/ekran okuyucu kullanılabilirliği ve sürekli hosting işletmeci tarafından doğrulanmalıdır. Otomatik test geçmesi canlı kurulumun doğrulandığı anlamına gelmez. [CONTRIBUTING.md](CONTRIBUTING.md) ve [SECURITY.md](SECURITY.md) yönergelerini izleyin. Hataları özel bilgi içermeyen örnekler ve beklenen/gerçek sonuçla bildirin. MIT lisanslıdır; [LICENSE](LICENSE) dosyasını inceleyin. Bağımlılıklar kendi lisanslarını korur.

---

## English

SetSprig is a real Discord Gateway bot for music communities planning rehearsal or performance lengths. `/setsprig` collects 2–8 piece durations and a fixed transition gap, calculates cumulative elapsed timings, shows a private preview, and posts only after the owner explicitly clicks **Share in this channel**.

### Purpose and features

Plan small concerts, choir rehearsals or open-mic sets before posting. Integer-second arithmetic includes exactly one gap between adjacent pieces, none before the first or after the last. An optional minute budget shows remaining time or overrun. Turkish Discord locales receive Turkish forms/results; other locales receive English. Previews have Share/Discard buttons and require no message-content access.

The bot does not play audio, join voice, download music, fetch lyrics or contact streaming/music APIs. It does not provide a live timer, calendar, reminders, signups, moderation or verified performance estimates. Use only titles/durations you are authorized to share. No DRM circumvention or media downloading exists.

### Requirements

Windows, macOS or Linux; **Node.js 24.x** with npm; internet access; your own Discord bot application/token; a server where you can install it. Choose Node 24 from the [official download page](https://nodejs.org/en/download). `node --version` must start with `v24`. One running process serves one configured server. GitHub Actions checks source code; it does not host the bot.

### Installation

1. Open the [Discord Developer Portal](https://discord.com/developers/applications), create an application and copy **General Information → Application ID**.
2. Open **Bot**, create/view the bot user, then use **Reset Token** to obtain its token. Keep it secret; never paste it into chat, screenshots, issues or Git. Reset immediately if exposed. Leave **all Privileged Gateway Intents off**.
3. Under **Installation**, use **Guild Install** only, scopes `bot` and `applications.commands`, and only **View Channels** plus **Send Messages**. Use the installation link to add the bot to your server. OAuth2 URL Generator can generate the same scopes/permissions. Never grant Administrator. Leave **Interactions Endpoint URL** empty; this bot receives interactions through Gateway.
4. In Discord enable User Settings → Advanced → **Developer Mode**. Right-click the server icon → **Copy Server ID**. This is a server ID, not a channel ID.
5. Download **Code → Download ZIP** from this repository and extract it, or run `git clone https://github.com/euglado/setsprig.git`. Do not launch files inside the ZIP.
6. **Windows:** double-click `setup.cmd`. **macOS/Linux:** open a terminal in the extracted folder and run `bash setup.sh`. It installs locked dependencies, compiles, then asks for Application ID, server ID and a hidden token. Token characters are not echoed; Backspace edits and Ctrl+C cancels. The wizard writes a local `.env` and refuses to overwrite an existing one.
7. Run **`register.cmd`** on Windows or **`bash register.sh`** on macOS/Linux. It adds/updates only `/setsprig` in your configured server, preserving unrelated application commands.
8. Run **`start.cmd`** on Windows or **`bash start.sh`** on macOS/Linux. Once ready, use `/setsprig` in an accessible ordinary text channel.

No source editing is needed. Equivalent terminal commands, in order: `npm ci --ignore-scripts`, `npm run build`, `npm run setup`, `npm run register`, `npm start`. Stop on any error. If PowerShell blocks `npm.ps1`, use the `.cmd` helpers or `npm.cmd`.

### Configuration and continuous hosting

The wizard writes `DISCORD_TOKEN`, `APPLICATION_ID` and `GUILD_ID` into `.env`; `.env.example` documents the names only. You may supply the same environment variables on a host; existing environment values take precedence. Application ID must match the token. To change settings, stop the bot, privately rename/move `.env`, rerun setup, then restart; register again if the server changed. Old configuration copies remain secrets; delete them safely when no longer needed.

Closing the terminal or sleeping the computer stops the bot. For continuous operation use one always-on computer/VPS with Node 24, network access and a process manager launching `npm start` from this project folder. Keep credentials outside public configuration. Hosting and automatic OS service installation are not included. Multiple processes do not share drafts/cooldowns; run one copy per token. Ctrl+C stops it. For updates stop, obtain new source, run `npm ci --ignore-scripts` and `npm run build`, then restart. Protect `.env` and backups.

### Usage and limits

Open `/setsprig`, supply a title and one piece per line using `m:ss | Piece title`. For `3:20 | Opening` and `4:10 | Finale`, gap `30`, budget `10`, the preview shows Opening `0:00–3:20`, Finale `3:50–8:00`, music `7:30`, transitions `0:30`, total `8:00`, remaining `2:00`. These are elapsed offsets, not wall-clock times. Over-budget valid plans may still be shared; no durations are silently shortened.

Review the private preview, then choose **Share in this channel** to post exactly that plan once in the same channel, or **Discard** to delete the RAM draft. Restart the command to edit; a new draft replaces your previous draft in that server. Each form/preview stage lasts five minutes. Old Discord cards may remain visible after expiry/restart, but buttons stop working. Delete published messages using normal Discord controls; there is no automatic deletion.

Limits: 2–8 pieces; each `0:01–30:00` in `m:ss`; title 60, piece title 40 and full list 600 UTF-16 units; gap 0–300 integer seconds; optional budget 1–180 integer minutes; whole plan at most three hours. Do not use blank lines, extra `|` separators, links, mentions, secrets or control characters in titles. Some joined emoji/formatting characters are rejected. RAM holds at most 100 drafts and 500 entries per cooldown map. A member may open one form per server every five seconds; a channel permits one share attempt per minute. Channels with slowmode greater than 60 seconds are refused. Failed sharing may consume the cooldown too.

### Permissions, safety and privacy

Only `Guilds` intent is enabled. Keep Members, Presence and Message Content privileged intents off. Invite permission integer **3072** grants View Channel + Send Messages; no Administrator, Manage Server/Messages, message history, voice or webhook management is needed. Users also need channel visibility/send permissions and permission to use application commands. Ordinary text and announcement channels are supported; threads/forums/DMs are not. Administrators can restrict command availability through Discord's application command permissions.

Sharing fetches current roles/channel/user/bot membership again, checks both parties' permissions and refuses timed-out users. Permissions can still change between check and send. The bot cannot replace human moderation. User titles are Markdown escaped; mentions and embeds are disabled. The simple input filter cannot detect every secret. Do not enter private information, lyrics or content you cannot share.

Discord receives form input. The bot processes it and temporarily holds the rendered preview, user/server/channel/application/message IDs, language and expiry in RAM. Raw form input is not persistently stored but exists in memory while processing. Drafts disappear on consumption/discard, expiration (30-second cleanup) or process shutdown. Short-lived cooldown maps hold user+server/channel identifiers and expiry. SDK user/member/message caches are disabled; server/channel/role metadata may remain for Discord operation. There is no database, analytics, external music API or content logging. Errors are sanitized instead of printing REST bodies or credentials.

Private previews are hidden from ordinary other members, not cryptographically hidden from Discord or the operator. RAM deletion does not delete Discord messages or platform records. Public posts and previews may outlive RAM expiry and follow Discord/server retention and visibility. `.env` stores the token as plaintext; file creation mode is 0600 on Unix and account/disk permissions apply on Windows. Gitignore is not a vault; never upload the file.

### Troubleshooting

- **Node/npm missing:** install Node 24 and reopen the terminal; check `node --version`.
- **Missing/invalid config:** run setup from the project folder and use the Bot token, not a Client Secret.
- **Registration fails:** check IDs, bot installation, token and internet. Remove accidental old-server commands through Discord/Developer Portal administration. Never share the token while requesting help.
- **Command absent:** run register; check the server, `applications.commands` scope and member command access; refresh Discord.
- **Offline:** keep start running; check sleep/network/token rotation.
- **Permission error:** inspect channel overrides for both user and bot; check timeout/channel type. Administrator is unnecessary.
- **Slowmode/cooldown/expired card:** wait, then open a fresh form; use a channel with slowmode at most 60 seconds.
- **Sharing connection error:** inspect the channel before retrying because Discord might have accepted the message. Uncertain sends are not automatically retried.
- **`.env` already exists:** setup refuses overwrites. Follow the configuration replacement steps; never attach its contents to an issue.

### Tests, contribution and license

On Node 24 run `npm ci --ignore-scripts`, `npm run check` and `npm audit --audit-level=low`. `check` runs Biome recommended lint/format, strict TypeScript including dependency types, Node tests, and dependency license/registry/SHA-512/install-script/source-credential-pattern checks. Scans are heuristic, not complete security certification. Read-only, SHA-pinned CI repeats checks on Ubuntu/Windows/macOS, checks Node/Bash helper syntax and verifies a clean Git diff.

Interactions are mocked: no real Discord token/server or music service is used by tests. Live installation, hidden-token input, mobile/screen-reader usability and always-on hosting require operator validation. Passing automated checks does not establish a tested live deployment. See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md); submit minimal sanitized examples with expected/actual behavior. Source uses the [MIT license](LICENSE); dependencies retain their own licenses.

Official implementation references: [Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [permissions](https://docs.discord.com/developers/topics/permissions), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy), [discord.js](https://discord.js.org/docs/packages/discord.js/14.27.0).
