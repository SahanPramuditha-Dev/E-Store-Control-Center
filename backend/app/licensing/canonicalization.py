import json
from typing import Any


def _normalize_json_numbers(value: Any) -> Any:
    """Use the JSON number form shared by Python and JavaScript runtimes."""
    if isinstance(value, dict):
        return {key: _normalize_json_numbers(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize_json_numbers(item) for item in value]
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value

def canonicalize_json(data: Any) -> str:
    """
    Deterministically formats JSON data for cryptographic signing.
    - Keys are recursively sorted in lexicographical order.
    - No extraneous whitespace (compact separators: ',', ':').
    - Unicode characters are preserved or uniformly handled without escaping.
    """
    return json.dumps(_normalize_json_numbers(data), sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def canonicalize_bytes(data: Any) -> bytes:
    """Returns canonical UTF-8 encoded bytes for signing."""
    return canonicalize_json(data).encode('utf-8')
