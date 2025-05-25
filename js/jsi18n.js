import i18next from 'https://unpkg.com/i18next@23.4.6/dist/esm/i18next.js';

await i18next.init({
  lng: 'ru', // язык по умолчанию
  fallbackLng: 'ru',
  resources: {
    en: {
      translation: {
        "staking_title": "IBITI Staking",
        "staking_description": "Stake tokens and earn rewards",
        "connect_wallet": "Connect Wallet",
        "home": "Home",
        "share": "Share"
      }
    },
    ru: {
      translation: {
        "staking_title": "Стейкинг IBITI",
        "staking_description": "Застейкай токены и получай награды",
        "connect_wallet": "Подключить кошелёк",
        "home": "Главная",
        "share": "Поделиться"
      }
    }
  }
});
