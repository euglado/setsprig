# Katkı / Contributing

Türkçe veya İngilizce issue/PR açabilirsiniz. Önce sorunu, beklenen davranışı ve özel bilgi içermeyen küçük bir örneği açıklayın. Token, `.env`, gerçek üye/kanal kimlikleri veya özel setlist paylaşmayın. Güvenlik açıkları için SECURITY.md kullanın.

Use Turkish or English issues/PRs. Explain the problem, expected behavior and a minimal sanitized example. Never include tokens, `.env`, real member/channel identifiers or private setlists. Follow SECURITY.md for vulnerabilities.

Use Node.js 24 and run:

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/launch.mjs
node --check scripts/supply.mjs
bash -n setup.sh start.sh register.sh
git diff --check
```

Add meaningful tests for changed arithmetic, input boundaries, permission checks or interaction behavior. Keep the Guilds-only intent, minimum permissions, explicit consent, bounded memory, localized errors and credential-free logs. Do not add streaming downloads, lyrics scraping, analytics or privileged intents. Discuss new dependencies and their licenses first. Keep both README languages accurate. Test actual Discord installation privately with your own application if changing integration behavior; do not describe mocked tests as live validation.

Hesaplama, girdi sınırları, izinler veya etkileşim davranışı değişirse anlamlı testler ekleyin. En az izin, açık paylaşım onayı, sınırlı RAM ve iki dilde anlaşılır hataları koruyun. Canlı test yaparsanız kendi uygulamanızı kullanın; taklit testleri canlı doğrulama olarak sunmayın.
