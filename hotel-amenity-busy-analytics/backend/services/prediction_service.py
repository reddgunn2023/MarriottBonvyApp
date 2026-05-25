"""LightGBM-backed future busy prediction for amenity slots.

The model trains from the supplied 60-day CSV when available locally. Otherwise it
uses the in-memory historical fixture so cloud agents and demos remain runnable.
Features include busy, demand, weather, traffic, time of day, day of week, and
amenity identity.
"""

import csv
import os
from pathlib import Path

from data.mock_slots import TIME_SLOTS, get_historical_busy_data

REPO_ROOT = Path(__file__).resolve().parents[3]
SOURCE_DATASET_CANDIDATES = [
    REPO_ROOT / "src/data/hotel_amenity_large_dataset_60days.csv",
    REPO_ROOT / "hotel-amenity-busy-analytics/src/data/hotel_amenity_large_dataset_60days.csv",
    Path("/Users/sgunn825/Documents/hotel_amenity_large_dataset_60days.csv"),
]


def _source_dataset() -> Path:
    override = os.environ.get("HOTEL_AMENITY_DATASET_PATH")
    if override:
        return Path(override)
    for candidate in SOURCE_DATASET_CANDIDATES:
        if candidate.exists():
            return candidate
    return SOURCE_DATASET_CANDIDATES[0]


SOURCE_DATASET = _source_dataset()
_MODEL = None
_MODEL_READY = False


def _amenity_code(amenity: str) -> int:
    """Stable lightweight encoding for model features."""
    return sum(ord(ch) for ch in amenity) % 97


def _norm_key(key: str) -> str:
    return key.strip().lower().replace(" ", "_").replace("-", "_")


def _get(row: dict, *aliases: str, default: str = "") -> str:
    normalized = {_norm_key(k): v for k, v in row.items()}
    for alias in aliases:
        value = normalized.get(_norm_key(alias))
        if value not in (None, ""):
            return str(value).strip()
    return default


def _safe_float(value: str, default: float = 0.0) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return default


def _weather_score(condition: str) -> float:
    value = condition.strip().lower()
    if value in {"severe", "storm", "hurricane", "extreme"}:
        return 1.0
    if value in {"rain", "heat", "snow", "wind", "hot"}:
        return 0.65
    if value in {"cloudy", "overcast", "moderate"}:
        return 0.35
    return 0.1


def _traffic_score(condition: str) -> float:
    value = condition.strip().lower()
    if value in {"severe", "heavy", "high", "congested"}:
        return 1.0
    if value in {"moderate", "medium"}:
        return 0.55
    if value in {"light", "low"}:
        return 0.15
    return 0.25


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


def _forecast_target(busy: float, demand: float, weather: float, traffic: float) -> float:
    return min(1.0, busy * 0.52 + min(demand, 1.5) * 0.24 + weather * 0.12 + traffic * 0.12)


def _features_from_values(
    busy: float,
    demand: float,
    weather: float,
    traffic: float,
    time_index: int,
    day_of_week: int,
    amenity: str,
) -> list[float]:
    return [
        float(busy),
        float(demand),
        float(weather),
        float(traffic),
        float(time_index),
        float(day_of_week),
        float(_amenity_code(amenity)),
    ]


def _features(slot: dict) -> list[float]:
    capacity = max(slot.get("capacity", 1), 1)
    busy = min(slot.get("booked", 0) / capacity, 1.0)
    demand = min(busy + (slot.get("waitlist", 0) / capacity) * 0.5, 1.5)
    return _features_from_values(
        busy,
        demand,
        _weather_score(slot.get("weatherCondition", "clear")),
        _traffic_score(slot.get("trafficCondition", "light")),
        slot.get("timeIndex", _time_index(slot.get("timeSlot", ""))),
        _day_of_week(slot.get("date", "")),
        slot.get("amenity", ""),
    )


def _external_training_rows() -> list[tuple[list[float], float]]:
    if not SOURCE_DATASET.exists():
        return []
    rows = []
    with SOURCE_DATASET.open(newline="") as handle:
        for row in csv.DictReader(handle):
            capacity = max(_safe_float(_get(row, "capacity", "max_capacity", "total_capacity", default="1"), 1), 1)
            booked = _safe_float(_get(row, "booked", "reserved", "reservations", "current_occupancy", "occupied", default="0"), 0)
            waitlist = _safe_float(_get(row, "waitlist", "waiting", "waiting_count", "waiting_line", default="0"), 0)
            busy = _safe_float(_get(row, "busy_score", default=""), min(booked / capacity, 1.0))
            demand = _safe_float(_get(row, "demand_score", default=""), min(busy + (waitlist / capacity) * 0.5, 1.5))
            weather = _weather_score(_get(row, "weather_condition", "weather", default="clear"))
            traffic = _traffic_score(_get(row, "traffic_condition", "traffic", default="light"))
            date_value = _get(row, "date", "slot_date", "stay_date", default="")
            time_slot = _get(row, "time_slot", "time", "slot", "period", default=TIME_SLOTS[0])
            amenity = _get(row, "amenity_name", "amenity", "service", "service_name", default="")
            target = _safe_float(
                _get(row, "future_busy", "futureBusy", "forecast_score", "predicted_busy", default=""),
                _forecast_target(busy, demand, weather, traffic),
            )
            rows.append(
                (
                    _features_from_values(
                        busy,
                        demand,
                        weather,
                        traffic,
                        _time_index(time_slot),
                        _day_of_week(date_value),
                        amenity,
                    ),
                    min(max(target, 0.0), 1.0),
                )
            )
    return rows


def _fallback_training_rows() -> list[tuple[list[float], float]]:
    rows = []
    for row in get_historical_busy_data():
        busy = row["busy_score"]
        demand = min(busy + max(busy - 0.85, 0.0) * 0.5, 1.5)
        weather = 0.65 if row["day_of_week"] >= 5 else 0.1
        traffic = 1.0 if row["time_index"] in {1, 5} and row["day_of_week"] < 5 else 0.25
        rows.append(
            (
                _features_from_values(
                    busy,
                    demand,
                    weather,
                    traffic,
                    row["time_index"],
                    row["day_of_week"],
                    row["amenity"],
                ),
                _forecast_target(busy, demand, weather, traffic),
            )
        )
    return rows


def _train_model():
    """Train a tiny LightGBM regressor from source CSV or fallback fixtures."""
    global _MODEL, _MODEL_READY
    if _MODEL_READY:
        return _MODEL

    try:
        import lightgbm as lgb
        import numpy as np
    except ImportError:
        _MODEL_READY = True
        _MODEL = None
        return None

    training_rows = _external_training_rows() or _fallback_training_rows()
    x_train = [features for features, _target in training_rows]
    y_train = [target for _features, target in training_rows]
    dataset = lgb.Dataset(np.array(x_train, dtype=float), label=np.array(y_train, dtype=float))
    model = lgb.train(
        {
            "objective": "regression",
            "learning_rate": 0.08,
            "num_leaves": 16,
            "min_data_in_leaf": 1,
            "verbose": -1,
        },
        dataset,
        num_boost_round=50,
    )
    _MODEL = model
    _MODEL_READY = True
    return _MODEL


def predict_future_busy(slot: dict) -> float:
    """Predict future busy score using LightGBM, falling back to a score formula."""
    model = _train_model()
    if model is None:
        capacity = max(slot.get("capacity", 1), 1)
        busy = min(slot.get("booked", 0) / capacity, 1.0)
        demand = min(busy + (slot.get("waitlist", 0) / capacity) * 0.5, 1.5)
        return round(
            _forecast_target(
                busy,
                demand,
                _weather_score(slot.get("weatherCondition", "clear")),
                _traffic_score(slot.get("trafficCondition", "light")),
            ),
            2,
        )

    import numpy as np

    prediction = float(model.predict(np.array([_features(slot)], dtype=float))[0])
    return round(max(0.0, min(prediction, 1.0)), 2)
