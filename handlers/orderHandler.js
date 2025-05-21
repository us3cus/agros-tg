const Order = require('../models/Order');
const { backKeyboard, mainKeyboard } = require('./mainMenu');
const { Markup } = require('telegraf');
const sellerData = require('../data/sellerData.json');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs-extra');
const path = require('path');

// Константы для дронов
const DRONES = {
  T50_BASIC: {
    name: 'Сельскохозяйственный дрон DJI Agras T50 в комплекте с генератором и батарейками',
    price: 10563605,
    nds: 1134491.61
  },
  T50_SPREADER: {
    name: 'Сельскохозяйственный дрон DJI Agras T50 в комплекте с генератором, батарейками и разбрасывателем',
    price: 11138835,
    nds: 1195230.54
  }
};

// Функция для генерации docx файла
const generateDocx = async (orderData) => {
  try {
    // Читаем шаблон
    const templatePath = path.join(__dirname, '../data/template_agreement.docx');
    const content = await fs.readFile(templatePath);
    const zip = new PizZip(content);
    
    // Создаем документ
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Подготавливаем данные для шаблона
    const templateData = {
      company_name: orderData.company_name,
      contacts: orderData.contacts,
      equipment_name: orderData.equipment.name,
      price: orderData.equipment.price.toLocaleString('ru-RU'),
      pieces: orderData.equipment.pieces,
      price_total: orderData.equipment.price_total.toLocaleString('ru-RU'),
      nds: orderData.equipment.nds_total.toLocaleString('ru-RU'),
      seller_company: sellerData.seller.seller_company,
      seller_name: sellerData.seller.director_name,
      seller_director: sellerData.seller.director_name,
      seller_data: sellerData.seller.seller_data,
      seller_phone: sellerData.seller.phone_number,
      seller_address: sellerData.seller.address,
      date: new Date().toLocaleDateString('ru-RU'),
      agreement_date: orderData.agreement_date || new Date().toLocaleDateString('ru-RU'),
      contact_number: orderData.contact_number || `№${orderData.order_id.slice(0, 8)}`,
      director: sellerData.seller.director_name,
      contract_number: orderData.contact_number || `№${orderData.order_id.slice(0, 8)}`
    };

    // Заполняем шаблон
    doc.render(templateData);

    // Генерируем docx
    const buf = doc.getZip().generate({
      type: 'nodebuffer',
      compression: 'DEFLATE'
    });

    // Сохраняем файл
    const outputPath = path.join(__dirname, `../temp/agreement_${orderData.order_id}.docx`);
    await fs.outputFile(outputPath, buf);
    return outputPath;
  } catch (error) {
    console.error('Ошибка при генерации документа:', error);
    throw error;
  }
};

// Обработчик команды /neworder
const handleNewOrderCommand = (ctx) => {
  ctx.session.order = {};  // Инициализация сессии
  ctx.session.step = 'order_company_name';  // Начинаем с первого шага
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('Заполнить автоматически', 'auto_fill')],
    [Markup.button.callback('Заполнить вручную', 'manual_fill')]
  ]);
  
  ctx.reply('Выберите способ заполнения заказа:', keyboard);
};

// Обработчик для автоматического заполнения
const handleAutoFill = async (ctx) => {
  ctx.session.order = {
    company_name: sellerData.seller.seller_company,
    contacts: `Телефон: ${sellerData.seller.phone_number}\nАдрес: ${sellerData.seller.address}`,
    seller_info: {
      name: sellerData.seller.seller_name,
      director: sellerData.seller.director_name,
      data: sellerData.seller.seller_data
    },
    agreement_date: new Date().toLocaleDateString('ru-RU')
  };
  
  // Запрашиваем выбор дрона
  handleDroneSelection(ctx);
};

// Обработчик для выбора дрона
const handleDroneSelection = (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('DJI Agras T50 (базовый)', 'select_drone_T50_BASIC')],
    [Markup.button.callback('DJI Agras T50 (с разбрасывателем)', 'select_drone_T50_SPREADER')],
    [Markup.button.callback('🔙 Назад', 'back_to_main')]
  ]);
  
  ctx.reply('Выберите модель дрона:', keyboard);
};

// Обработчик для выбора конкретного дрона
const handleSpecificDroneSelection = (ctx) => {
  const droneType = ctx.match[1];
  const drone = DRONES[droneType];
  
  ctx.session.order.equipment = {
    name: drone.name,
    price: drone.price,
    nds: drone.nds
  };
  
  ctx.session.step = 'order_pieces';
  ctx.reply('Введите количество дронов:', backKeyboard);
};

// Обработчик для ввода количества
const handlePiecesInput = (ctx) => {
  const pieces = parseInt(ctx.message.text);
  
  if (isNaN(pieces) || pieces <= 0) {
    return ctx.reply('Пожалуйста, введите корректное количество (целое число больше 0):', backKeyboard);
  }
  
  ctx.session.order.equipment.pieces = pieces;
  ctx.session.order.equipment.price_total = ctx.session.order.equipment.price * pieces;
  ctx.session.order.equipment.nds_total = ctx.session.order.equipment.nds * pieces;
  
  ctx.session.step = 'order_agreement_date';
  ctx.reply('Введите дату соглашения (например, 20.03.2024):', backKeyboard);
};

// Обработчик для ввода текста при создании заказа
const handleOrderText = async (ctx) => {
  if (!ctx.session || !ctx.session.step || !ctx.session.step.startsWith('order_')) return;

  const text = ctx.message.text;

  switch (ctx.session.step) {
    case 'order_company_name':
      ctx.session.order.company_name = text;
      ctx.session.step = 'order_contacts';
      ctx.reply('Введите контактные данные (телефон, адрес):', backKeyboard);
      break;
      
    case 'order_contacts':
      ctx.session.order.contacts = text;
      handleDroneSelection(ctx);
      break;
      
    case 'order_pieces':
      handlePiecesInput(ctx);
      break;

    case 'order_agreement_date':
      ctx.session.order.agreement_date = text;
      ctx.session.step = 'order_contact_number';
      ctx.reply('Введите номер контракта:', backKeyboard);
      break;

    case 'order_contact_number':
      ctx.session.order.contact_number = text;
      
      // Если это автозаполнение, сразу сохраняем заказ
      if (ctx.session.order.seller_info) {
        try {
          const order = new Order({
            company_name: ctx.session.order.company_name,
            contacts: ctx.session.order.contacts,
            equipment: ctx.session.order.equipment,
            seller_info: ctx.session.order.seller_info,
            agreement_date: ctx.session.order.agreement_date,
            contact_number: ctx.session.order.contact_number,
            author_id: ctx.from.id
          });
          
          const savedOrder = await order.save();
          
          // Генерируем документ
          const docxPath = await generateDocx(savedOrder);
          
          // Отправляем документ пользователю
          await ctx.replyWithDocument({
            source: docxPath,
            filename: `agreement_${savedOrder.order_id}.docx`
          });
          
          ctx.reply('Заказ успешно создан!', mainKeyboard);
          ctx.session = null;
        } catch (error) {
          console.error('Ошибка при сохранении заказа:', error);
          ctx.reply('Произошла ошибка при сохранении заказа. Пожалуйста, попробуйте еще раз.', mainKeyboard);
        }
      } else {
        // Если это ручное заполнение, запрашиваем информацию о продавце
        ctx.session.step = 'order_seller_info';
        ctx.reply('Введите информацию о продавце:', backKeyboard);
      }
      break;
      
    case 'order_seller_info':
      ctx.session.order.seller_info = {
        name: sellerData.seller.seller_name,
        director: sellerData.seller.director_name,
        data: sellerData.seller.seller_data
      };
      
      try {
        const order = new Order({
          company_name: ctx.session.order.company_name,
          contacts: ctx.session.order.contacts,
          equipment: ctx.session.order.equipment,
          seller_info: ctx.session.order.seller_info,
          agreement_date: ctx.session.order.agreement_date,
          contact_number: ctx.session.order.contact_number,
          author_id: ctx.from.id
        });
        
        const savedOrder = await order.save();
        
        // Генерируем документ
        const docxPath = await generateDocx(savedOrder);
        
        // Отправляем документ пользователю
        await ctx.replyWithDocument({
          source: docxPath,
          filename: `agreement_${savedOrder.order_id}.docx`
        });
        
        ctx.reply('Заказ успешно создан!', mainKeyboard);
        ctx.session = null;
      } catch (error) {
        console.error('Ошибка при сохранении заказа:', error);
        ctx.reply('Произошла ошибка при сохранении заказа. Пожалуйста, попробуйте еще раз.', mainKeyboard);
      }
      break;
  }
};

module.exports = {
  handleNewOrderCommand,
  handleOrderText,
  handleAutoFill,
  handleDroneSelection,
  handleSpecificDroneSelection
}; 