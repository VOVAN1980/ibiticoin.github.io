async function handlePurchase() {
  // Показываем индикатор загрузки
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, ожидайте...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Пример: вызов функции покупки (замени на свою логику)
    const tx = await contract.purchase(/* параметры покупки */);
    await tx.wait();
    
    // Показываем уведомление об успехе
    Swal.fire({
      icon: 'success',
      title: 'Ура!',
      text: 'Покупка успешна, ты стал миллионером! 🎉',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
    
    // Обновление UI или переход на другую страницу, если нужно
  } catch (error) {
    // Показываем уведомление об ошибке
    Swal.fire({
      icon: 'error',
      title: 'Ошибка покупки',
      text: error.message || 'Что-то пошло не так. Попробуйте ещё раз.',
      confirmButtonText: 'Ок'
    });
  }
}

// Привяжем функцию к кнопке с id="buyBtn"
document.getElementById('buyBtn').addEventListener('click', (e) => {
  e.preventDefault();
  handlePurchase();
});
