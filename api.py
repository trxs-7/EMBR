from fastapi import FastAPI, File, UploadFile, Form
from pydantic import BaseModel
import torch
import torchvision.transforms.v2 as v2
from PIL import Image
from transformers import BertTokenizer
import io
import torch.nn as nn
from torchvision.models import resnet50, ResNet50_Weights
from transformers import BertModel
import uvicorn
import logging
from fastapi import HTTPException, UploadFile, File, Form
from typing import Optional
import io
import requests
# Initialize logging
my_logger = logging.getLogger()
my_logger.setLevel(logging.DEBUG)
logging.basicConfig(level=logging.DEBUG, filename='logs.log')
# Define the BERTResNetClassifier
class BERTSigLIPClassifier(nn.Module):
    def __init__(self, num_classes=2, dropout_rate=0.3):
        super(BERTSigLIPClassifier, self).__init__()
        
        # Image processing with SigLIP
        # Import SigLIP model from torchvision or transformers
        from transformers import AutoProcessor, AutoModel
        
        # SigLIP model
        self.image_processor = AutoProcessor.from_pretrained("google/siglip-base-patch16-224")
        self.image_model = AutoModel.from_pretrained("google/siglip-base-patch16-224")
        
        # Freeze early layers of SigLIP
        for i, (name, param) in enumerate(self.image_model.vision_model.named_parameters()):
            # Freeze all except the final transformer blocks
            if "encoder.layers" in name:
                layer_num = int(name.split("encoder.layers.")[1].split(".")[0])
                if layer_num < 10:  # Freeze first 10 layers (adjust as needed)
                    param.requires_grad = False
            elif "layernorm" not in name and "pooler" not in name:
                param.requires_grad = False
        
        # SigLIP vision embedding dimension is typically 768
        siglip_embedding_dim = self.image_model.vision_model.config.hidden_size
                    
        # Modify image branch with more regularization
        self.fc_image = nn.Sequential(
            nn.Linear(siglip_embedding_dim, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(dropout_rate)
        )
        
        # Text processing
        self.text_model = BertModel.from_pretrained("bert-base-uncased")
        # Freeze BERT layers except last few
        for param in self.text_model.parameters():
            param.requires_grad = False
        for param in self.text_model.encoder.layer[-2:].parameters():
            param.requires_grad = True
            
        # Modify text branch with more regularization
        self.fc_text = nn.Sequential(
            nn.Linear(self.text_model.config.hidden_size, 512),
            nn.ReLU(),
            nn.BatchNorm1d(512),
            nn.Dropout(dropout_rate)
        )
        
        # Fusion and classification layers
        self.classifier = nn.Sequential(
            nn.Linear(512, 256),
            nn.ReLU(),
            nn.BatchNorm1d(256),
            nn.Dropout(dropout_rate),
            nn.Linear(256, 1)
        )
        
    def forward(self, image, text_input_ids, text_attention_mask):
        # Image branch
        # SigLIP expects raw pixel values and handles preprocessing internally
        vision_outputs = self.image_model.vision_model(
            pixel_values=image,
            return_dict=True
        )
        x_img = vision_outputs.pooler_output  # Get the pooled image representation
        x_img = self.fc_image(x_img)
        
        # Text branch with attention-weighted pooling
        text_outputs = self.text_model(
            input_ids=text_input_ids,
            attention_mask=text_attention_mask,
            return_dict=True
        )
        
        # Attention-weighted pooling
        attention_weights = text_attention_mask.unsqueeze(-1).float()
        x_text = torch.sum(text_outputs.last_hidden_state * attention_weights, dim=1)
        x_text = x_text / torch.sum(attention_weights, dim=1)
        x_text = self.fc_text(x_text)
        
        # Maximum fusion (keeping the same fusion strategy you had)
        x_fused = torch.max(x_text, x_img)
        
        # Classification
        x_out = self.classifier(x_fused)
        return x_out


# Initialize FastAPI
app = FastAPI()

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
# Load tokenizer
tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")

# Define image transform
transform = v2.Compose([
                v2.Resize((224, 224)),            # Directly resize to 224x224 for validation/test
                v2.ToImage(),
                v2.ToDtype(torch.float32, scale=True),
                v2.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
            ])

# Ensure BERTResNetClassifier is defined before loading
model = BERTSigLIPClassifier()
model.load_state_dict(torch.load("best_model.pt", map_location=device))
model.to(device)
model.eval()

def get_bert_embedding(text: str):
    """Tokenize text for BERT."""
    inputs = tokenizer.encode_plus(
        text, add_special_tokens=True,
        return_tensors="pt",
        max_length=80,
        truncation=True,
        padding="max_length"
    )
    return inputs["input_ids"].to(device), inputs["attention_mask"].to(device)

@app.post("/predict/")
async def predict(
    image: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None),
    text: str = Form(...),
):
    """Perform inference on an image and text pair.

    Accepts either an image upload or an image link (URL or local file path).
    """
    if image is not None:
        # Read image file from UploadFile
        image_data = await image.read()
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
    elif image_url:
        # Check if image_url is a URL (starts with http/https)
        if image_url.startswith("http://") or image_url.startswith("https://"):
            headers = {"User-Agent": "Mozilla/5.0"} 
            response = requests.get(image_url, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail="Unable to fetch image from URL")
            image_data = response.content
            try:
                img = Image.open(io.BytesIO(image_data)).convert("RGB")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Unable to open image: {e}")
        else:
            # Assume image_url is a local file path
            try:
                img = Image.open(image_url).convert("RGB")
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Unable to open image from path: {e}")
    else:
        img = Image.new("RGB", (224, 224), (0, 0, 0))

    # Preprocess the image: transform, add batch dimension, and move to device
    img = transform(img).unsqueeze(0).to(device)
    
    # Process text (e.g., via a BERT tokenizer)
    input_ids, attention_mask = get_bert_embedding(text)
    
    # Perform inference
    with torch.no_grad():
        output = model(img, input_ids, attention_mask)  # Forward pass
        output = torch.softmax(output, dim=1)  # Convert logits to probabilities
        prediction = torch.argmax(output, dim=1).item()  # Get class label
    
    return {"prediction": "Class 1" if prediction == 1 else "Class 0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)