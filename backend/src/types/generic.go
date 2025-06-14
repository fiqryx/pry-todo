package types

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type KeyValue[T any] map[string]any

type Partial[T any] struct {
	Value *T
}

type JSONPatch struct {
	Op    string `json:"op"`
	Path  string `json:"path"`
	Value any    `json:"value"`
}

type JSONB map[string]any

func (a JSONB) Value() (driver.Value, error) {
	return json.Marshal(a)
}

func (a *JSONB) Scan(value any) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to unmarshal JSONB value: %v", value)
	}

	return json.Unmarshal(bytes, &a)
}
