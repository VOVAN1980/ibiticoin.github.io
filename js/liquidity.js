<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ликвидность IBITI/USDT</title>

  <!-- Общий CSS -->
  <link rel="stylesheet" href="css/style.css">

  <!-- AOS для анимаций -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.css">

  <style>
    body {
      background: #000;
      color: gold;
      font-family: sans-serif;
      margin: 20px;
    }
    header {
      text-align: center;
      margin-bottom: 20px;
    }
    button {
      background: gold;
      color: #000;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      font-weight: bold;
      cursor: pointer;
      transition: background 0.3s;
    }
    button:hover {
      background: #c0a000;
    }
    .liquidity-info {
      margin-top: 20px;
      font-size: 1.1rem;
      text-align: center;
    }
    .liquidity-info span {
      font-weight: bold;
    }
    footer {
      text-align: center;
      margin-top: 40px;
      border-top: 1px solid gold;
      padding-top: 10px;
      font-size: 0.9rem;
    }
    @media (max-width: 768px) {
      body { margin: 10px; }
      button { width: 100%; }
      .liquidity-info { font-size: 1rem; }
    }
  </style>
</head>
<body>
  <header>
    <h1>Ликвидность IBITI/USDT</h1>
    <p>Нажмите «Обновить», чтобы получить текущие резервы пула</p>
  </header>

  <div style="text-align: center;">
    <button id="refreshLiquidityBtn">Обновить ликвидность</button>
  </div>

  <div class="liquidity-info" data-aos="fade-up">
    <p>Резерв <span>IBITI:</span> <span id="reserveToken">—</span></p>
    <p>Резерв <span>USDT:</span> <span id="reserveUSDT">—</span></p>
  </div>

  <!-- AOS JS -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/aos/2.3.4/aos.js"></script>
  <script>
    AOS.init({ once: true });
  </script>

  <!-- ethers, config и liquidity.js работают как модули -->
  <script type="module" src="js/config.js"></script>
  <script type="module" src="js/liquidity.js"></script>

  <footer>
    <p>&copy; 2025 IBITIcoin. All rights reserved.</p>
    <p>
      <a href="index.html" style="color: gold; text-decoration: none;">← Вернуться на главную</a>
    </p>
  </footer>
</body>
</html>
