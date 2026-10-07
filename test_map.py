import torch
from transformers import Wav2Vec2Model
import re

def map_fairseq_to_hf(state_dict):
    new_dict = {}
    for k, v in state_dict.items():
        if not k.startswith("module."):
            continue
            
        k = k.replace("module.", "")
        
        # If it's part of the ssl_model.model (Wav2Vec2)
        if k.startswith("ssl_model.model."):
            k = k.replace("ssl_model.model.", "")
            
            # Encoder mappings
            k = k.replace(".self_attn.", ".attention.")
            k = k.replace(".fc1.", ".feed_forward.intermediate_dense.")
            k = k.replace(".fc2.", ".feed_forward.output_dense.")
            
            # Feature extractor mappings
            # .0.0.weight -> .0.conv.weight
            k = re.sub(r'conv_layers\.(\d+)\.0\.', r'conv_layers.\1.conv.', k)
            # .0.2.1.weight -> .0.layer_norm.weight (fairseq uses GroupNorm, HF uses GroupNorm but named layer_norm)
            k = re.sub(r'conv_layers\.(\d+)\.2\.1\.', r'conv_layers.\1.layer_norm.', k)
            
            # LayerNorm mappings
            k = k.replace(".self_attn_layer_norm.", ".layer_norm.")
            
            # Feature projection and others are usually the same, but let's just make sure.
            # fairseq pos_conv_embed.conv.weight_g -> HF pos_conv_embed.conv.parametrizations.weight.original0 (or similar)
            # We can skip pos_conv_embed mapping if strict=False, it will use pretrained ones.
            
            k = "ssl_model.model." + k
            
        new_dict[k] = v
    return new_dict

if __name__ == "__main__":
    import sys
    import os
    project_root = os.path.dirname(os.path.abspath(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)
        
    from original_model import Model
    model = Model(args=None, device="cpu")
    
    ckpt_path = "models/SSL_AntiSpoof/best_ssl_model.pth"
    state_dict = torch.load(ckpt_path, map_location="cpu")
    
    new_state_dict = map_fairseq_to_hf(state_dict)
    
    missing, unexpected = model.load_state_dict(new_state_dict, strict=False)
    
    print(f"Missing keys: {missing}")
    print(f"Total missing: {len(missing)}")
    print(f"Total unexpected: {len(unexpected)}")
