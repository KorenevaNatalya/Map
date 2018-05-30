ymaps.modules.define(
    'DeliveryCalculator',
    ['util.defineClass', 'vow'],
    function (provide, defineClass, vow) {
        /**
         * @class DeliveryCalculator Расчет стоимости доставки.
         * @param {Object} map    Экземпляр карты.
         */
        function DeliveryCalculator(map) {
            this._map = map;
            this._startPoint = null;
            this._finishPoint = null;
            this._route = null;
            this._startPointBalloonContent;
            this._finishPointBalloonContent;

            map.events.add('click', this._onClick, this);
        }

        defineClass(DeliveryCalculator, {
            /**
             * Задаём точке маршрута координаты и контент балуна.
             * @param {String} pointType Тип точки: 'start' - начальная, 'finish' - конечная.
             * @param {Number[]} position Координаты точки.
             * @param {String} content Контент балуна точки.
             */
            _setPointData: function (pointType, position, content) {
                if (pointType == 'start') {
                    this._startPointBalloonContent = content;
                    this._startPoint.geometry.setCoordinates(position);
                    this._startPoint.properties.set('balloonContentBody', "Ожидаем данные");
                } else {
                    this._finishPointBalloonContent = content;
                    this._finishPoint.geometry.setCoordinates(position);
                    this._finishPoint.properties.set('balloonContentBody', "Ожидаем данные");
                }
            },

            /**
             * Создаем новую точку маршрута и добавляем её на карту.
             * @param {String} pointType Тип точки: 'start' - начальная, 'finish' - конечная.
             * @param {Number[]} position Координаты точки.
             */
            _addNewPoint: function (pointType, position) {
                // Если новой точке маршрута не заданы координаты, временно задаём координаты вне области видимости.
                if (!position) position = [19.163570, -156.155197];
                // Создаем маркер с возможностью перетаскивания (опция `draggable`).
                // По завершении перетаскивания вызываем обработчик `_onStartDragEnd`.
                if (pointType == 'start' && !this._startPoint) {
                    this._startPoint = new ymaps.Placemark(position, {iconContent: 'А'}, {draggable: true});
                    this._startPoint.events.add('dragend', this._onStartDragEnd, this);
                    this._map.geoObjects.add(this._startPoint);
                }
                if (pointType == 'finish' && !this._finishPoint) {
                    this._finishPoint = new ymaps.Placemark(position, {iconContent: 'Б'}, {
                        draggable: true,
                        balloonAutoPan: false
                    });
                    this._finishPoint.events.add('dragend', this._onFinishDragEnd, this);
                    this._map.geoObjects.add(this._finishPoint);
                }
            },

            /**
             * Задаём точку маршрута.
             * Точку маршрута можно задать координатами или координатами с адресом.
             * Если точка маршрута задана координатами с адресом, то адрес становится контентом балуна.
             * @param {String} pointType Тип точки: 'start' - начальная, 'finish' - конечная.
             * @param {Number[]} position Координаты точки.
             * @param {String} address Адрес.
             */
            setPoint: function (pointType, position, address) {
                if (!this._startPoint || !this._finishPoint) {
                    this._addNewPoint(pointType, position);
                }
                if (!address) {
                    this._reverseGeocode(position).then(function (content) {
                        this._setPointData(pointType, position, content);
                        this._setupRoute();
                    }, this)
                } else {
                    this._setPointData(pointType, position, address);
                    this._setupRoute();
                }
            },

            /**
             * Проводим обратное геокодирование (определяем адрес по координатам) для точки маршрута.
             * @param {Number[]} point Координаты точки.
             */
            _reverseGeocode: function (point) {
                return ymaps.geocode(point).then(function (res) {
                    // res содержит описание найденных геообъектов.
                    // Получаем описание первого геообъекта в списке, чтобы затем показать
                    // с описанием доставки по клику на метке.
                    return res.geoObjects.get(0) &&
                        res.geoObjects.get(0).properties.get('balloonContentBody') || '';
                });

            },

            /**
             * Проводим прямое геокодирование (определяем координаты по адресу) для точки маршрута.
             * @param {String} address Адрес.
             */
            _geocode: function (address) {
                return ymaps.geocode(address).then(function (res) {
                    // res содержит описание найденных геообъектов.
                    // Получаем описание и координаты первого геообъекта в списке.
                    var balloonContent = res.geoObjects.get(0) &&
                            res.geoObjects.get(0).properties.get("balloonContent") || '',
                        coords = res.geoObjects.get(0) &&
                            res.geoObjects.get(0).geometry.getCoordinates() || '';

                    return [coords, balloonContent];
                });

            },

            /**
             *
             * @param  {Number} routeLength Длина маршрута в километрах.
             * @return {Number} Стоимость доставки.
             */
            calculate: function (routeLength) {
                // Константы.
                var DELIVERY_TARIF =1 * 35*0.55, // Стоимость за километр.
                    MINIMUM_COST = 500; // Минимальная стоимость.

                return Math.max(routeLength * DELIVERY_TARIF, MINIMUM_COST);
            },

            /**
             * Прокладываем маршрут через заданные точки
             * и проводим расчет доставки.
             */
            _setupRoute: function () {
                // Удаляем предыдущий маршрут с карты.
                if (this._route) {
                    this._map.geoObjects.remove(this._route);
                }

                if (this._startPoint && this._finishPoint) {
                    var start = this._startPoint.geometry.getCoordinates(),
                        finish = this._finishPoint.geometry.getCoordinates(),
                        startBalloon = this._startPointBalloonContent,
                        finishBalloon = this._finishPointBalloonContent;
                    if (this._deferred && !this._deferred.promise().isResolved()) {
                        this._deferred.reject('New request');
                    }
                    var deferred = this._deferred = vow.defer();
                    // Прокладываем маршрут через заданные точки.
                    ymaps.route([start, finish])
                        .then(function (router) {
                            if (!deferred.promise().isRejected()) {
                                var price = this.calculate(Math.round(router.getLength() / 1000)),
                                    distance = ymaps.formatter.distance(router.getLength()),
                                    message = '<span>Расстояние: ' + distance + '.</span><br/>' +
                                        '<span style="font-weight: bold; font-style: italic">Стоимость доставки: %sр.</span>';

                                this._route = router.getPaths(); // Получаем коллекцию путей, из которых состоит маршрут.

                                this._route.options.set({strokeWidth: 5, strokeColor: '0000ffff', opacity: 0.5});
                                this._map.geoObjects.add(this._route); // Добавляем маршрут на карту.
                                // Задаем контент балуна для начального и конечного маркера.
                                this._startPoint.properties.set('balloonContentBody', startBalloon + message.replace('%s', price));
                                this._finishPoint.properties.set('balloonContentBody', finishBalloon + message.replace('%s', price));

                                this._map.setBounds(this._route.getBounds(), {checkZoomRange: true}).then(function () {
                                // Открываем балун над точкой доставки.
                                // Раскомментируйте, если хотите показывать балун автоматически.
                                     this._finishPoint.balloon.open().then(function(){
                                         this._finishPoint.balloon.autoPan();
                                     }, this);
                                }, this);
                                deferred.resolve();
                            }

                        }, function (err) {
                            // Если через заданные точки невозможно проложить маршрут, откроется балун с предупреждением.
                            this._finishPoint.properties.set('balloonContentBody', "Невозможно построить маршрут");
                            this._finishPoint.balloon.open();
                            this._finishPoint.balloon.autoPan();
                        }, this);

                }
            },

            /**
             * Обработчик клика по карте. Получаем координаты точки на карте и создаем маркер.
             * @param  {Object} event Событие.
             */
            _onClick: function (event) {
                if (this._startPoint) {
                    this.setPoint("finish", event.get('coords'));
                } else {
                    this.setPoint("start", event.get('coords'));
                }
            },

            /**
             * Получаем координаты маркера и вызываем геокодер для начальной точки.
             */
            _onStartDragEnd: function () {
                this.setPoint('start', this._startPoint.geometry.getCoordinates());
            },

            _onFinishDragEnd: function () {
                this.setPoint('finish', this._finishPoint.geometry.getCoordinates());
            },

            /**
             * Создаем маршрут.
             * @param {Number[]|String} startPoint Координаты точки или адрес.
             * @param {Number[]|String} finishPoint Координаты точки или адрес.
             */
            setRoute: function (startPoint, finishPoint) {
                if (!this._startPoint) {
                    this._addNewPoint("start");
                }
                if (!this._finishPoint) {
                    this._addNewPoint("finish");
                }
                if (typeof(startPoint) === "string" && typeof(finishPoint) === "string") {
                    vow.all([this._geocode(startPoint), this._geocode(finishPoint)]).then(function (res) {
                        this._setPointData("start", res[0][0], res[0][1]);
                        this._setPointData("finish", res[1][0], res[1][1]);
                        this._setupRoute();
                    }, this);
                } else if (typeof(startPoint) === "string") {
                    vow.all([this._geocode(startPoint), this._reverseGeocode(finishPoint)]).then(function (res) {
                        this._setPointData("start", res[0][0], res[0][1]);
                        this._setPointData("finish", finishPoint, res[1]);
                        this._setupRoute();
                    }, this);
                } else if (typeof(finishPoint) === "string") {
                    vow.all([this._reverseGeocode(startPoint), this._geocode(finishPoint)]).then(function (res) {
                        this._setPointData("start", startPoint, res[0]);
                        this._setPointData("finish", res[1][0], res[1][1]);
                        this._setupRoute();
                    }, this);
                } else {
                    vow.all([this._reverseGeocode(startPoint), this._reverseGeocode(finishPoint)]).then(function (res) {
                        this._setPointData("start", startPoint, res[0]);
                        this._setPointData("finish", finishPoint, res[1]);
                        this._setupRoute();
                    }, this);

                }
            }
        });

        provide(DeliveryCalculator);
    }
);