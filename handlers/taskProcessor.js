const CallTask = require('../models/CallTask');
const Form = require('../models/Form');
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

async function processTasks() {
  try {
    const now = new Date();
    const tasks = await CallTask.find({
      call_at: { $lte: now },
      status: 'pending'
    }).populate('form_id');

    for (const task of tasks) {
      // Обновляем статус задачи
      task.status = 'done';
      await task.save();

      // Получаем форму
      const form = await Form.findById(task.form_id);
      
      if (form) {
        // Отправляем сообщение автору формы
        try {
          await bot.telegram.sendMessage(
            form.author_id,
            `🔔 Напоминание: Время для звонка по форме "${form.farm_name}" наступило!\nНомер телефона: ${form.phone_number}`
          );
        } catch (error) {
          console.error(`Ошибка при отправке сообщения автору ${form.author_id}:`, error);
        }

        // Отправляем сообщение Азамату
        try {
          await bot.telegram.sendMessage(
            383906528,
            `🔔 Напоминание: Время для звонка по форме "${form.farm_name}" наступило!\nНомер телефона: ${form.phone_number}`
          );
        } catch (error) {
          console.error('Ошибка при отправке сообщения Азамату:', error);
        }

        // Удаляем задачу после отправки уведомлений
        await CallTask.findByIdAndDelete(task._id);
      }
    }
  } catch (error) {
    console.error('Ошибка при обработке задач:', error);
  }
}

// Запускаем обработку задач каждую минуту
setInterval(processTasks, 60000);

module.exports = { processTasks }; 