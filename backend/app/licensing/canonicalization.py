import json
from typing import Any

def canonicalize_json(data: Any) -> str:
    """
    Deterministically formats JSON data for cryptographic signing.
    - Keys are recursively sorted in lexicographical order.
    - No extraneous whitespace (compact separators: ',', ':').
    - Unicode characters are preserved or uniformly handled without escaping.
    """
    return json.dumps(data, sort_keys=True, separators=(',', ':'), ensure_ascii=False)

def canonicalize_bytes(data: Any) -> bytes:
    """Returns canonical UTF-8 encoded bytes for signing."""
    return canonicalize_json(data).encode('utf-8')
