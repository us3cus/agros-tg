const Form = require('../models/Form');
const { mainKeyboard, backKeyboard } = require('./mainMenu');
const { Markup } = require('telegraf');

// Обработчик кнопки "Просмотреть формы"
const handleViewForms = async (ctx) => {
  try {
    const forms = await Form.find().sort({ treatment_date: -1 });
    if (forms.length === 0) {
      ctx.reply('Нет сохраненных форм.', mainKeyboard);
      return;
    }
    
    // Создаем клавиатуру с кнопками для каждой формы
    const formButtons = forms.map((form, index) => {
      return [Markup.button.callback(`Форма #${index + 1} (${form.farm_name})`, `view_form_${form._id}`)];
    });
    
    const keyboard = Markup.inlineKeyboard([
      ...formButtons,
      [Markup.button.callback('🔙 Вернуться', 'back_to_main')]
    ]);
    
    ctx.reply('Выберите форму для просмотра:', keyboard);
  } catch (error) {
    console.error('Error fetching forms:', error);
    ctx.reply('Произошла ошибка при получении форм.', mainKeyboard);
  }
};

// Обработчик просмотра отдельной формы
const handleViewForm = async (ctx) => {
  try {
    const formId = ctx.match[1]; // Получаем ID формы из callback_data
    const form = await Form.findById(formId);
    
    if (!form) {
      ctx.reply('Форма не найдена.', mainKeyboard);
      return;
    }
    
    const message = `Детали формы:\n\n` +
      `Хозяйство: ${form.farm_name}\n` +
      `Дата обработки: ${form.treatment_date}\n` +
      `Препарат: ${form.chemical_name}\n` +
      `Размер поля: ${form.field_size} га\n` +
      `pH до: ${form.ph_before}\n` +
      `pH после: ${form.ph_after}\n` +
      `Дата звонка: ${form.call_date}\n` +
      `Время звонка: ${form.call_time}`;
    
    ctx.reply(message, backKeyboard);
  } catch (error) {
    console.error('Error viewing form:', error);
    ctx.reply('Произошла ошибка при просмотре формы.', mainKeyboard);
  }
};

module.exports = {
  handleViewForms,
  handleViewForm
}; 