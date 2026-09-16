import os

# ---------------------------------------------------------
# TensorFlow / Render memory safety
# ---------------------------------------------------------
os.environ['OMP_NUM_THREADS'] = '1'
os.environ['TF_NUM_INTEROP_THREADS'] = '1'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['PYTHONMALLOC'] = 'malloc'

import gc
import json
import numpy as np
import io
from pathlib import Path
from PIL import Image, ImageStat, ImageFilter
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------
# Upload limits
# ---------------------------------------------------------
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}

BASE_DIR = Path(__file__).resolve().parent

_class_names_default = os.getenv(
    'CLASS_NAMES_PATH',
    str(BASE_DIR / 'models' / 'class_names.json')
)

_model_default = os.getenv(
    'MODEL_PATH',
    str(BASE_DIR / 'models' / 'krishirakshak_mobilenetv2_finetuned.keras')
)

_model_loaded = False
_load_attempted = False

MODEL_PATH = _model_default
CLASS_NAMES_PATH = _class_names_default

MODEL_MODE = 'mock'

# ---------------------------------------------------------
# Prediction safety thresholds
# ---------------------------------------------------------

# Original threshold was 0.50.
# 0.60 gives us a more conservative screening boundary.
CONFIDENCE_THRESHOLD = float(
    os.getenv('CONFIDENCE_THRESHOLD', '0.60')
)

# Minimum difference between first and second prediction.
# This helps identify ambiguous predictions.
MARGIN_THRESHOLD = float(
    os.getenv('MARGIN_THRESHOLD', '0.10')
)

# Basic image quality thresholds.
MIN_IMAGE_WIDTH = int(
    os.getenv('MIN_IMAGE_WIDTH', '160')
)

MIN_IMAGE_HEIGHT = int(
    os.getenv('MIN_IMAGE_HEIGHT', '160')
)

MIN_BLUR_VARIANCE = float(
    os.getenv('MIN_BLUR_VARIANCE', '20')
)

MIN_CONTRAST = float(
    os.getenv('MIN_CONTRAST', '8')
)

MIN_BRIGHTNESS = float(
    os.getenv('MIN_BRIGHTNESS', '20')
)

MAX_BRIGHTNESS = float(
    os.getenv('MAX_BRIGHTNESS', '240')
)

model = None
class_names = None


# ---------------------------------------------------------
# Advisory database
# ---------------------------------------------------------

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
        "mr": "संसर्गित पाने काढा. क्लोरोथॅलोनिल किंवा मॅन्कोझेब असलेले फंगिसाइड वापरा.",
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


# ---------------------------------------------------------
# Generic advisory
# ---------------------------------------------------------

GENERIC_ADVISORY = {
    "en": "Upload a clear image of the affected plant part (leaf, stem, or fruit) for better diagnosis. Monitor your crop regularly. Maintain field hygiene. Consult a local agricultural expert for persistent issues.",
    "hi": "बेहतर निदान के लिए प्रभावित पौधे के हिस्से की स्पष्ट तस्वीर अपलोड करें। अपनी फसल की नियमित निगरानी करें। खेत की स्वच्छता बनाए रखें।",
    "mr": "चांगला निदान करण्यासाठी प्रभावित वनस्पतीच्या भागाचे (पान, खोड किंवा फळ) स्पष्ट छायाचित्र अपलोड करा. तुमच्या पिकांचा नियमित तपास करा.",
    "te": "మెరుగైన నిర్ధారణ కోసం ప్రభావిత మొక్క భాగం (ఆకు, కాండం లేదా పండు) యొక్క స్పష్టమైన చిత్రాన్ని అప్‌లోడ్ చేయండి. మీ పంటను క్రమం తప్పకుండా పర్యవేక్షించండి. పొలం పరిశుభ్రతను కాపాడండి. నిరంతరం ఉన్న సమస్యల కోసం స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి."
}


# ---------------------------------------------------------
# Safety advisory
# ---------------------------------------------------------

SAFETY_NOTE = {
    "en": "AI screening result only — verify the diagnosis with a clear field image or local agricultural expert before making major treatment decisions.",
    "hi": "यह केवल AI स्क्रीनिंग परिणाम है — बड़े उपचार संबंधी निर्णय लेने से पहले स्पष्ट खेत की तस्वीर या स्थानीय कृषि विशेषज्ञ से निदान की पुष्टि करें।",
    "mr": "हा केवळ AI स्क्रीनिंग परिणाम आहे — मोठे उपचार निर्णय घेण्यापूर्वी स्पष्ट शेतातील प्रतिमा किंवा स्थानिक कृषी तज्ज्ञाकडून निदानाची पुष्टी करा.",
    "te": "ఇది AI స్క్రీనింగ్ ఫలితం మాత్రమే — ముఖ్యమైన చికిత్స నిర్ణయాలు తీసుకునే ముందు స్పష్టమైన పొలం చిత్రంతో లేదా స్థానిక వ్యవసాయ నిపుణుడితో నిర్ధారణను ధృవీకరించండి."
}


# ---------------------------------------------------------
# Model loading
# ---------------------------------------------------------

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

    if not class_names_exists:
        print("[ML] Class names file not found — falling back to mock mode")
        return

    try:
        import tensorflow as tf

        tf.config.threading.set_inter_op_parallelism_threads(1)
        tf.config.threading.set_intra_op_parallelism_threads(1)

        print(
            f"[ML] TensorFlow {tf.__version__} — "
            f"loading model from {MODEL_PATH}"
        )

        print("[ML] TF threading: inter=1, intra=1")

        model = tf.keras.models.load_model(MODEL_PATH)

        with open(CLASS_NAMES_PATH, 'r') as f:
            class_names = json.load(f)

        MODEL_MODE = 'real'
        _model_loaded = True

        print(
            f"[ML] Real model loaded successfully — "
            f"{len(class_names)} classes"
        )

    except Exception as e:
        print(
            f"[ML] Error loading model: {e} — "
            f"falling back to mock mode"
        )

        MODEL_MODE = 'mock'
        _model_loaded = False


# ---------------------------------------------------------
# Utility functions
# ---------------------------------------------------------

def allowed_file(filename):
    return (
        '.' in filename
        and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS
    )





ADVISORY_ALIASES = {
    "Tomato___Bacterial_spot": "Tomato_Bacterial_spot",
    "Tomato___Early_blight": "Tomato_Early_blight",
    "Tomato___Late_blight": "Tomato_Late_blight",
    "Tomato___Leaf_Mold": "Tomato_Leaf_Mold",
    "Tomato___Septoria_leaf_spot": "Tomato_Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite": "Tomato_Spider_mites",
    "Tomato___Target_Spot": "Tomato_Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": "Tomato_YellowLeafCurl_Virus",
    "Tomato___Tomato_mosaic_virus": "Tomato_Mosaic_virus",
    "Pepper,_bell___Bacterial_spot": "Pepper__bell___Bacterial_spot",
    "Pepper,_bell___healthy": "Pepper__bell___healthy",
}

def get_advisory(disease_name, lang='en'):
    disease_name = ADVISORY_ALIASES.get(disease_name, disease_name)
    clean_name = (
        disease_name
        .replace(' ', '_')
        .replace('(', '')
        .replace(')', '')
    )

    for key in ADVISORY_DB:
        if (
            key.lower().replace(' ', '_') in clean_name.lower()
            or
            clean_name.lower() in key.lower().replace(' ', '_')
        ):
            return ADVISORY_DB[key].get(
                lang,
                ADVISORY_DB[key].get('en', '')
            )

    return GENERIC_ADVISORY.get(
        lang,
        GENERIC_ADVISORY.get('en', '')
    )


def get_safety_note(lang='en'):
    return SAFETY_NOTE.get(
        lang,
        SAFETY_NOTE.get('en', '')
    )


# ---------------------------------------------------------
# Image quality checks
# ---------------------------------------------------------

def assess_image_quality(img):
    """
    Lightweight CPU-only image quality check.

    This is intentionally conservative:
    it does NOT attempt to determine whether the image
    contains a plant. It only checks obvious technical
    problems such as:
      - very small image
      - extreme darkness/brightness
      - extremely low contrast
      - severe blur
    """

    width, height = img.size

    reasons = []

    if width < MIN_IMAGE_WIDTH or height < MIN_IMAGE_HEIGHT:
        reasons.append(
            f"Image resolution is too low ({width}x{height})."
        )

    gray = img.convert('L')

    stats = ImageStat.Stat(gray)

    brightness = float(stats.mean[0])
    contrast = float(stats.stddev[0])

    # Laplacian-like edge strength approximation.
    # FIND_EDGES is much cheaper than OpenCV and avoids
    # adding another dependency to Render.
    edge_img = gray.filter(ImageFilter.FIND_EDGES)
    edge_stats = ImageStat.Stat(edge_img)
    edge_strength = float(edge_stats.mean[0])

    if brightness < MIN_BRIGHTNESS:
        reasons.append(
            "Image is too dark."
        )

    if brightness > MAX_BRIGHTNESS:
        reasons.append(
            "Image is overexposed."
        )

    if contrast < MIN_CONTRAST:
        reasons.append(
            "Image has very low contrast."
        )

    if edge_strength < MIN_BLUR_VARIANCE:
        reasons.append(
            "Image appears too blurry or out of focus."
        )

    quality_ok = len(reasons) == 0

    return {
        "ok": quality_ok,
        "width": width,
        "height": height,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "edge_strength": round(edge_strength, 2),
        "reasons": reasons
    }


# ---------------------------------------------------------
# Mock prediction
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# Health endpoint
# ---------------------------------------------------------

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "mode": MODEL_MODE,
        "model_loaded": _model_loaded
    })


# ---------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------

@app.route('/predict', methods=['POST'])
def predict():

    # ---------------------------------------------
    # Validate upload
    # ---------------------------------------------

    if 'image' not in request.files:
        return jsonify({
            "error": "No image provided",
            "error_code": "INVALID_INPUT"
        }), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({
            "error": "No image selected",
            "error_code": "INVALID_INPUT"
        }), 400

    if not allowed_file(file.filename):
        return jsonify({
            "error": "Invalid file type. Allowed: png, jpg, jpeg, webp",
            "error_code": "INVALID_INPUT"
        }), 400

    filename = secure_filename(file.filename)

    lang = request.form.get('lang', 'en')

    if lang not in {'en', 'hi', 'mr', 'te'}:
        lang = 'en'

    # ---------------------------------------------
    # Lazy model loading (loads inside the forked
    # worker, NOT the gunicorn master). This avoids
    # TF runtime corruption from --preload + fork.
    # ---------------------------------------------

    global _load_attempted
    if not _load_attempted:
        _load_attempted = True
        load_model()

    # ---------------------------------------------
    # Real model prediction
    # ---------------------------------------------

    if MODEL_MODE == 'real' and model is not None:

        try:
            gc.collect()

            # -----------------------------------------
            # Read image
            # -----------------------------------------

            img_bytes = file.read()

            if not img_bytes:
                return jsonify({
                    "error": "Uploaded image is empty",
                    "error_code": "INVALID_INPUT"
                }), 400

            try:
                img = Image.open(
                    io.BytesIO(img_bytes)
                ).convert('RGB')

            except Exception:
                return jsonify({
                    "error": "Unable to read image",
                    "error_code": "INVALID_INPUT"
                }), 400

            # -----------------------------------------
            # Image quality safety check
            # -----------------------------------------

            quality = assess_image_quality(img)

            if not quality["ok"]:

                print(
                    "[ML] Image rejected by quality check: "
                    + "; ".join(quality["reasons"])
                )

                return jsonify({
                    "mode": "real",
                    "error": (
                        "Image quality is insufficient for reliable "
                        "AI screening. Please upload a clearer, "
                        "well-lit image of the affected plant part."
                    ),
                    "error_code": "IMAGE_QUALITY_LOW",
                    "quality": quality
                }), 422

            # -----------------------------------------
            # Resize
            # -----------------------------------------

            img = img.resize((224, 224))

            # IMPORTANT:
            # The Keras model already contains its own
            # Rescaling layer.
            #
            # Therefore we MUST NOT divide by 255 here.
            img_array = np.array(
                img,
                dtype=np.float32
            )

            img_array = np.expand_dims(
                img_array,
                axis=0
            )

            input_tensor = tf.convert_to_tensor(
                img_array
            )

            # -----------------------------------------
            # Inference
            # -----------------------------------------

            output = model(
                input_tensor,
                training=False
            )

            predictions = output.numpy()[0]

            # -----------------------------------------
            # Get top predictions
            # -----------------------------------------

            sorted_indices = np.argsort(
                predictions
            )[::-1]

            predicted_index = int(
                sorted_indices[0]
            )

            second_index = int(
                sorted_indices[1]
            )

            confidence = float(
                predictions[predicted_index]
            )

            second_confidence = float(
                predictions[second_index]
            )

            prediction_margin = (
                confidence - second_confidence
            )

            disease_name = class_names[
                predicted_index
            ]

            second_disease_name = class_names[
                second_index
            ]

            # -----------------------------------------
            # Safety classification
            # -----------------------------------------

            low_confidence = (
                confidence < CONFIDENCE_THRESHOLD
            )

            ambiguous_prediction = (
                prediction_margin < MARGIN_THRESHOLD
            )

            advisory = get_advisory(
                disease_name,
                lang
            )

            safety_note = get_safety_note(lang)

            warnings = []

            if low_confidence:
                warnings.append(
                    "AI confidence is below the recommended "
                    "screening threshold."
                )

            if ambiguous_prediction:
                warnings.append(
                    "The top predictions are relatively close, "
                    "so the result may be ambiguous."
                )

            # -----------------------------------------
            # Add safety messaging
            # -----------------------------------------

            if low_confidence or ambiguous_prediction:

                advisory = (
                    f"{safety_note} "
                    f"{advisory}"
                )

            else:

                advisory = (
                    f"{advisory} "
                    f"{safety_note}"
                )

            # -----------------------------------------
            # Cleanup
            # -----------------------------------------

            del (
                img_array,
                predictions,
                img,
                img_bytes,
                input_tensor,
                output
            )

            gc.collect()

            # -----------------------------------------
            # Response
            # -----------------------------------------

            return jsonify({
                "mode": "real",
                "disease_name": disease_name,
                "confidence": confidence,

                "second_prediction": {
                    "disease_name": second_disease_name,
                    "confidence": second_confidence
                },

                "prediction_margin": prediction_margin,

                "safety": {
                    "confidence_threshold": CONFIDENCE_THRESHOLD,
                    "margin_threshold": MARGIN_THRESHOLD,
                    "low_confidence": low_confidence,
                    "ambiguous": ambiguous_prediction,
                    "image_quality": quality
                },

                "warnings": warnings,

                "treatment_advice": advisory
            })

        except Exception as e:

            gc.collect()

            print(
                f"[ML] Prediction error: {str(e)}"
            )

            return jsonify({
                "error": f"Prediction failed: {str(e)}",
                "error_code": "PREDICTION_FAILED"
            }), 500

    # ---------------------------------------------
    # Mock mode
    # ---------------------------------------------

    else:

        disease_name, confidence = mock_predict(
            filename
        )

        advisory = get_advisory(
            disease_name,
            lang
        )

        return jsonify({
            "mode": "mock",
            "disease_name": disease_name,
            "confidence": confidence,
            "treatment_advice": advisory
        })


# ---------------------------------------------------------
# Local development
# ---------------------------------------------------------

if __name__ == '__main__':

    port = int(
        os.getenv('FLASK_PORT', 5001)
    )

    print(
        f"[ML] Starting KrishiRakshak ML Service "
        f"on port {port} in {MODEL_MODE} mode"
    )

    app.run(
        host='0.0.0.0',
        port=port,
        debug=True
    )
