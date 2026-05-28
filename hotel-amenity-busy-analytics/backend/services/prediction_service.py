"""LightGBM-backed future busy prediction for mock amenity slots.

The active app still uses mock data at runtime. This module trains one cached
LightGBM model from 90+ days of mock historical slots and predicts futureBusy
for requested slots. If LightGBM is unavailable or prediction fails, callers can
fall back to deterministic scoring.
"""

from __future__ import annotations

from datetime import date

from data.mock_slots import get_mock_historical_slots

_MODEL = None
_MODEL_READY = False
_MODEL_ERROR: str | None = None
_TRAINING_ROW_COUNT = 0


def _amenity_code(amenity_id: str) -> int:
    return sum(ord(char) for char in (amenity_id or "")) % 251


def _category_code(category: str) -> int:
    return sum(ord(char) for char in (category or "")) % 127


def _season_code(season: str) -> int:
    return {"winter": 0, "spring": 1, "summer": 2, "fall": 3}.get((season or "").lower(), 1)


def _weather_score(condition: str) -> float:
    value = (condition or "").lower()
    if value in {"severe", "storm", "hurricane", "extreme"}:
        return 1.0
    if value in {"rain", "heat", "snow", "wind", "hot"}:
        return 0.65
    if value in {"cloudy", "overcast", "moderate"}:
        return 0.35
    return 0.1


def _traffic_score(condition: str) -> float:
    value = (condition or "").lower()
    if value in {"severe", "heavy", "high", "congested"}:
        return 1.0
    if value in {"moderate", "medium"}:
        return 0.55
    if value in {"light", "low"}:
        return 0.15
    return 0.25


def _busy_score(slot: dict) -> float:
    capacity = max(slot.get("capacity", 1), 1)
    return min(slot.get("booked", 0) / capacity, 1.0)


def _demand_score(slot: dict) -> float:
    capacity = max(slot.get("capacity", 1), 1)
    return min(_busy_score(slot) + (slot.get("waitlist", 0) / capacity) * 0.5, 1.5)


def _target(slot: dict) -> float:
    if slot.get("weatherBlocked"):
        return 1.0
    busy = _busy_score(slot)
    demand = _demand_score(slot)
    weather = _weather_score(slot.get("weatherCondition", "clear"))
    traffic = _traffic_score(slot.get("trafficCondition", "light"))
    return min(1.0, busy * 0.52 + min(demand, 1.5) * 0.24 + weather * 0.12 + traffic * 0.12)


def _features(slot: dict) -> list[float]:
    slot_date = date.fromisoformat(slot["date"])
    capacity = max(slot.get("capacity", 1), 1)
    return [
        float(slot.get("timeIndex", 0)),
        float(slot_date.weekday()),
        1.0 if slot_date.weekday() >= 5 else 0.0,
        float(_season_code(slot.get("season", "spring"))),
        float(_amenity_code(slot.get("amenityId", ""))),
        float(_category_code(slot.get("category", ""))),
        1.0 if slot.get("serviceType") == "open_window" else 0.0,
        float(capacity),
        float(slot.get("booked", 0)),
        float(slot.get("available", 0)),
        float(slot.get("waitlist", 0)),
        float(_busy_score(slot)),
        float(_demand_score(slot)),
        float(_weather_score(slot.get("weatherCondition", "clear"))),
        float(slot.get("weatherSeverity", 0.0)),
        1.0 if slot.get("weatherBlocked") else 0.0,
        1.0 if slot.get("indoorWeatherBoost") else 0.0,
        float(_traffic_score(slot.get("trafficCondition", "light"))),
    ]


def _training_slots(property_id: str = "prop-001") -> list[dict]:
    # Anchor in late summer so the training set includes spring/summer and July
    # weather scenarios used by the mock experience.
    return get_mock_historical_slots(property_id, days=120, anchor_date=date(2026, 8, 15))


def train_lightgbm_model(force: bool = False):
    """Train/cache the LightGBM model and return the model or None."""
    global _MODEL, _MODEL_READY, _MODEL_ERROR, _TRAINING_ROW_COUNT
    if _MODEL_READY and not force:
        return _MODEL

    try:
        import lightgbm as lgb
        import numpy as np

        slots = _training_slots()
        x_train = [_features(slot) for slot in slots]
        y_train = [_target(slot) for slot in slots]
        dataset = lgb.Dataset(np.array(x_train, dtype=float), label=np.array(y_train, dtype=float))
        _MODEL = lgb.train(
            {
                "objective": "regression",
                "learning_rate": 0.06,
                "num_leaves": 31,
                "min_data_in_leaf": 5,
                "feature_pre_filter": False,
                "verbose": -1,
            },
            dataset,
            num_boost_round=80,
        )
        _TRAINING_ROW_COUNT = len(slots)
        _MODEL_ERROR = None
    except Exception as exc:  # pragma: no cover - defensive fallback path
        _MODEL = None
        _MODEL_ERROR = str(exc)
        _TRAINING_ROW_COUNT = 0
    finally:
        _MODEL_READY = True
    return _MODEL


def predict_future_busy(slot: dict) -> float | None:
    """Return prediction from an already-cached LightGBM model.

    This intentionally does not train lazily. Call POST /amenities/prediction/train
    when mock data changes and a refreshed model should be cached. Until then,
    callers can use deterministic fallback scoring.
    """
    if _MODEL is None:
        return None
    try:
        import numpy as np

        prediction = float(_MODEL.predict(np.array([_features(slot)], dtype=float))[0])
        return round(max(0.0, min(prediction, 1.0)), 2)
    except Exception as exc:  # pragma: no cover - defensive fallback path
        global _MODEL_ERROR
        _MODEL_ERROR = str(exc)
        return None


def prediction_status() -> dict:
    return {
        "model_ready": _MODEL_READY,
        "model_loaded": _MODEL is not None,
        "training_rows": _TRAINING_ROW_COUNT,
        "model_error": _MODEL_ERROR,
        "features": [
            "timeIndex",
            "dayOfWeek",
            "isWeekend",
            "season",
            "amenityId",
            "category",
            "serviceType",
            "capacity",
            "booked",
            "available",
            "waitlist",
            "busyScore",
            "demandScore",
            "weatherCondition",
            "weatherSeverity",
            "weatherBlocked",
            "indoorWeatherBoost",
            "trafficCondition",
        ],
    }
