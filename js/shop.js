async function handlePurchase(amount, productName) {
  Swal.fire({
    title: 'Ожидание подтверждения...',
    html: 'Пожалуйста, ожидайте...',
    allowOutsideClick: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });

  try {
    const pricePerToken = await contract.coinPriceBNB();
    const totalPrice = pricePerToken.mul(amount);

    const tx = await contract.purchaseCoinBNB({ value: totalPrice });
    await tx.wait();

    Swal.fire({
      icon: 'success',
      title: 'Успешно!',
      text: `Вы купили ${amount} токен(ов)!`,
      timer: 5000,
      timerProgressBar: true,
      showConfirmButton: false
    });

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Ошибка покупки',
      text: error.message || 'Что-то пошло не так. Попробуйте ещё раз.',
      confirmButtonText: 'Ок'
    });
  }
}
