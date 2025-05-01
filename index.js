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
const { handleStart, handleBack, mainKeyboard } = require('./handlers/mainMenu');
const { handleCreateForm, handleNewFormCommand, handleFormText, handlePhotoUpload, handleSetDate3Days } = require('./handlers/formFilling');
const { handleViewForms, handleViewForm, handleDeleteForm, handleCompleteTask, handleConfirmDelete } = require('./handlers/formViewing');
const { handleWeather, handleLocation } = require('./handlers/weatherHandler');

// Подключаемся к MongoDB Atlas
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
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

// Регистрируем обработчики
bot.start(handleStart);
bot.action('create_form', handleCreateForm);
bot.action('view_forms', handleViewForms);
bot.action(/^view_form_(.+)$/, handleViewForm);
bot.action(/^delete_form_(.+)$/, handleDeleteForm);
bot.action(/^confirm_delete_(.+)$/, handleConfirmDelete);
bot.action('set_date_3_days', handleSetDate3Days);
bot.action(/^complete_task_(.+)$/, handleCompleteTask);
bot.action('back_to_main', handleBack);
bot.action('weather', handleWeather);
bot.on('location', handleLocation);
bot.command('newform', handleNewFormCommand);
bot.on('text', handleFormText);
bot.on('photo', handlePhotoUpload);

// Запускаем бота
bot.launch();

// Запускаем обработчик задач
processTasks();

// Завершаем работу бота при остановке
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Бот запущен!');
