// main.js

'use strict';


let db;
const request = indexedDB.open('CarSalesDB', 1);


// Событие, которое происходит при обновлении базы данных
request.onupgradeneeded = function(event) {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('cars')) {
        const objectStore = db.createObjectStore('cars', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('brand', 'brand', { unique: false });
        objectStore.createIndex('price', 'price', { unique: false });
    }
};


// Событие успешного открытия базы данных
request.onsuccess = function(event) {
    db = event.target.result;
    console.log('База данных успешно открыта: ', db);
    updateTable();  // Обновление таблицы при открытии базы данных
};


// Событие ошибки при открытии базы данных
request.onerror = function(event) {
    console.error('Ошибка открытия базы данных: ', event.target.errorCode);
};


// Функция для форматирования числа с пробелами
function formatPrice(value) {
    // Удаляем все символы, кроме цифр
    value = value.replace(/\D/g, '');
    // Форматируем с пробелами
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Обработчик события для форматирования цены при вводе
document.getElementById('priceInput').addEventListener('input', function() {
    this.value = formatPrice(this.value);
});


// Функция для обновления таблицы
function updateTable() {
    const transaction = db.transaction('cars', 'readonly');
    const objectStore = transaction.objectStore('cars');
    const request = objectStore.getAll();

    request.onsuccess = function(event) {
        const cars = event.target.result;
        const tableBody = document.querySelector('tbody');
        tableBody.innerHTML = '';  // Очищаем таблицу перед добавлением новых данных
        cars.forEach(car => {
            const formattedPrice = formatPrice(car.price);  // Форматируем цену перед отображением
            const row = document.createElement('tr');
            row.innerHTML = `
                <td contentEditable='true' data-key='brand' onblur='updateItem(${car.id}, "brand", this.innerText)'>${car.brand}</td>
                <td contentEditable='true' data-key='price' onblur='updateItem(${car.id}, "price", this.innerText.replace(/\s/g, ""))'>${formattedPrice}</td>
                <td><span class='action text-danger' onclick='deleteItem(${car.id})'>Удалить</span></td>
                <td><span class='action text-info' onclick='updateItem(${car.id})'>Изменить</span></td>
            `;
            tableBody.appendChild(row);
        });
    };
}


// Функция для сохранения нового элемента
function saveItem() {
    const brandInput = document.getElementById('brandInput').value;
    const priceInput = document.getElementById('priceInput').value.replace(/\s/g, ''); // Удаляем пробелы перед сохранением

    if (brandInput && priceInput && !isNaN(priceInput)) {  // Проверка, что цена — число
        const transaction = db.transaction('cars', 'readwrite');
        const objectStore = transaction.objectStore('cars');
        
        const newCar = { brand: brandInput, price: priceInput };
        objectStore.add(newCar);  // Добавляем новый элемент в хранилище

        transaction.oncomplete = function() {
            console.log('Новый автомобиль добавлен:', newCar);
            updateTable();  // Обновляем таблицу после добавления
            document.getElementById("brandInput").value = "";
            document.getElementById("priceInput").value = "";
        };
        
        transaction.onerror = function(event) {
            console.error('Ошибка при добавлении автомобиля:', event.target.errorCode);
            alert('Ошибка при добавлении записи');
        };
    } else {
        alert('Пожалуйста, заполните все поля корректно');
    }
}


// Функция для обновления элемента
function updateItem(id, key, value) {
    const transaction = db.transaction('cars', 'readwrite');
    const objectStore = transaction.objectStore('cars');
    
    objectStore.get(id).onsuccess = function(event) {
        const car = event.target.result;
        if (car) {
            car[key] = value;  // Обновляем нужное значение
            objectStore.put(car);  // Сохраняем изменения
            transaction.oncomplete = function() {
                updateTable();  // Обновляем отображение после изменения
            };
            alert('Запись изменена');
        }
    };
}


// Функция для удаления автомобиля
function deleteItem(id) {
    const transaction = db.transaction('cars', 'readwrite');
    const objectStore = transaction.objectStore('cars');
    
    let confirmDelete = confirm('Вы действительно хотите удалить эту запись?')
    
    if(confirmDelete) {
        objectStore.delete(id);
        transaction.oncomplete = function() {
            updateTable();  // Обновляем отображение после удаления
        }
    }
}
