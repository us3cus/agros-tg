const Form = require('../models/Form');
const CallTask = require('../models/CallTask');
const DeletionLog = require('../models/DeletionLog');
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

    // Получаем задачу звонка
    const callTask = await CallTask.findOne({ form_id: formId });
    const taskStatus = callTask ? callTask.status : 'не найдена';
    
    const message = `Детали формы:\n\n` +
      `Хозяйство: ${form.farm_name}\n` +
      `Номер телефона: ${form.phone_number}\n` +
      `Дата обработки: ${form.treatment_date}\n` +
      `Препарат: ${form.chemical_name}\n` +
      `Размер поля: ${form.field_size} га\n` +
      `Дата звонка: ${form.call_date}\n` +
      `Время звонка: ${form.call_time}\n` +
      `Статус задачи: ${taskStatus}`;
    
    // Создаем клавиатуру с кнопками для действий с формой
    const keyboardButtons = [];
    
    if (callTask && callTask.status === 'pending') {
      keyboardButtons.push([Markup.button.callback('✅ Отметить как выполненную', `complete_task_${form._id}`)]);
    }
    
    keyboardButtons.push(
      [Markup.button.callback('❌ Удалить форму', `delete_form_${form._id}`)],
      [Markup.button.callback('🔙 Вернуться к списку форм', 'view_forms')]
    );
    
    const keyboard = Markup.inlineKeyboard(keyboardButtons);
    
    // Отправляем текстовое сообщение с деталями формы
    await ctx.reply(message, keyboard);
    
    // Отправляем фотографии pH, если они есть
    if (form.ph_before_photo) {
      await ctx.replyWithPhoto(form.ph_before_photo, { caption: 'pH воды ДО добавления препарата' });
    }
    
    if (form.ph_after_photo) {
      await ctx.replyWithPhoto(form.ph_after_photo, { caption: 'pH воды ПОСЛЕ добавления препарата' });
    }
  } catch (error) {
    console.error('Error viewing form:', error);
    ctx.reply('Произошла ошибка при просмотре формы.', mainKeyboard);
  }
};

// Обработчик отметки задачи как выполненной
const handleCompleteTask = async (ctx) => {
  try {
    const formId = ctx.match[1];
    const callTask = await CallTask.findOne({ form_id: formId });
    
    if (!callTask) {
      ctx.reply('Задача не найдена.', mainKeyboard);
      return;
    }
    
    if (callTask.status === 'done') {
      ctx.reply('Задача уже отмечена как выполненная.', mainKeyboard);
      return;
    }
    
    // Обновляем статус задачи
    callTask.status = 'done';
    await callTask.save();
    
    ctx.reply('✅ Задача успешно отмечена как выполненная!', mainKeyboard);
  } catch (error) {
    console.error('Error completing task:', error);
    ctx.reply('Произошла ошибка при отметке задачи.', mainKeyboard);
  }
};

// Обработчик удаления формы
const handleDeleteForm = async (ctx) => {
  try {
    const formId = ctx.match[1];
    const form = await Form.findById(formId);
    
    if (!form) {
      ctx.reply('Форма не найдена.', mainKeyboard);
      return;
    }

    // Определяем сообщение подтверждения в зависимости от ID пользователя
    const confirmationMessage = ctx.from.id === 985599049 
      ? 'Миша, ты не тупишь?' 
      : 'Вы уверены?';

    // Создаем клавиатуру с кнопками подтверждения
    const confirmationKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ Да', `confirm_delete_${formId}`)],
      [Markup.button.callback('❌ Нет', 'view_forms')]
    ]);

    await ctx.reply(confirmationMessage, confirmationKeyboard);
  } catch (error) {
    console.error('Error in delete confirmation:', error);
    ctx.reply('Произошла ошибка при подтверждении удаления.', mainKeyboard);
  }
};

// Обработчик подтверждения удаления формы
const handleConfirmDelete = async (ctx) => {
  try {
    const formId = ctx.match[1];
    const form = await Form.findById(formId);
    
    if (!form) {
      ctx.reply('Форма не найдена.', mainKeyboard);
      return;
    }

    // Создаем запись в логе удаления перед удалением формы
    const deletionLog = new DeletionLog({
      form_id: form._id,
      deleted_by: {
        user_id: ctx.from.id,
        first_name: ctx.from.first_name
      },
      form_data: {
        farm_name: form.farm_name,
        treatment_date: form.treatment_date,
        chemical_name: form.chemical_name,
        field_size: form.field_size,
        ph_before: form.ph_before,
        ph_after: form.ph_after,
        call_date: form.call_date,
        call_time: form.call_time
      }
    });

    // Удаляем связанную задачу звонка
    await CallTask.deleteMany({ form_id: form._id });
    
    // Удаляем форму
    await Form.findByIdAndDelete(formId);
    
    // Сохраняем лог удаления
    await deletionLog.save();
    
    ctx.reply('Форма и связанные с ней данные успешно удалены!', mainKeyboard);
  } catch (error) {
    console.error('Error deleting form:', error);
    ctx.reply('Произошла ошибка при удалении формы.', mainKeyboard);
  }
};

module.exports = {
  handleViewForms,
  handleViewForm,
  handleDeleteForm,
  handleConfirmDelete,
  handleCompleteTask
}; 