# Güvenlik / Security

Aktif destek hedefi mevcut `main` dalıdır. Otomatik kontroller tüm açıkları bulma garantisi vermez.

The current `main` branch is the supported target. Automated checks cannot guarantee absence of vulnerabilities.

Token sızdıysa önce Discord Developer Portal → Bot → Reset Token kullanın, yerel ayarları değiştirin ve botu yeniden başlatın. Tokenı bu depoda veya bir raporda paylaşmayın.

If a token leaks, first reset it in Discord Developer Portal → Bot → Reset Token, replace the local configuration and restart. Never send credentials to this repository or a report.

Hassas bir açık için GitHub Security sekmesinde **Report a vulnerability** varsa onu kullanın. Yoksa içeriği açığa çıkarmadan özel bildirim kanalı isteyen bir issue açın. Herkese açık issue'ya istismar ayrıntısı, özel veri veya token koymayın. İşletmeci erişim ve saklama sorumluluğunu taşır; `.env` düz metindir.

Use **Security → Report a vulnerability** when available. Otherwise open an issue requesting a private reporting channel without disclosing exploit details or sensitive information. Never publish exploit details, personal data or tokens in public issues. Operators are responsible for access and retention; `.env` is plaintext.
