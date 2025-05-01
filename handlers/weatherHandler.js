const axios = require('axios');
const { Markup } = require('telegraf');

// Создаем клавиатуру для запроса геолокации
const locationKeyboard = Markup.keyboard([
  [Markup.button.locationRequest('📍 Отправить геолокацию')]
]).resize();

// Обработчик кнопки погоды
const handleWeather = (ctx) => {
  ctx.reply('Пожалуйста, отправьте вашу геолокацию для получения информации о погоде:', locationKeyboard);
};

// Обработчик получения геолокации
const handleLocation = async (ctx) => {
  try {
    const { latitude, longitude } = ctx.message.location;
    
    // Получаем данные о погоде через OpenWeather API
    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        lat: latitude,
        lon: longitude,
        appid: process.env.WEATHER_API,
        units: 'metric',
        lang: 'ru'
      }
    });

    const weather = response.data;
    
    // Форматируем ответ
    const message = `
🌤️ Погода в вашем регионе:
    
Описание: ${weather.weather[0].description}
Температура: ${weather.main.temp}°C
Скорость ветра: ${weather.wind.speed} м/с
    `;

    ctx.reply(message, Markup.removeKeyboard());
  } catch (error) {
    console.error('Weather API error:', error);
    ctx.reply('Извините, не удалось получить данные о погоде. Пожалуйста, попробуйте позже.', Markup.removeKeyboard());
  }
};

module.exports = {
  handleWeather,
  handleLocation
}; 