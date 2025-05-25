i18next
  .use(i18nextHttpBackend)
  .use(i18nextBrowserLanguageDetector)
  .init({
    fallbackLng: 'ru',
    debug: true,
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    }
  }, function(err, t) {
    jqueryI18next.init(i18next, $, { useOptionsAttr: true });
    $('body').localize();
  });
