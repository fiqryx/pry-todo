package cmd

import (
	"fmt"
	"log/slog"
	"path/filepath"
	"strings"

	c "webservices/src/pkg/common"
	"webservices/src/pkg/file"

	"github.com/spf13/cobra"
)

func NewMakeModel() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "make:model",
		Short: "Create new model",
		Run: func(cmd *cobra.Command, args []string) {
			name, err := cmd.Flags().GetString("name")
			if err != nil || name == "" {
				slog.Error("Required flag --name not provided")
				return
			}

			filename := fmt.Sprintf("%s.go", name)
			outputDir, err := cmd.Flags().GetString("output")
			if err != nil {
				slog.Error("Getting output directory: %v", slog.Any("error", err))
				return
			}

			data := map[string]any{
				"Name":      c.ToUpper(c.ToCamelCase(name)),
				"TableName": strings.ToLower(name),
			}

			file.Create(filepath.Join(outputDir, filename), modelCode, &data)
		},
	}

	cmd.Flags().StringP("name", "n", "", "Model name (required)")
	cmd.Flags().StringP("output", "o", "./src/model", "Output directory for model")

	return cmd
}

const modelCode = `package model

import (
	"time"
)

type {{.Name}} struct {
	ID        string    ` + "`" + `gorm:"primaryKey;type:uuid;default:uuid_generate_v4()" json:"id"` + "`" + `
	CreatedAt time.Time ` + "`" + `gorm:"column:created_at;default:now();<-:create" json:"createdAt"` + "`" + `
	UpdatedAt time.Time ` + "`" + `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"` + "`" + `
}

func ({{.Name}}) TableName() string {
	return "{{.TableName}}"
}
`
