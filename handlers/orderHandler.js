const Order = require('../models/Order');
const { backKeyboard, mainKeyboard } = require('./mainMenu');
const { Markup } = require('telegraf');

// Обработчик команды /neworder
const handleNewOrderCommand = (ctx) => {
  ctx.session.order = {};  // Инициализация сессии
  ctx.session.step = 'order_company_name';  // Начинаем с первого шага
  ctx.reply('Введите название компании:', backKeyboard);
};

// Обработчик для ввода текста при создании заказа
const handleOrderText = async (ctx) => {
  if (!ctx.session || !ctx.session.step || !ctx.session.step.startsWith('order_')) return;

  const text = ctx.message.text;

  switch (ctx.session.step) {
    case 'order_company_name':
      ctx.session.order.company_name = text;
      ctx.session.step = 'order_contacts';
      ctx.reply('Введите контактные данные (телефон, email):', backKeyboard);
      break;
      
    case 'order_contacts':
      ctx.session.order.contacts = text;
      ctx.session.step = 'order_drones';
      ctx.reply('Введите список дронов (по одному в строке):', backKeyboard);
      break;
      
    case 'order_drones':
      // Разделяем строки и удаляем пустые
      ctx.session.order.drones = text.split('\n').filter(line => line.trim() !== '');
      ctx.session.step = 'order_date';
      ctx.reply('Введите дату в формате ДД-ММ-ГГГГ (например, 20-03-2024):', backKeyboard);
      break;
      
    case 'order_date':
      if (!/^\d{2}-\d{2}-\d{4}$/.test(text)) {
        ctx.reply('Неверный формат даты. Пожалуйста, введите дату в формате ДД-ММ-ГГГГ (например, 20-03-2024):', backKeyboard);
        return;
      }
      
      ctx.session.order.date = text;
      
      try {
        // Сохраняем заказ в базу данных
        const order = new Order({
          company_name: ctx.session.order.company_name,
          contacts: ctx.session.order.contacts,
          drones: ctx.session.order.drones,
          date: ctx.session.order.date,
          author_id: ctx.from.id
        });
        
        const savedOrder = await order.save();
        
        // Формируем ссылку на Google Forms с order_id
        const googleFormUrl = `https://forms.google.com/your-form-id-here?entry.${savedOrder.order_id}`;
        
        ctx.reply(`Заказ успешно создан!\n\nСсылка на форму: ${googleFormUrl}`, mainKeyboard);
        ctx.session = null; // Очищаем сессию
      } catch (error) {
        console.error('Ошибка при сохранении заказа:', error);
        ctx.reply('Произошла ошибка при сохранении заказа. Пожалуйста, попробуйте еще раз.', mainKeyboard);
      }
      break;
  }
};

module.exports = {
  handleNewOrderCommand,
  handleOrderText
}; 