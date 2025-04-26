const { Markup } = require('telegraf');

// Создаем клавиатуру для главного меню
const mainKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('📋 Создать форму', 'create_form')],
  [Markup.button.callback('📊 Просмотреть формы', 'view_forms')]
]);

// Создаем клавиатуру для возврата
const backKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback('🔙 Вернуться', 'back_to_main')]
]);

// Обработчик команды start
const handleStart = (ctx) => {
  ctx.reply('Привет! Выберите действие:', mainKeyboard);
};

// Обработчик кнопки "Вернуться"
const handleBack = (ctx) => {
  ctx.session = null; // очищаем сессию
  ctx.reply('Выберите действие:', mainKeyboard);
};

module.exports = {
  mainKeyboard,
  backKeyboard,
  handleStart,
  handleBack
}; 