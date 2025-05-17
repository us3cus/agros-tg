require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');
const { processTasks } = require('./handlers/taskProcessor');

// Список разрешенных пользователей
const allowedUserIds = [
  6297348443,
  383906528,
  985599049,
  585898839
];

// Функция проверки доступа пользователя
const isUserAllowed = (ctx) => {
  return allowedUserIds.includes(ctx.from.id);
};

// Middleware для проверки доступа
const checkAccess = async (ctx, next) => {
  if (!isUserAllowed(ctx)) {
    try {
      await ctx.reply('⛔ Доступ ограничен. У вас нет прав для использования этого бота.');
    } catch (error) {
      if (error.response && error.response.error_code === 403) {
        // Пользователь заблокировал бота, игнорируем ошибку
        console.log(`User ${ctx.from.id} has blocked the bot`);
      } else {
        // Другие ошибки логируем
        console.error('Error sending access denied message:', error);
      }
    }
    return;
  }
  return next();
};

// Импортируем обработчики
const { handleStart, handleBack, mainKeyboard, backKeyboard } = require('./handlers/mainMenu');
const { handleCreateForm, handleNewFormCommand, handleFormText, handlePhotoUpload, handleSetDate3Days } = require('./handlers/formFilling');
const { handleViewForms, handleViewForm, handleDeleteForm, handleCompleteTask, handleConfirmDelete } = require('./handlers/formViewing');
const { handleWeather, handleLocation } = require('./handlers/weatherHandler');
const { handleNewOrderCommand, handleOrderText, handleAutoFill } = require('./handlers/orderHandler');
const { handleViewOrders, handleViewOrder, handleDeleteOrder, handleConfirmDeleteOrder } = require('./handlers/orderViewing');

// Подключаемся к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Error connecting to MongoDB Atlas:', err));

// Создаем бот
const bot = new Telegraf(process.env.BOT_TOKEN);

// Используем сессии
bot.use(session({
  defaultSession: () => ({})
}));

// Применяем middleware проверки доступа
bot.use(checkAccess);

// Обработчик для всех текстовых сообщений
const handleAllText = (ctx, next) => {
  // Если текущий шаг начинается с 'order_', вызываем обработчик заказов
  if (ctx.session?.step?.startsWith('order_')) {
    return handleOrderText(ctx);
  }
  // В противном случае продолжаем обработку стандартным обработчиком
  return handleFormText(ctx);
};

// Регистрируем обработчики
bot.start(handleStart);
bot.action('create_form', handleCreateForm);
bot.action('view_forms', handleViewForms);
bot.action('view_orders', handleViewOrders);
bot.action(/^view_form_(.+)$/, handleViewForm);
bot.action(/^view_order_(.+)$/, handleViewOrder);
bot.action(/^delete_form_(.+)$/, handleDeleteForm);
bot.action(/^delete_order_(.+)$/, handleDeleteOrder);
bot.action(/^confirm_delete_(.+)$/, handleConfirmDelete);
bot.action(/^confirm_delete_order_(.+)$/, handleConfirmDeleteOrder);
bot.action('set_date_3_days', handleSetDate3Days);
bot.action('complete_task', handleCompleteTask);
bot.action('back_to_main', handleBack);
bot.action('weather', handleWeather);
bot.action('auto_fill', handleAutoFill);
bot.action('manual_fill', (ctx) => {
  ctx.session.step = 'order_company_name';
  ctx.reply('Введите название компании:', backKeyboard);
});
bot.on('location', handleLocation);
bot.command('newform', handleNewFormCommand);
bot.command('neworder', handleNewOrderCommand);
bot.on('text', handleAllText);
bot.on('photo', handlePhotoUpload);

// Запускаем бота
bot.launch();

// Запускаем обработчик задач
processTasks();

// Завершаем работу бота при остановке
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Бот запущен!');
