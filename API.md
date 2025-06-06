# API документация бота AgroDrone

## Общие команды

### /start
Запускает бота и показывает главное меню.

### /newform
Запускает процесс создания новой формы для учета обработки полей.

### /neworder
Запускает процесс создания нового заказа дронов.

## Структура базы данных

### Коллекция Form
Хранит информацию о формах обработки полей.

```js
{
  farm_name: String,        // Название хозяйства
  phone_number: String,     // Номер телефона 
  treatment_date: String,   // Дата обработки
  chemical_name: String,    // Название препарата
  field_size: Number,       // Размер поля в гектарах
  ph_before_photo: String,  // ID фото pH до обработки
  ph_after_photo: String,   // ID фото pH после обработки
  call_date: String,        // Дата звонка
  call_time: String,        // Время звонка
  author_id: Number,        // ID автора в Telegram
  created_at: Date          // Дата создания записи
}
```

### Коллекция Order
Хранит информацию о заказах дронов.

```js
{
  order_id: String,         // Уникальный ID заказа (UUID)
  company_name: String,     // Название компании
  contacts: String,         // Контактная информация
  equipment: {              // Информация об оборудовании
    name: String,           // Название оборудования
    price: Number,          // Цена за единицу
    nds: Number,           // НДС за единицу
    pieces: Number,        // Количество единиц
    price_total: Number,   // Общая стоимость
    nds_total: Number      // Общий НДС
  },
  seller_info: {            // Информация о продавце
    name: String,           // Имя продавца
    director: String,       // Директор
    data: String           // Данные продавца
  },
  created_at: Date,         // Дата создания записи
  author_id: Number,        // ID автора в Telegram
  status: String            // Статус заказа
}
```

### Коллекция CallTask
Хранит задачи на звонок.

```js
{
  form_id: ObjectId,        // ID связанной формы
  call_at: Date,            // Дата и время звонка
  status: String,           // Статус задачи (pending/completed)
  completed_at: Date        // Дата выполнения
}
```

### Коллекция DeletionLog
Журнал удаления записей.

```js
{
  type: String,             // Тип удаленной записи (form/order)
  data: Object,             // Данные удаленной записи
  deleted_by: Number,       // ID пользователя, удалившего запись
  deleted_at: Date          // Дата удаления
}
```

## Процесс создания заказа

1. Пользователь отправляет команду `/neworder`
2. Бот предлагает два варианта заполнения:
   - Автоматическое заполнение (использует данные из sellerData.json)
   - Ручное заполнение
3. При ручном заполнении бот последовательно запрашивает:
   - Название компании
   - Контактные данные
   - Выбор модели дрона (DJI Agras T50 базовый или с разбрасывателем)
   - Количество дронов
   - Информацию о продавце
4. Система генерирует уникальный order_id (UUID)
5. Данные сохраняются в MongoDB
6. Формируется ссылка на Google Form с параметром entry.999999=order_id
7. Бот отправляет пользователю сформированную ссылку

## Процесс просмотра и управления заказами

1. Пользователь нажимает кнопку "Просмотреть заказы" в главном меню
2. Бот показывает список всех заказов
3. При выборе конкретного заказа отображается подробная информация
4. Пользователь может удалить заказ через соответствующую кнопку 