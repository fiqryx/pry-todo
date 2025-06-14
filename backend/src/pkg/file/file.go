package file

import (
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
)

func Create(filePath, source string, data *map[string]any) {
	dir := filepath.Dir(filePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		slog.Error("create directory",
			slog.String("path", dir),
			slog.Any("error", err))
		return
	}

	file, err := os.Create(filePath)
	if err != nil {
		slog.Error("create file",
			slog.String("path", filePath),
			slog.Any("error", err))
		return
	}
	defer file.Close()

	result := source

	if data != nil {
		for key, value := range *data {
			placeholder := "{{." + key + "}}"
			result = strings.ReplaceAll(result, placeholder, fmt.Sprintf("%v", value))
		}
	}

	if _, err := file.WriteString(result); err != nil {
		slog.Error("write file",
			slog.String("path", filePath),
			slog.Any("error", err))
		return
	}

	fmt.Printf("created: %s\n", filePath)
}
