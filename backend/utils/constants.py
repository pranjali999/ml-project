"""Business constants: crop economics and categorical vocabularies."""

# INR per quintal (illustrative — replace with DB or live feeds in production)
CROP_MSP_INR_PER_QUINTAL = {
    "rice": 2183,
    "wheat": 2125,
    "maize": 2090,
    "cotton": 6620,
    "sugarcane": 340,
    "soybean": 4600,
    "groundnut": 6335,
    "millets": 2500,
    "pulses": 7550,
    "potato": 1200,
}

# Cost per hectare (INR) — illustrative, calibrated to ML yield scale (tonnes/ha ~0.6–2.5).
# Revenue ≈ (yield_t/ha × 10 quintals/t) × MSP; break-even yield ≈ cost / (10 × MSP).
# Using cost ≈ 7.0 × MSP keeps typical model outputs profitable without changing MSP table.
def _cost_aligned_to_yield_scale(msp_per_quintal: int) -> int:
    return int(7.0 * float(msp_per_quintal))


CROP_COST_PER_HA_INR = {
    "rice": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["rice"]),
    "wheat": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["wheat"]),
    "maize": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["maize"]),
    "cotton": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["cotton"]),
    "sugarcane": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["sugarcane"]),
    "soybean": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["soybean"]),
    "groundnut": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["groundnut"]),
    "millets": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["millets"]),
    "pulses": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["pulses"]),
    "potato": _cost_aligned_to_yield_scale(CROP_MSP_INR_PER_QUINTAL["potato"]),
}

DEFAULT_CROP_KEY = "rice"

STATES = [
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal",
    "Puducherry",
    "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Lakshadweep",
]

CROPS = list(CROP_MSP_INR_PER_QUINTAL.keys())

SEASONS = ["kharif", "rabi", "zaid"]

SOIL_TYPES = ["alluvial", "black", "red", "laterite", "mountain", "arid", "unknown"]
