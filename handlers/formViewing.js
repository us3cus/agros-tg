const Form = require('../models/Form');
const { mainKeyboard } = require('./mainMenu');

// Обработчик кнопки "Просмотреть формы"
const handleViewForms = async (ctx) => {
  try {
    const forms = await Form.find().sort({ treatment_date: -1 });
    if (forms.length === 0) {
      ctx.reply('Нет сохраненных форм.', mainKeyboard);
      return;
    }
    
    let message = 'Сохраненные формы:\n\n';
    forms.forEach((form, index) => {
      message += `Форма #${index + 1}\n`;
      message += `Хозяйство: ${form.farm_name}\n`;
      message += `Дата обработки: ${form.treatment_date}\n`;
      message += `Препарат: ${form.chemical_name}\n`;
      message += `Размер поля: ${form.field_size} га\n`;
      message += `pH до: ${form.ph_before}\n`;
      message += `pH после: ${form.ph_after}\n`;
      message += `Дата звонка: ${form.call_date}\n`;
      message += `Время звонка: ${form.call_time}\n\n`;
    });
    
    ctx.reply(message, mainKeyboard);
  } catch (error) {
    console.error('Error fetching forms:', error);
    ctx.reply('Произошла ошибка при получении форм.', mainKeyboard);
  }
};

module.exports = {
  handleViewForms
}; 