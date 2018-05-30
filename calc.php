<!DOCTYPE html>
<html>
<head>
<meta http-equiv="Content-Type" content="text/html charset=UTF-8"/>
<meta name="keywoeds" content="перевозка, зерно, логистика, транспортировка"/>
<meta name="description" content="это тест"/>
<link href="css/style.css" rel="stylesheet" type="text/css"/>
<link href="" rel="shortcut icon" type="image/x-icon"/>
<title>Перевозки зерна</title>
<style>
body {
	background: #c7b39b url('img/zerno231.jpg');
}
</style>
</head>
<body>
<div id="page-wrap">
<header>
<a href="index.php" title="На главную" id="logo">Главная страница</a>
<span class="contact">Поиск:</span>
<input type="text" class="field" placeholder=""/>
<span class="right"> <span class="contact"><a href="phpform/register.php" title="Зарегистрироваться">Регистрация</a></span> 
<span class="contact"><a href="phpform/login.php" title="Войти">Вход</a></span>
</span>
</header>
<div class= "clear"><br /></div>
<center>
	<div id="menu">Разделы<hr /></div>
	<div id="menuHrefs">
		<a href="about.php">О нас</a>
		<a href="calc.php">Расчет стоиости перевозки</a>
		<a href="order.php">Заказать перевозку</a>
		<a href="feedback.php">Обратная связь</a>
	</div>
</center>
<div id="wrapper" style="padding-top: 30px;">
	<div id="articles">
		<div id="about_us">
			<p>Система предоставляет возможность провести предварительный расчет стоимости перевозки зерна на одном зерновозе.</p>
			<p>Расчет ведется по формуле: <span style="color: #ce2029;"> S * 0,35 * 0,55 </span></p>
			<p>Где:</p>
			<p><span style="color: #000000;">S</span> - расстояние от места загрузки до места разгрузки</p>
			<p><span style="color: #000000;">35</span> - средняя цена литра дизельного топлива</p>
			<p><span style="color: #000000;">0,55</span> - расход топлива на один километр</p>
		</div>
	</div>
	<div id="map" class="map"></div>
	<script src="https://api-maps.yandex.ru/2.1/?lang=ru_RU" type="text/javascript"></script>
    <script src="DeliveryCalculatorClass.js" type="text/javascript"></script>
    <script src="deliveryCalculator.js" type="text/javascript"></script>
    <style>
        #map {
            width: 600px;
            height: 500px;
            padding: 5 px;
            margin-top: 0px;
			float: right;
        }
    </style>
	</div>
	</div> 
<footer>
<span class="left">Все права защищены &copy; 2018</span>
</footer>
</body>
</html>