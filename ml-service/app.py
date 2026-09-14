import os
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

BASE_DIR = Path(__file__).resolve().parent

_class_names_default = os.getenv('CLASS_NAMES_PATH', str(BASE_DIR / 'models' / 'class_names.json'))
_model_default = os.getenv('MODEL_PATH', str(BASE_DIR / 'models' / 'krishirakshak_mobilenetv2_finetuned.keras'))

_model_loaded = False
MODEL_PATH = _model_default
CLASS_NAMES_PATH = _class_names_default
CONFIDENCE_THRESHOLD = float(os.getenv('CONFIDENCE_THRESHOLD', '0.5'))

model = None
class_names = None

ADVISORY_DB = {
    "Tomato_Bacterial_spot": {
        "en": "Remove infected plant parts. Improve field hygiene. Avoid overhead irrigation. Apply copper-based bactericides if severe. Consult agricultural expert for persistent cases.",
        "hi": "संक्रमित पौधों के हिस्सों को हटाएं। खेत की स्वच्छता में सुधार करें। ऊपर से सिंचाई से बचें। गंभीर स्थिति में तांबा-आधारित बैक्टीरिसाइड का उपयोग करें।",
        "mr": "संसर्गित वनस्पतींचे भाग काढा. शेताची स्वच्छता सुधारा. वरून पाणी देणे टाळा. गंभीर परिस्थितीत तांबे-आधारित बैक्टीरिसाइड वापरा.",
        "te": "సోకిన మొక్కల భాగాలను తొలగించండి. పొలం పరిశుభ్రతను మెరుగుపరచండి. ఎగువ నీటిపారుదలను నివారించండి. తీవ్రమైతే రాగి ఆధారిత బ్యాక్టీరిసైడ్లు వాడండి. నిరంతరం ఉంటే వ్యవసాయ నిపుణుడిని సంప్రదించండి."
    },
    "Tomato_Early_blight": {
        "en": "Remove affected leaves. Ensure proper plant spacing. Apply mulch to reduce soil splash. Use fungicides if necessary. Rotate crops in next season.",
        "hi": "प्रभावित पत्तियों को हटाएं। पौधों के बीच उचित दूरी बनाए रखें। मल्च का उपयोग करें। आवश्यकता पर कवकनाशी का प्रयोग करें। अगले मौसम में फसल चक्र अपनाएं।",
        "mr": "प्रभावित पाने काढा. रोपांमध्ये योग्य अंतर ठेवा. मल्च वापरा. गरज असल्यास फंगिसाइड वापरा. पुढच्या हंगामात पिके फिरवा.",
        "te": "ప్రభావిత ఆకులను తొలగించండి. మొక్కల మధ్య సరైన అంతరం ఉంచండి. మల్చ్ వేసి మట్టి చల్లడాన్ని తగ్గించండి. అవసరమైతే శిలీంధ్రనాశకాలు వాడండి. తదుపరి సీజన్లో పంటలను మార్చి వేయండి."
    },
    "Tomato_Late_blight": {
        "en": "Remove and destroy infected plants immediately. Improve air circulation. Apply fungicides preventively during humid weather. Avoid overhead watering.",
        "hi": "संक्रमित पौधों को तुरंत हटाएं और नष्ट करें। वायु संचार में सुधार करें। नम मौसम में रोकथाम के लिए कवकनाशी का प्रयोग करें।",
        "mr": "संसर्गित रोपे लगेच काढून नष्ट करा. वायु संचार सुधारा. दमट हवामानात फंगिसाइड वापरा.",
        "te": "సోకిన మొక్కలను వెంటనే తొలగించి నాశనం చేయండి. గాలి ప్రసరణను మెరుగుపరచండి. తేమగా ఉన్న వాతావరణంలో నివారణగా శిలీంధ్రనాశకాలు వేయండి. ఎగువ నీటిపారుదలను నివారించండి."
    },
    "Tomato_Leaf_Mold": {
        "en": "Remove affected leaves. Improve ventilation in greenhouse. Reduce humidity. Apply appropriate fungicide. Monitor regularly.",
        "hi": "प्रभावित पत्तियों को हटाएं। ग्रीनहाउस में वेंटिलेशन में सुधार करें। आर्द्रता कम करें। नियमित निगरानी करें।",
        "mr": "प्रभावित पाने काढा. ग्रीनहाउसमध्ये वेंचिलेशन सुधारा. ओलसरपणा कमी करा.",
        "te": "ప్రభావిత ఆకులను తొలగించండి. గ్రీన్‌హౌస్‌లో వెంటిలేషన్‌ను మెరుగుపరచండి. తేమను తగ్గించండి. సరైన శిలీంధ్రనాశకం వేయండి. క్రమం తప్పకుండా పర్యవేక్షించండి."
    },
    "Tomato_Septoria_leaf_spot": {
        "en": "Remove infected leaves. Apply fungicides containing chlorothalonil or mancozeb. Practice crop rotation. Maintain proper plant spacing.",
        "hi": "संक्रमित पत्तियों को हटाएं। क्लोरोथैलोनिल या मैंकोजेब युक्त कवकनाशी का प्रयोग करें। फसल चक्र अपनाएं।",
        "mr": "संसर्गित पाने काढा. क्लोरोथैलोनिल किंवा मॅन्कोझेब असलेले फंगिसाइड वापरा.",
        "te": "సోకిన ఆకులను తొలగించండి. క్లోరోథాలోనిల్ లేదా మాంకోజెబ్ ఉన్న శిలీంధ్రనాశకాలు వేయండి. పంటల మార్పిడి చేయండి. మొక్కల మధ్య సరైన అంతరం ఉంచండి."
    },
    "Tomato_Spider_mites": {
        "en": "Spray neem oil or acaricide. Introduce predatory mites. Increase humidity around plants. Remove heavily infested leaves.",
        "hi": "नीम का तेल या अकारिसाइड का छिड़काव करें। शिकारी कीड़े पेश करें। पौधों के चारों ओर आर्द्रता बढ़ाएं।",
        "mr": "नीम तेल किंवा अॅकॅरिसाइड फवारा. शिकारी पिशवी टाका. रोपांभोवती ओलसरपणा वाढवा.",
        "te": "వేప నూనె లేదా అకారిసైడ్ స్ప్రే చేయండి. ప్రిడేటరీ మైట్లను ప్రవేశపెట్టండి. మొక్కల చుట్టూ తేమను పెంచండి. తీవ్రంగా సోకిన ఆకులను తొలగించండి."
    },
    "Tomato_Target_Spot": {
        "en": "Remove affected leaves and debris. Apply fungicides. Ensure proper drainage. Practice crop rotation.",
        "hi": "प्रभावित पत्तियों और मलबे को हटाएं। कवकनाशी का प्रयोग करें। उचित जल निकासी सुनिश्चित करें।",
        "mr": "प्रभावित पाने आणि मलबा काढा. फंगिसाइड वापरा. योग्य निचरा सुनिश्चित करा.",
        "te": "ప్రభావిత ఆకులు మరియు శిథిలాలను తొలగించండి. శిలీంధ్రనాశకాలు వేయండి. సరైన నీటి విసర్జన ఉందని నిర్ధారించండి. పంటల మార్పిడి చేయండి."
    },
    "Tomato_YellowLeafCurl_Virus": {
        "en": "Remove infected plants. Control whitefly population using yellow sticky traps. Use virus-resistant varieties. Maintain field hygiene.",
        "hi": "संक्रमित पौधों को हटाएं। पीले चिपचिपे जाल से सफेद मक्खी को नियंत्रित करें। वायरस प्रतिरोधी किस्मों का उपयोग करें।",
        "mr": "संसर्गित रोपे काढा. पिवळ्या चिकट अट्रॅपने पांढर्या माशी नियंత्रित करा.",
        "te": "సోకిన మొక్కలను తొలగించండి. పసుపు జిగట ఉచ్చులతో తెల్ల ఈగ జనాభాను నియంత్రించండి. వైరస్ నిరోధక రకాలను వాడండి. పొలం పరిశుభ్రతను కాపాడండి."
    },
    "Tomato_Mosaic_virus": {
        "en": "Remove and destroy infected plants. Disinfect tools and hands. Use certified seed. Control aphid vectors. Avoid smoking near plants.",
        "hi": "संक्रमित पौधों को हटाएं और नष्ट करें। उपकरणों को कीटाणुरहित करें। प्रमाणित बीज का उपयोग करें।",
        "mr": "संसर्गित रोपे काढून नष्ट करा. उपकरणे कीटाणूमुक्त करा. प्रमाणित बीज वापरा.",
        "te": "సోకిన మొక్కలను తొలగించి నాశనం చేయండి. పనిముట్లు మరియు చేతులను శుభ్రపరచండి. ధృవీకరించబడిన విత్తనాలను వాడండి. ఆఫిడ్ వాహకాలను నియంత్రించండి. మొక్కల దగ్గర ధూమపానం చేయవద్దు."
    },
    "Pepper__bell___Bacterial_spot": {
        "en": "Remove infected plant material. Use disease-free seeds. Apply copper-based sprays. Practice crop rotation for 2-3 years.",
        "hi": "संक्रमित पौधों की सामग्री हटाएं। रोगमुक्त बीज का उपयोग करें। तांबा-आधारित स्प्रे का उपयोग करें।",
        "mr": "संसर्गित रोपांचा माल काढा. रोगमुक्त बीज वापरा. तांबे-आधारित स्प्रे वापरा.",
        "te": "సోకిన మొక్కల పదార్థాన్ని తొలగించండి. వ్యాధి రహిత విత్తనాలను వాడండి. రాగి ఆధారిత స్ప్రేలు వేయండి. 2-3 సంవత్సరాలు పంటల మార్పిడి చేయండి."
    },
    "Pepper__bell___healthy": {
        "en": "Your pepper plant appears healthy. Continue regular monitoring and maintain good agricultural practices.",
        "hi": "आपका मिर्च का पौधा स्वस्थ प्रतीत होता है। नियमित निगरानी जारी रखें।",
        "mr": "तुमचे मिरचीचे रोप निरोगी दिसत आहे. नियमित तपासणी सुरू ठेवा.",
        "te": "మీ మిర్చి మొక్క ఆరోగ్యంగా కనిపిస్తోంది. క్రమం తప్పకుండా పర్యవేక్షణ కొనసాగించండి మరియు మంచి వ్యవసాయ పద్ధతులను కాపాడండి."
    },
    "Potato___Early_blight": {
        "en": "Remove infected lower leaves. Apply fungicides containing mancozeb or chlorothalonil. Ensure adequate nutrition. Practice rotation with non-host crops.",
        "hi": "निचली संक्रमित पत्तियों को हटाएं। मैंकोजेब युक्त कवकनाशी का प्रयोग करें। उचित पोषण सुनिश्चित करें।",
        "mr": "खालची संसर्गित पाने काढा. मॅन्कोझेब असलेले फंगिसाइड वापरा.",
        "te": "సోకిన దిగువ ఆకులను తొలగించండి. మాంకోజెబ్ లేదా క్లోరోథాలోనిల్ ఉన్న శిలీంధ్రనాశకాలు వేయండి. సరైన పోషణ ఉందని నిర్ధారించండి. హోస్ట్ కాని పంటలతో మార్పిడి చేయండి."
    },
    "Potato___Late_blight": {
        "en": "Remove and destroy infected plants immediately. Apply fungicides preventively. Ensure good drainage. Monitor weather for disease-favorable conditions.",
        "hi": "संक्रमित पौधों को तुरंत हटाएं। रोकथाम के लिए कवकनाशी का प्रयोग करें। अच्छा जल निकासी सुनिश्चित करें।",
        "mr": "संसर्गित रोपे लगेच काढून नष्ट करा. प्रतिबंधात्मक फंगिसाइड वापरा.",
        "te": "సోకిన మొక్కలను వెంటనే తొలగించి నాశనం చేయండి. నివారణగా శిలీంధ్రనాశకాలు వేయండి. మంచి నీటి విసర్జన ఉందని నిర్ధారించండి. వ్యాధి అనుకూల పరిస్థితుల కోసం వాతావరణాన్ని పర్యవేక్షించండి."
    },
    "Potato___healthy": {
        "en": "Your potato plant appears healthy. Continue regular monitoring and maintain good agricultural practices.",
        "hi": "आपका आलू का पौधा स्वस्थ प्रतीत होता है। नियमित निगरानी जारी रखें।",
        "mr": "तुमचे बटाटाचे रोप निरोगी दिसत आहे. नियमित तपासणी सुरू ठेवा.",
        "te": "మీ బంగాళాదుంప మొక్క ఆరోగ్యంగా కనిపిస్తోంది. క్రమం తప్పకుండా పర్యవేక్షణ కొనసాగించండి మరియు మంచి వ్యవసాయ పద్ధతులను కాపాడండి."
    }
}

GENERIC_ADVISORY = {
    "en": "Upload a clear image of the affected plant part (leaf, stem, or fruit) for better diagnosis. Monitor your crop regularly. Maintain field hygiene. Consult a local agricultural expert for persistent issues.",
    "hi": "बेहतर निदान के लिए प्रभावित पौधे के हिस्से की स्पष्ट तस्वीर अपलोड करें। अपनी फसल की नियमित निगरानी करें। खेत की स्वच्छता बनाए रखें।",
    "mr": "चांगला निदान करण्यासाठी प्रभावित वनस्पतीच्या भागाचे (पान, खोड किंवा फळ) स्पष्ट छायाचित्र अपलोड करा. तुमच्या पिकांचा नियमित तपास करा.",
    "te": "మెరుగైన నిర్ధారణ కోసం ప్రభావిత మొక్క భాగం (ఆకు, కాండం లేదా పండు) యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి. మీ పంటను క్రమం తప్పకుండా పర్యవేక్షించండి. పొలం పరిశుభ్రతను కాపాడండి. నిరంతరం ఉన్న సమస్యల కోసం స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి."
}


def load_model():
    global model, class_names, MODEL_MODE, _model_loaded

    env_mode = os.getenv('MODEL_MODE', '').strip().lower()
    model_exists = Path(MODEL_PATH).is_file()
    class_names_exists = Path(CLASS_NAMES_PATH).is_file()

    print(f"[ML] Resolved MODEL_PATH:      {MODEL_PATH}")
    print(f"[ML] Resolved CLASS_NAMES_PATH: {CLASS_NAMES_PATH}")
    print(f"[ML] Model file exists:         {model_exists}")
    print(f"[ML] Class names file exists:   {class_names_exists}")
    print(f"[ML] MODEL_MODE env:            {env_mode!r}")

    if env_mode == 'mock':
        print("[ML] MODEL_MODE explicitly set to 'mock' — skipping real model load")
        return

    if not model_exists:
        print("[ML] Model file not found — falling back to mock mode")
        return

    try:
        import tensorflow as tf
        print(f"[ML] TensorFlow {tf.__version__} — loading model from {MODEL_PATH}")
        model = tf.keras.models.load_model(MODEL_PATH)
        with open(CLASS_NAMES_PATH, 'r') as f:
            class_names = json.load(f)
        MODEL_MODE = 'real'
        _model_loaded = True
        print(f"[ML] Real model loaded successfully — {len(class_names)} classes")
    except Exception as e:
        print(f"[ML] Error loading model: {e} — falling back to mock mode")
        MODEL_MODE = 'mock'

load_model()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_advisory(disease_name, lang='en'):
    clean_name = disease_name.replace(' ', '_').replace('(', '').replace(')', '')
    for key in ADVISORY_DB:
        if key.lower().replace(' ', '_') in clean_name.lower() or clean_name.lower() in key.lower().replace(' ', '_'):
            return ADVISORY_DB[key].get(lang, ADVISORY_DB[key].get('en', ''))
    return GENERIC_ADVISORY.get(lang, GENERIC_ADVISORY.get('en', ''))


def mock_predict(filename):
    import random
    mock_diseases = [
        "Tomato_Bacterial_spot",
        "Tomato_Early_blight",
        "Tomato_Leaf_Mold",
        "Tomato_YellowLeafCurl_Virus",
        "Tomato_Mosaic_virus",
        "Tomato_Septoria_leaf_spot",
        "Tomato_Spider_mites",
        "Tomato_Target_Spot",
        "Pepper__bell___Bacterial_spot",
        "Potato___Early_blight",
    ]
    disease = random.choice(mock_diseases)
    confidence = round(random.uniform(0.65, 0.98), 4)
    return disease, confidence


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "mode": MODEL_MODE,
        "model_loaded": _model_loaded
    })


@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Allowed: png, jpg, jpeg, webp"}), 400

    filename = secure_filename(file.filename)
    lang = request.form.get('lang', 'en')

    if MODEL_MODE == 'real' and model is not None:
        try:
            import tensorflow as tf
            import numpy as np
            from PIL import Image
            import io

            img_bytes = file.read()
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            img = img.resize((224, 224))
            img_array = np.array(img, dtype=np.float32)
            img_array = np.expand_dims(img_array, axis=0)

            predictions = model.predict(img_array, verbose=0)
            predicted_index = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_index])
            disease_name = class_names[predicted_index]

            advisory = get_advisory(disease_name, lang)

            if confidence < CONFIDENCE_THRESHOLD:
                advisory = f"AI confidence is low ({confidence:.1%}). Please capture a clearer image or seek expert verification. {advisory}"

            return jsonify({
                "mode": "real",
                "disease_name": disease_name,
                "confidence": confidence,
                "treatment_advice": advisory
            })
        except Exception as e:
            return jsonify({"error": f"Prediction failed: {str(e)}"}), 500
    else:
        disease_name, confidence = mock_predict(filename)
        advisory = get_advisory(disease_name, lang)

        return jsonify({
            "mode": "mock",
            "disease_name": disease_name,
            "confidence": confidence,
            "treatment_advice": advisory
        })


if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    print(f"[ML] Starting KrishiRakshak ML Service on port {port} in {MODEL_MODE} mode")
    app.run(host='0.0.0.0', port=port, debug=True)
