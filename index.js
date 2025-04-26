require('dotenv').config();
const { Telegraf, session } = require('telegraf');
const mongoose = require('mongoose');

// Импортируем обработчики
const { handleStart, handleBack, mainKeyboard } = require('./handlers/mainMenu');
const { handleCreateForm, handleNewFormCommand, handleFormText } = require('./handlers/formFilling');
const { handleViewForms } = require('./handlers/formViewing');

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

// Регистрируем обработчики
bot.start(handleStart);
bot.action('create_form', handleCreateForm);
bot.action('view_forms', handleViewForms);
bot.action('back_to_main', handleBack);
bot.command('newform', handleNewFormCommand);
bot.on('text', handleFormText);

// Запускаем бота
bot.launch();

// Завершаем работу бота при остановке
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

console.log('Бот запущен!');
