const Form = require('../models/Form');
const CallTask = require('../models/CallTask');
const { backKeyboard } = require('./mainMenu');

// Обработчик кнопки "Создать форму"
const handleCreateForm = (ctx) => {
  ctx.session.form = {};  // Инициализация сессии
  ctx.session.step = 'farm_name';  // Начинаем с первого шага
  ctx.reply('Введите имя хозяйства:', backKeyboard);
};

// Обработчик команды newform
const handleNewFormCommand = (ctx) => {
  ctx.session.form = {};  // Инициализация сессии
  ctx.session.step = 'farm_name';  // Начинаем с первого шага
  ctx.reply('Введите имя хозяйства:', backKeyboard);
};

// Сохраняем данные формы в MongoDB
async function saveForm(ctx) {
  const form = new Form({
    farm_name: ctx.session.form.farm_name,
    treatment_date: ctx.session.form.treatment_date,
    chemical_name: ctx.session.form.chemical_name,
    field_size: ctx.session.form.field_size,
    ph_before: ctx.session.form.ph_before,
    ph_after: ctx.session.form.ph_after,
    call_date: ctx.session.form.call_date,
    call_time: ctx.session.form.call_time
  });

  try {
    const savedForm = await form.save();

    // Создаём задачу звонка
    const callDateTime = new Date(`${savedForm.call_date}T${savedForm.call_time}`);
    const callTask = new CallTask({
      form_id: savedForm._id,
      call_at: callDateTime,
      status: 'pending'
    });

    await callTask.save();
    console.log('Задача звонка успешно создана!');
  } catch (error) {
    console.error('Ошибка при сохранении данных:', error);
    throw error;
  }
}

// Обработчик текстовых сообщений для заполнения формы
const handleFormText = async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;

  const text = ctx.message.text;

  switch (ctx.session.step) {
    case 'farm_name':
      ctx.session.form.farm_name = text;
      ctx.session.step = 'treatment_date';
      ctx.reply('Введите дату обработки в формате ГГГГ-ММ-ДД (например, 2024-03-20):', backKeyboard);
      break;
    case 'treatment_date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ГГГГ-ММ-ДД (например, 2024-03-20):', backKeyboard);
        return;
      }
      
      const [year, month, day] = text.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        ctx.reply('Неверная дата. Пожалуйста, введите корректную дату в формате ГГГГ-ММ-ДД (например, 2024-03-20):', backKeyboard);
        return;
      }
      
      ctx.session.form.treatment_date = text;
      ctx.session.step = 'chemical_name';
      ctx.reply('Введите название препарата:', backKeyboard);
      break;
    case 'chemical_name':
      ctx.session.form.chemical_name = text;
      ctx.session.step = 'field_size';
      ctx.reply('Введите размер поля (в гектарах, например: 10.5):', backKeyboard);
      break;
    case 'field_size':
      const fieldSize = parseFloat(text);
      if (isNaN(fieldSize) || fieldSize <= 0) {
        ctx.reply('Неверный формат числа. Пожалуйста, введите положительное число (например: 10.5):', backKeyboard);
        return;
      }
      ctx.session.form.field_size = fieldSize;
      ctx.session.step = 'ph_before';
      ctx.reply('Введите pH воды ДО добавления препарата (например: 7.2):', backKeyboard);
      break;
    case 'ph_before':
      const phBefore = parseFloat(text);
      if (isNaN(phBefore) || phBefore < 0 || phBefore > 14) {
        ctx.reply('Неверный формат pH. Пожалуйста, введите число от 0 до 14 (например: 7.2):', backKeyboard);
        return;
      }
      ctx.session.form.ph_before = phBefore;
      ctx.session.step = 'ph_after';
      ctx.reply('Введите pH воды ПОСЛЕ добавления препарата (например: 7.2):', backKeyboard);
      break;
    case 'ph_after':
      const phAfter = parseFloat(text);
      if (isNaN(phAfter) || phAfter < 0 || phAfter > 14) {
        ctx.reply('Неверный формат pH. Пожалуйста, введите число от 0 до 14 (например: 7.2):', backKeyboard);
        return;
      }
      ctx.session.form.ph_after = phAfter;
      ctx.session.step = 'call_date';
      ctx.reply('Введите дату звонка в формате ГГГГ-ММ-ДД (например, 2024-03-20):', backKeyboard);
      break;
    case 'call_date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ГГГГ-ММ-ДД (например, 2024-03-20):', backKeyboard);
        return;
      }
      ctx.session.form.call_date = text;
      ctx.session.step = 'call_time';
      ctx.reply('Введите время звонка в формате ЧЧ:ММ (например, 14:30):', backKeyboard);
      break;
    case 'call_time':
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(text)) {
        ctx.reply('Неверный формат времени. Пожалуйста, введите время в формате ЧЧ:ММ (например, 14:30):', backKeyboard);
        return;
      }
      ctx.session.form.call_time = text;
      try {
        await saveForm(ctx);
        ctx.reply('Форма успешно сохранена!', mainKeyboard);
      } catch (error) {
        ctx.reply('Произошла ошибка при сохранении формы. Пожалуйста, попробуйте еще раз.', mainKeyboard);
        console.error('Error saving form:', error);
      }
      ctx.session = null; // очищаем сессию
      break;
  }
};

module.exports = {
  handleCreateForm,
  handleNewFormCommand,
  handleFormText
}; 