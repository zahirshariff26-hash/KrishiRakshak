const CROPS = {
  tomato: {
    name: 'Tomato',
    optTempMin: 20,
    optTempMax: 30,
    fungalRiskTempMin: 15,
    fungalRiskTempMax: 28,
    fungalHumidityThreshold: 75,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 35,
  },
  potato: {
    name: 'Potato',
    optTempMin: 15,
    optTempMax: 22,
    fungalRiskTempMin: 12,
    fungalRiskTempMax: 24,
    fungalHumidityThreshold: 80,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 30,
  },
  maize: {
    name: 'Maize',
    optTempMin: 21,
    optTempMax: 30,
    fungalRiskTempMin: 18,
    fungalRiskTempMax: 28,
    fungalHumidityThreshold: 75,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 35,
  },
  rice: {
    name: 'Rice',
    optTempMin: 22,
    optTempMax: 32,
    fungalRiskTempMin: 20,
    fungalRiskTempMax: 30,
    fungalHumidityThreshold: 80,
    rainRiskMm: 3,
    droughtRiskMm: 0.5,
    heatStressTemp: 38,
  },
  cotton: {
    name: 'Cotton',
    optTempMin: 25,
    optTempMax: 35,
    fungalRiskTempMin: 20,
    fungalRiskTempMax: 30,
    fungalHumidityThreshold: 75,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 40,
  },
  soybean: {
    name: 'Soybean',
    optTempMin: 20,
    optTempMax: 30,
    fungalRiskTempMin: 18,
    fungalRiskTempMax: 28,
    fungalHumidityThreshold: 80,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 35,
  },
  wheat: {
    name: 'Wheat',
    optTempMin: 15,
    optTempMax: 25,
    fungalRiskTempMin: 10,
    fungalRiskTempMax: 22,
    fungalHumidityThreshold: 80,
    rainRiskMm: 5,
    droughtRiskMm: 0.5,
    heatStressTemp: 32,
  },
};

const CROP_LIST = Object.entries(CROPS).map(([id, crop]) => ({
  id,
  name: crop.name,
}));

function getCrop(id) {
  return CROPS[id.toLowerCase()] || null;
}

module.exports = { CROPS, CROP_LIST, getCrop };
