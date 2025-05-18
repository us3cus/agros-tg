const Order = require('../models/Order');
const { mainKeyboard } = require('./mainMenu');
const { Markup } = require('telegraf');

// Функция для просмотра списка заказов
const handleViewOrders = async (ctx) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });

    if (orders.length === 0) {
      return ctx.reply('Список заказов пуст.', mainKeyboard);
    }

    let message = '📋 *Список заказов:*\n\n';
    const inlineKeyboard = [];

    for (const order of orders) {
      message += `🔹 *Заказ*: ${order.company_name} (${order.date})\n`;
      message += `   ID: \`${order.order_id}\`\n\n`;
      
      inlineKeyboard.push([
        Markup.button.callback(`📄 ${order.company_name}`, `view_order_${order._id}`)
      ]);
    }

    inlineKeyboard.push([Markup.button.callback('🔙 Назад', 'back_to_main')]);

    await ctx.replyWithMarkdown(message, Markup.inlineKeyboard(inlineKeyboard));
  } catch (error) {
    console.error('Ошибка при получении списка заказов:', error);
    await ctx.reply('Произошла ошибка при получении списка заказов.', mainKeyboard);
  }
};

// Функция для просмотра конкретного заказа
const handleViewOrder = async (ctx) => {
  try {
    const orderId = ctx.match[1];
    const order = await Order.findById(orderId);

    if (!order) {
      return ctx.reply('Заказ не найден.', mainKeyboard);
    }

    let message = '📋 *Информация о заказе:*\n\n';
    message += `🏢 *Компания*: ${order.company_name}\n`;
    message += `📞 *Контакты*: ${order.contacts}\n`;
    message += `🚁 *Дроны*:\n`;
    
    order.drones.forEach((drone, index) => {
      message += `   ${index + 1}. ${drone}\n`;
    });
    
    message += `📅 *Дата*: ${order.date}\n`;
    message += `🆔 *ID заказа*: \`${order.order_id}\`\n`;
    message += `📝 *Статус*: ${order.status}\n`;
    
    const googleFormUrl = `https://forms.google.com/your-form-id-here?entry.999999=${order.order_id}`;
    message += `\n🔗 [Ссылка на форму](${googleFormUrl})`;

    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('❌ Удалить заказ', `delete_order_${order._id}`)],
      [Markup.button.callback('🔙 Назад к списку', 'view_orders')],
      [Markup.button.callback('🏠 На главную', 'back_to_main')]
    ]);

    await ctx.replyWithMarkdown(message, {
      ...keyboard,
      disable_web_page_preview: true
    });
  } catch (error) {
    console.error('Ошибка при получении информации о заказе:', error);
    await ctx.reply('Произошла ошибка при получении информации о заказе.', mainKeyboard);
  }
};

// Функция для удаления заказа
const handleDeleteOrder = async (ctx) => {
  try {
    const orderId = ctx.match[1];
    const order = await Order.findById(orderId);

    if (!order) {
      return ctx.reply('Заказ не найден.', mainKeyboard);
    }

    const keyboard = Markup.inlineKeyboard([
      [
        Markup.button.callback('✅ Да, удалить', `confirm_delete_order_${order._id}`),
        Markup.button.callback('❌ Отмена', `view_order_${order._id}`)
      ]
    ]);

    await ctx.reply(`Вы уверены, что хотите удалить заказ компании "${order.company_name}"?`, keyboard);
  } catch (error) {
    console.error('Ошибка при подготовке к удалению заказа:', error);
    await ctx.reply('Произошла ошибка при подготовке к удалению заказа.', mainKeyboard);
  }
};

// Функция для подтверждения удаления заказа
const handleConfirmDeleteOrder = async (ctx) => {
  try {
    const orderId = ctx.match[1];
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return ctx.reply('Заказ не найден или уже удален.', mainKeyboard);
    }

    await ctx.reply(`✅ Заказ компании "${order.company_name}" успешно удален.`, mainKeyboard);
  } catch (error) {
    console.error('Ошибка при удалении заказа:', error);
    await ctx.reply('Произошла ошибка при удалении заказа.', mainKeyboard);
  }
};

module.exports = {
  handleViewOrders,
  handleViewOrder,
  handleDeleteOrder,
  handleConfirmDeleteOrder
}; 