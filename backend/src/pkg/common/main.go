package common

import (
	"crypto/rand"
	"encoding/json"
	"errors"
	"math/big"
	"os"
	"strings"
	"unicode"
	"webservices/src/pkg/log"

	"github.com/joho/godotenv"
)

func Env(key string, fallback ...string) string {
	if os.Getenv("GO_ENV") != "production" {
		if err := godotenv.Load(".env"); err != nil {
			log.Error("Note: .env file not found - using system environment variables")
		}
	}

	value := os.Getenv(strings.ToUpper(key))
	if value == "" && len(fallback) > 0 {
		return fallback[0]
	}
	return value
}

func Ptr[T any](s T) *T {
	return &s
}

func BindMap[T any](data any) (T, error) {
	var output T

	raw, ok := data.(map[string]any)
	if !ok {
		return output, errors.New("invalid data format")
	}

	bytes, err := json.Marshal(raw)
	if err != nil {
		return output, errors.New("failed to marshal data")
	}

	if err := json.Unmarshal(bytes, &output); err != nil {
		return output, errors.New("failed to unmarshal data")
	}

	return output, nil
}

func Random(length int) string {
	const chars = "abcdefghijklmnopqrstuvwxyz"
	result := make([]byte, length)

	for i := range result {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(chars))))
		if err != nil {
			return ""
		}
		result[i] = chars[n.Int64()]
	}

	return string(result)
}

func Min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func Apply[T any](f map[string]string, t map[string]T) map[string]T {
	updates := make(map[string]T)
	for key, value := range f {
		if tval, exists := t[key]; exists {
			updates[value] = tval
		}
	}
	return updates
}

func Truncate(s string, length int) string {
	if len(s) <= length {
		return s
	}
	return s[:length] + "..."
}

func SliceUnique(slice []string) []string {
	keys := make(map[string]bool)
	list := []string{}
	for _, entry := range slice {
		if _, value := keys[entry]; !value && entry != "" {
			keys[entry] = true
			list = append(list, entry)
		}
	}
	return list
}

func Contains(s string, substrs []string) bool {
	for _, sub := range substrs {
		if strings.Contains(s, sub) {
			return true
		}
	}
	return false
}

func ToCamelCase(s string) string {
	s = strings.TrimSpace(s)
	if s == "" {
		return s
	}

	var result strings.Builder
	nextUpper := false
	firstChar := true

	for _, r := range s {
		if unicode.IsSpace(r) || r == '_' || r == '-' {
			nextUpper = true
			continue
		}

		if firstChar {
			result.WriteRune(unicode.ToLower(r))
			firstChar = false
			continue
		}

		if nextUpper {
			result.WriteRune(unicode.ToUpper(r))
			nextUpper = false
		} else {
			result.WriteRune(r)
		}
	}

	return result.String()
}

func ToUpper(s string) string {
	if s == "" {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}
