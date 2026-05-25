"""LightGBM-backed future busy prediction for amenity slots."""

from data.mock_slots import TIME_SLOTS, get_historical_busy_data

_MODEL = None
_MODEL_READY = False


def _amenity_code(amenity: str) -> int:
    """Stable lightweight encoding for the in-memory model features."""
    return sum(ord(ch) for ch in amenity) % 97


def _features(slot: dict) -> list[float]:
    capacity = max(slot.get("capacity", 1), 1)
    return [
        float(slot.get("booked", 0) / capacity),
        float(slot.get("waitlist", 0) / capacity),
        float(slot.get("timeIndex", _time_index(slot.get("timeSlot", "")))),
        float(_day_of_week(slot.get("date", ""))),
        float(_amenity_code(slot.get("amenity", ""))),
    ]


def _time_index(time_slot: str) -> int:
    try:
        return TIME_SLOTS.index(time_slot)
    except ValueError:
        return 0


def _day_of_week(date_str: str) -> int:
    try:
        from datetime import date

        return date.fromisoformat(date_str).weekday()
    except (TypeError, ValueError):
        return 0


def _train_model():
    """Train a tiny LightGBM regressor from the dummy historical collection."""
    global _MODEL, _MODEL_READY
    if _MODEL_READY:
        return _MODEL

    try:
        import lightgbm as lgb
    except ImportError:
        _MODEL_READY = True
        _MODEL = None
        return None

    rows = get_historical_busy_data()
    x_train = [
        [
            row["busy_score"],
            max(row["busy_score"] - 0.85, 0.0),
            row["time_index"],
            row["day_of_week"],
            _amenity_code(row["amenity"]),
        ]
        for row in rows
    ]
    y_train = [min(1.0, row["busy_score"] * 0.82 + (0.12 if row["day_of_week"] >= 5 else 0.04)) for row in rows]

    import numpy as np

    dataset = lgb.Dataset(np.array(x_train, dtype=float), label=np.array(y_train, dtype=float))
    model = lgb.train(
        {
            "objective": "regression",
            "learning_rate": 0.08,
            "num_leaves": 12,
            "min_data_in_leaf": 1,
            "verbose": -1,
        },
        dataset,
        num_boost_round=40,
    )
    _MODEL = model
    _MODEL_READY = True
    return _MODEL


def predict_future_busy(slot: dict) -> float:
    """Predict future busy score using LightGBM, falling back to demand score."""
    model = _train_model()
    if model is None:
        capacity = max(slot.get("capacity", 1), 1)
        waitlist_pressure = slot.get("waitlist", 0) / capacity
        return round(min(1.0, (slot.get("booked", 0) / capacity) + waitlist_pressure * 0.35), 2)

    import numpy as np

    prediction = float(model.predict(np.array([_features(slot)], dtype=float))[0])
    return round(max(0.0, min(prediction, 1.0)), 2)
