import torch
import torch.nn as nn
from transformers import Wav2Vec2Model

# This class structure mimics the MTUCI/AASIST3 official repo
class AASIST(nn.Module):
    def __init__(self, config=None, device='cpu'):
        super(AASIST, self).__init__()
        self.device = device
        
        # 1. Front-end: Matches 'module.ssl_model.model'
        # Using a sub-class 'model' to match your checkpoint keys
        class SSLModel(nn.Module):
            def __init__(self):
                super().__init__()
                self.model = Wav2Vec2Model.from_pretrained("./models/xls-r-300m")
        
        self.ssl_model = SSLModel()

        # 2. AASIST3 Graph Headers: Matching your keys exactly
        # Based on your error: pos_S is [1, 42, 64], masters are [1, 1, 64]
        self.pos_S = nn.Parameter(torch.zeros(1, 42, 64))
        self.master1 = nn.Parameter(torch.zeros(1, 1, 64))
        self.master2 = nn.Parameter(torch.zeros(1, 1, 64))
        
        # 3. Backend Projection
        self.ll = nn.Linear(1024, 64)
        
        # 4. Classifier: Standard AASIST3 head
        self.classifier = nn.Sequential(
            nn.Linear(64, 64),
            nn.LeakyReLU(0.2),
            nn.Linear(64, 2)
        )

    def forward(self, x):
        # Extract SSL features
        # x: [Batch, Samples]
        emb = self.ssl_model.model(x).last_hidden_state
        
        # Project to 64-dim space
        x = self.ll(emb) 
        
        # Graph Pooling (Matches the 42-length pos_S)
        x = torch.nn.functional.adaptive_max_pool1d(x.transpose(1, 2), 42).transpose(1, 2)
        
        # Add Positional and Master context
        x = x + self.pos_S
        m_node = torch.mean(torch.cat([self.master1, self.master2], dim=1), dim=1, keepdim=True)
        x = x + m_node
        
        # Final Decision
        x = torch.mean(x, dim=1)
        logits = self.classifier(x)
        
        return None, logits