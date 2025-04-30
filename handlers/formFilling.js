const Form = require('../models/Form');
const CallTask = require('../models/CallTask');
const { backKeyboard, mainKeyboard } = require('./mainMenu');
const { Markup } = require('telegraf');

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
    phone_number: ctx.session.form.phone_number,
    treatment_date: ctx.session.form.treatment_date,
    chemical_name: ctx.session.form.chemical_name,
    field_size: ctx.session.form.field_size,
    ph_before_photo: ctx.session.form.ph_before_photo,
    ph_after_photo: ctx.session.form.ph_after_photo,
    call_date: ctx.session.form.call_date,
    call_time: ctx.session.form.call_time,
    author_id: ctx.from.id
  });

  try {
    const savedForm = await form.save();

    // Преобразуем дату из формата ДД-ММ-ГГГГ в объект Date
    const [day, month, year] = savedForm.call_date.split('-').map(Number);
    const callDateTime = new Date(year, month - 1, day, 13, 0, 0); // Устанавливаем время 13:00

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
      ctx.session.step = 'phone_number';
      ctx.reply('Введите номер телефона (например: +77001234567):', backKeyboard);
      break;
    case 'phone_number':
      if (!/^\+?\d{10,15}$/.test(text)) {
        ctx.reply('Неверный формат номера телефона. Пожалуйста, введите номер в формате +77001234567:', backKeyboard);
        return;
      }
      ctx.session.form.phone_number = text;
      ctx.session.step = 'treatment_date';
      ctx.reply('Введите дату обработки в формате ДД-ММ-ГГГГ (например, 20-03-2024):', backKeyboard);
      break;
    case 'treatment_date':
      if (!/^\d{2}-\d{2}-\d{4}$/.test(text)) {
        ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ДД-ММ-ГГГГ (например, 20-03-2024):', backKeyboard);
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
      ctx.session.step = 'ph_before_photo';
      ctx.reply('Пожалуйста, отправьте фотографию pH воды ДО добавления препарата:', backKeyboard);
      break;
    case 'call_date':
      if (!/^\d{2}-\d{2}-\d{4}$/.test(text)) {
        ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ДД-ММ-ГГГГ (например, 20-03-2024):', backKeyboard);
        return;
      }
      ctx.session.form.call_date = text;
      ctx.session.form.call_time = '13:00';
      
      try {
        await saveForm(ctx);
        ctx.reply('Форма успешно сохранена!', mainKeyboard);
      } catch (error) {
        console.error('Error saving form:', error);
        ctx.reply('Произошла ошибка при сохранении формы. Пожалуйста, попробуйте еще раз.', mainKeyboard);
      }
      ctx.session = null;
      break;
  }
};

// Обработчик фотографий
const handlePhotoUpload = async (ctx) => {
  console.log('Получено фото:', ctx.message.photo);
  console.log('Текущий шаг:', ctx.session.step);
  
  if (!ctx.session || !ctx.session.step) {
    console.log('Нет активной сессии или шага');
    return;
  }

  try {
    if (ctx.session.step === 'ph_before_photo') {
      console.log('Обработка фото pH до');
      // Сохраняем file_id фотографии
      ctx.session.form.ph_before_photo = ctx.message.photo[0].file_id;
      console.log('Сохранен file_id для ph_before_photo:', ctx.session.form.ph_before_photo);
      ctx.session.step = 'ph_after_photo';
      ctx.reply('Пожалуйста, отправьте фотографию pH воды ПОСЛЕ добавления препарата:', backKeyboard);
    } else if (ctx.session.step === 'ph_after_photo') {
      console.log('Обработка фото pH после');
      // Сохраняем file_id фотографии
      ctx.session.form.ph_after_photo = ctx.message.photo[0].file_id;
      console.log('Сохранен file_id для ph_after_photo:', ctx.session.form.ph_after_photo);
      ctx.session.step = 'call_date';
      
      const dateKeyboard = Markup.inlineKeyboard([
        [Markup.button.callback('📅 Через 3 дня', 'set_date_3_days')],
        [Markup.button.callback('🔙 Вернуться', 'back_to_main')]
      ]);
      
      ctx.reply('Введите дату звонка в формате ДД-ММ-ГГГГ (например, 20-03-2024) или нажмите кнопку "Через 3 дня":', dateKeyboard);
    } else {
      console.log('Неожиданный шаг при получении фото:', ctx.session.step);
    }
  } catch (error) {
    console.error('Ошибка при обработке фотографии:', error);
    ctx.reply('Произошла ошибка при обработке фотографии. Пожалуйста, попробуйте еще раз.', backKeyboard);
  }
};

// Обработчик кнопки "через 3 дня"
const handleSetDate3Days = async (ctx) => {
  if (ctx.session.step !== 'call_date') return;
  
  const today = new Date();
  const threeDaysLater = new Date(today);
  threeDaysLater.setDate(today.getDate() + 3);
  
  const day = String(threeDaysLater.getDate()).padStart(2, '0');
  const month = String(threeDaysLater.getMonth() + 1).padStart(2, '0');
  const year = threeDaysLater.getFullYear();
  
  ctx.session.form.call_date = `${day}-${month}-${year}`;
  ctx.session.form.call_time = '13:00';
  
  try {
    await saveForm(ctx);
    ctx.reply('Форма успешно сохранена!', mainKeyboard);
  } catch (error) {
    console.error('Error saving form:', error);
    ctx.reply('Произошла ошибка при сохранении формы. Пожалуйста, попробуйте еще раз.', mainKeyboard);
  }
  ctx.session = null;
};

module.exports = {
  handleCreateForm,
  handleNewFormCommand,
  handleFormText,
  handleSetDate3Days,
  handlePhotoUpload
}; 