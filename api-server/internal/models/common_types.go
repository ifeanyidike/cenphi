// models/common_types.go
package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// JSONMap is a helper type for JSON objects

type StringArray []string
type JSONMap map[string]interface{}

// JSONArray is a helper type for JSON arrays
type JSONArray []interface{}

// Scan implements the sql.Scanner interface for JSONArray
func (a *JSONArray) Scan(value interface{}) error {
	if value == nil {
		*a = JSONArray{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return fmt.Errorf("cannot scan type %T into JSONArray", value)
	}
}

// Value implements the driver.Valuer interface for JSONArray
func (a JSONArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

// --------------------------
// SCANNER & VALUER METHODS
// --------------------------

func (a *StringArray) Scan(value any) error {
	if value == nil {
		*a = StringArray{}
		return nil
	}
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, a)
	case string:
		return json.Unmarshal([]byte(v), a)
	default:
		return fmt.Errorf("cannot scan type %T into StringArray", value)
	}
}

func (a StringArray) Value() (driver.Value, error) {
	if a == nil {
		return nil, nil
	}
	return json.Marshal(a)
}

func (m *JSONMap) Scan(value interface{}) error {
	if value == nil {
		*m = JSONMap{}
		return nil
	}
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, m)
	case string:
		return json.Unmarshal([]byte(v), m)
	default:
		return fmt.Errorf("cannot scan type %T into JSONMap", value)
	}
}

func (m JSONMap) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}
