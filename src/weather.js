const axios = require("axios").default;
const xmlJs = require("xml-js");
const toUpperFirstLetterWords = require("./utils/toUpperFirstLetterWords");
const refactJsonWeather = require("./utils/refactJsonWeather");
const responseCreator = require("./utils/responseCreator");

const getWeatherData = async (province) => {
  const url = `https://data.bmkg.go.id/DataMKG/MEWS/DigitalForecast/DigitalForecast-${toUpperFirstLetterWords(
    province
  )}.xml`;
  const result = await axios.get(url);
  const weathers = xmlJs.xml2js(result.data, { compact: true, spaces: 2 });

  return refactJsonWeather(weathers);
};

const getByProvince = async (req, res) => {
  try {
    const data = await getWeatherData(req.params.province);
    let weatherToday = data.areas[0].params.find(
      (param) => param.id === "weather"
    ).times[0].name;

    let adviceToText;
    if (weatherToday === "Cerah" || weatherToday === "Cerah Berawan") {
      adviceToText = "Hari ini " + weatherToday + ", nikmati hari Anda!";
    } else if (weatherToday === "Berawan" || weatherToday === "Berawan Tebal") {
      adviceToText =
        "Hari ini " + weatherToday + ", mungkin Anda perlu membawa payung.";
    } else if (
      weatherToday === "Udara Kabur" ||
      weatherToday === "Asap" ||
      weatherToday === "Kabut"
    ) {
      adviceToText = "Hari ini " + weatherToday + ", hati-hati di jalan!";
    } else {
      adviceToText =
        "Hari ini " + weatherToday + ", jangan lupa membawa payung!";
    }
    const partialData = {
      province: data.areas[0].domain,
      temperature: data.areas[0].params.find((param) => param.id === "t")
        .times[0].celcius,
      weatherCode: data.areas[0].params.find((param) => param.id === "weather")
        .times[0].name,
      weatherToday: adviceToText,
      humidity: data.areas[0].params.find((param) => param.id === "hu").times[0]
        .value,

      hourlyTemperatureAndTime: data.areas[0].params
        .find((param) => param.id === "t")
        .times.slice(0, 6)
        .map((time, index) => {
          let date = new Date();
          date.setHours(date.getHours() + index);

          return {
            time: date.getHours() + "." + "00",
            weatherCode: data.areas[0].params.find(
              (param) => param.id === "weather"
            ).times[0].name,
            temperature: time.celcius,
          };
        }),
      windSpeed: data.areas[0].params.find((param) => param.id === "ws")
        .times[0].kph,

      windDirection: data.areas[0].params.find((param) => param.id === "wd")
        .times[0].card,
    };

    return res.status(200).send(responseCreator({ data: partialData }));
  } catch (error) {
    const status = error.response?.status === 404 ? 404 : 500;
    const message = status === 404 ? "Not found" : "Something went wrong";
    return res.status(status).send(responseCreator({ message }));
  }
};

const getByCity = async (req, res) => {
  try {
    const refactoredJsonWeathers = await getWeatherData(req.params.province);
    const weatherByCity = refactoredJsonWeathers.areas.find(
      (area) =>
        area.description == toUpperFirstLetterWords(req.params.city, "-", " ")
    );

    if (!weatherByCity) {
      return res.status(404).send(responseCreator({ message: "Not found" }));
    }

    let weatherToday = weatherByCity.params.find(
      (param) => param.id === "weather"
    ).times[0].name;

    let adviceToText;
    if (weatherToday === "Cerah" || weatherToday === "Cerah Berawan") {
      adviceToText = "Hari ini " + weatherToday + ", nikmati hari Anda!";
    } else if (weatherToday === "Berawan" || weatherToday === "Berawan Tebal") {
      adviceToText =
        "Hari ini " + weatherToday + ", mungkin Anda perlu membawa payung.";
    } else if (
      weatherToday === "Udara Kabur" ||
      weatherToday === "Asap" ||
      weatherToday === "Kabut"
    ) {
      adviceToText = "Hari ini " + weatherToday + ", hati-hati di jalan!";
    } else {
      adviceToText =
        "Hari ini " + weatherToday + ", jangan lupa membawa payung!";
    }

    const partialData = {
      province: weatherByCity.domain,
      city: weatherByCity.description,
      temperature: weatherByCity.params.find((param) => param.id === "t")
        .times[0].celcius,
      weatherCode: weatherByCity.params.find((param) => param.id === "weather")
        .times[0].name,
      weatherToday: adviceToText,
      humidity: weatherByCity.params.find((param) => param.id === "hu").times[0]
        .value,

      hourlyTemperatureAndTime: weatherByCity.params
        .find((param) => param.id === "t")
        .times.slice(0, 6)
        .map((time, index) => {
          let date = new Date();
          date.setHours(date.getHours() + index);

          return {
            time: date.getHours() + "." + "00",
            weatherCode: weatherByCity.params.find(
              (param) => param.id === "weather"
            ).times[0].name,
            temperature: time.celcius,
          };
        }),

      windSpeed: weatherByCity.params.find((param) => param.id === "ws")
        .times[0].kph,

      windDirection: weatherByCity.params.find((param) => param.id === "wd")
        .times[0].card,
    };

    return res.status(200).send(responseCreator({ data: partialData }));
  } catch (error) {
    const status = error.response?.status === 404 ? 404 : 500;
    const message = status === 404 ? "Not found" : "Something went wrong";
    return res.status(status).send(responseCreator({ message }));
  }
};

module.exports = { getByCity, getByProvince };
