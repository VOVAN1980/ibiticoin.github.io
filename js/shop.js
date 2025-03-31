async function handlePurchase() {
  // Показываем индикатор загрузки через SweetAlert
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, ожидайте...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
  
  try {
    // Пример вызова функции покупки – замените на реальную логику покупки
    const tx = await contract.purchase(/* параметры покупки */);
    await tx.wait();
    
    Swal.fire({
      icon: 'success',
      title: 'Ура!',
      text: 'Покупка успешна, ты стал миллионером! 🎉',
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });
    
    // Обновление UI или редирект, если нужно
  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка покупки',
      text: error.message || 'Что-то пошло не так. Попробуйте ещё раз.',
      confirmButtonText: 'Ок'
    });
  }
}

document.getElementById('buyBtn').addEventListener('click', (e) => {
  e.preventDefault();
  handlePurchase();
});
