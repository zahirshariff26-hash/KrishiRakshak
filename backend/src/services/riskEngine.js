function assessRisk(crop, weather) {
  const factors = [];
  let score = 0;

  if (!weather || weather.temperature == null || weather.humidity == null) {
    return { risk: 'low', score: 0, factors: ['Insufficient weather data for assessment.'], actions: ['Ensure location is correct and try again.'] };
  }

  const temp = weather.temperature;
  const humid = weather.humidity;
  const rainMm = weather.precipitation || 0;
  const windSpeed = weather.windSpeed || 0;

  const humidScore = humidRisk(crop, humid, factors);
  const rainScore = rainRisk(crop, rainMm, factors);
  const tempScore = tempRisk(crop, temp, factors);
  const wetScore = wetConditionRisk(crop, weather, factors);

  score = humidScore + rainScore + tempScore + wetScore;
  score = Math.min(score, 100);

  const risk = score >= 60 ? 'high' : score >= 30 ? 'moderate' : 'low';
  const actions = buildActions(risk, factors, crop);

  return { risk, score, factors, actions };
}

function humidRisk(crop, humid, factors) {
  if (humid >= crop.fungalHumidityThreshold + 15) {
    factors.push(`Very high humidity (${humid.toFixed(0)}%) strongly favors fungal disease development.`);
    return 30;
  }
  if (humid >= crop.fungalHumidityThreshold) {
    factors.push(`High humidity (${humid.toFixed(0)}%) creates favorable conditions for fungal growth.`);
    return 20;
  }
  if (humid >= crop.fungalHumidityThreshold - 10) {
    factors.push(`Moderate humidity (${humid.toFixed(0)}%) — conditions may support some fungal activity.`);
    return 8;
  }
  return 0;
}

function rainRisk(crop, rainMm, factors) {
  if (rainMm >= crop.rainRiskMm * 3) {
    factors.push(`Heavy rainfall (${rainMm.toFixed(1)} mm) increases leaf wetness and disease spread.`);
    return 25;
  }
  if (rainMm >= crop.rainRiskMm) {
    factors.push(`Recent rainfall (${rainMm.toFixed(1)} mm) increases leaf wetness and disease risk.`);
    return 15;
  }
  if (rainMm > 0.5) {
    factors.push(`Light precipitation (${rainMm.toFixed(1)} mm) detected.`);
    return 5;
  }
  return 0;
}

function tempRisk(crop, temp, factors) {
  if (temp >= crop.heatStressTemp) {
    factors.push(`Very high temperature (${temp.toFixed(0)}°C) may cause heat/water stress.`);
    return 20;
  }
  if (temp > crop.optTempMax) {
    factors.push(`Above-optimal temperature (${temp.toFixed(0)}°C) may increase stress.`);
    return 10;
  }
  if (temp >= crop.fungalRiskTempMin && temp <= crop.fungalRiskTempMax && temp >= 20) {
    return 5;
  }
  return 0;
}

function wetConditionRisk(crop, weather, factors) {
  const recentRain = (weather.precipitation || 0) + (weather.precipitationTomorrow || 0);
  if (recentRain >= crop.rainRiskMm * 4) {
    factors.push('Prolonged wet conditions expected over the next 2 days — high risk of blight and leaf diseases.');
    return 20;
  }
  if (recentRain >= crop.rainRiskMm * 2) {
    factors.push('Extended wet period expected — favorable conditions for disease spread.');
    return 10;
  }
  return 0;
}

function buildActions(risk, factors, crop) {
  const actions = [];
  const hasFungal = factors.some(f => f.toLowerCase().includes('fungal') || f.toLowerCase().includes('disease'));
  const hasHeat = factors.some(f => f.toLowerCase().includes('heat') || f.toLowerCase().includes('stress'));
  const hasWet = factors.some(f => f.toLowerCase().includes('wet') || f.toLowerCase().includes('prolonged'));

  if (risk === 'high') {
    if (hasFungal) {
      actions.push('Inspect lower leaves and stems for early symptoms of disease.');
      actions.push('Improve field drainage and increase plant spacing for airflow.');
      actions.push('Consider preventive fungicide application per local IPM guidelines.');
    }
    if (hasHeat) {
      actions.push('Provide shade or increase irrigation to reduce heat stress.');
      actions.push('Avoid working in the field during peak heat hours.');
    }
    if (hasWet) {
      actions.push('Monitor field moisture and remove standing water where possible.');
    }
    if (actions.length === 0) {
      actions.push('Inspect crops closely for any abnormal symptoms.');
      actions.push('Follow integrated pest management (IPM) practices.');
    }
  } else if (risk === 'moderate') {
    actions.push('Monitor crops regularly over the next few days.');
    actions.push('Maintain good field hygiene and drainage.');
    actions.push('Upload a photo for AI diagnosis if symptoms are observed.');
  } else {
    actions.push('Conditions are currently low risk. Continue routine monitoring.');
  }

  return actions;
}

module.exports = { assessRisk };
