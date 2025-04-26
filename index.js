const { Telegraf, session } = require('telegraf');
require('dotenv').config();
// Подключаем middleware для сессий
const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session()); // эта строка нужна для использования ctx.session

bot.start((ctx) => {
  ctx.reply('Привет! Напиши /newform чтобы создать новую форму.');
});

bot.command('newform', (ctx) => {
  ctx.session.form = {};  // Инициализация сессии
  ctx.session.step = 'farm_name';  // Начинаем с первого шага
  ctx.reply('Введите имя хозяйства:');
});

bot.on('text', async (ctx) => {
  if (!ctx.session || !ctx.session.step) return;

  const text = ctx.message.text;

  switch (ctx.session.step) {
    case 'farm_name':
      ctx.session.form.farm_name = text;
      ctx.session.step = 'treatment_date';
      ctx.reply('Введите дату обработки (ГГГГ-ММ-ДД):');
      break;
    case 'treatment_date':
      ctx.session.form.treatment_date = text;
      ctx.session.step = 'chemical_name';
      ctx.reply('Введите название препарата:');
      break;
    case 'chemical_name':
      ctx.session.form.chemical_name = text;
      ctx.session.step = 'field_size';
      ctx.reply('Введите размер поля (в гектарах):');
      break;
    case 'field_size':
      ctx.session.form.field_size = parseFloat(text);
      ctx.session.step = 'ph_before';
      ctx.reply('Введите pH воды ДО добавления препарата:');
      break;
    case 'ph_before':
      ctx.session.form.ph_before = parseFloat(text);
      ctx.session.step = 'ph_after';
      ctx.reply('Введите pH воды ПОСЛЕ добавления препарата:');
      break;
    case 'ph_after':
      ctx.session.form.ph_after = parseFloat(text);
      ctx.session.step = 'call_after_minutes';
      ctx.reply('Через сколько минут нужно позвонить клиенту?');
      break;
    case 'call_after_minutes':
      ctx.session.form.call_after_minutes = parseInt(text);
      await saveForm(ctx);
      ctx.reply('Форма успешно сохранена!');
      ctx.session = null; // очищаем сессию
      break;
  }
});

// Сохраняем данные формы в БД
async function saveForm(ctx) {
  const form = ctx.session.form;
  const client = await pool.connect();
  try {
    const result = await client.query(
      `INSERT INTO forms (farm_name, treatment_date, chemical_name, field_size, ph_before, ph_after, call_after_minutes, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING id`,
      [
        form.farm_name,
        form.treatment_date,
        form.chemical_name,
        form.field_size,
        form.ph_before,
        form.ph_after,
        form.call_after_minutes
      ]
    );

    const formId = result.rows[0].id;

    // создаём задачу звонка
    await client.query(
      `INSERT INTO call_tasks (form_id, call_at, status)
       VALUES ($1, NOW() + INTERVAL '$2 minutes', 'pending')`,
      [formId, form.call_after_minutes]
    );
  } catch (error) {
    console.error('Ошибка при сохранении формы:', error);
  } finally {
    client.release();
  }
}

bot.launch();
